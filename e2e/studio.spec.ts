import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const shots = path.resolve("/workspace/bounties/buildhybridai/shots");

async function dismissOrAssertNoPageError(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

async function loadDemo(page: Page) {
  await page.getByTestId("judge-demo").click();
  await expect(page.getByTestId("brief-canvas")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "The Aster Hotel" }).first()).toBeVisible();
}

test("atelier brief studio flow, features, and v3 screenshots", async ({ page, context }) => {
  await mkdir(shots, { recursive: true });
  const errors = await dismissOrAssertNoPageError(page);

  await page.addInitScript(() => {
    class ClipboardItemMock {
      constructor(public items: Record<string, Blob>) {}
    }
    // @ts-expect-error test shim
    window.ClipboardItem = ClipboardItemMock;
    let stored = "";
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          stored = value;
        },
        readText: async () => stored,
      },
    });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByText("Atelier Brief").first()).toBeVisible();
  await expect(page.getByText("STUDIO_PREVIEW").first()).toBeVisible();
  await expect(page.getByTestId("studio-sidebar")).toBeVisible();
  await expect(page.getByTestId("bottom-nav")).toBeHidden();

  await loadDemo(page);
  await expect(page.getByTestId("design-rationale")).toBeVisible();
  await expect(page.getByText("Design Decision / 01").first()).toBeVisible();
  await expect(page.getByText(/No Firebase web config is present|deterministic, non-AI/i).first()).toBeVisible();

  await page.screenshot({
    path: path.join(shots, "v3_desktop_brief.png"),
    scale: "device",
    animations: "disabled",
  });

  await page.getByTestId("privacy-pill").click();
  await expect(page.getByTestId("privacy-drawer")).toBeVisible();
  await expect(page.getByTestId("privacy-receipt")).toBeVisible();
  await expect(page.getByText(/AB-\d{3}/).first()).toBeVisible();
  await page.screenshot({
    path: path.join(shots, "v3_privacy_receipt.png"),
    scale: "device",
    animations: "disabled",
  });

  await page.getByTestId("inspector-toggle").click();
  await expect(page.getByTestId("hybrid-inspector")).toBeVisible();
  await expect(page.getByTestId("privacy-diff")).toBeVisible();
  await expect(page.getByTestId("privacy-after")).toContainText("[CLIENT_NAME]");
  await expect(page.getByTestId("privacy-after")).not.toContainText('Maison "JJ" Aster');
  await page.screenshot({
    path: path.join(shots, "v3_inspector.png"),
    scale: "device",
    animations: "disabled",
  });
  await page.locator(".drawer .ghost").filter({ hasText: "Close" }).click();

  await page.locator('[data-tab="sitemap"]').first().click();
  await expect(page.getByTestId("sitemap-board")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Page name" }).first()).toHaveValue("Home");
  const pageNames = await page.getByRole("textbox", { name: "Page name" }).evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLInputElement).value),
  );
  expect(pageNames).toContain("Garden Room");
  expect(pageNames).toContain("L'Étoile");
  await page.screenshot({
    path: path.join(shots, "v3_sitemap.png"),
    scale: "device",
    animations: "disabled",
  });

  await page.locator('[data-tab="art"]').first().click();
  await expect(page.getByTestId("art-direction")).toBeVisible();
  await expect(page.getByText("Color study — click a swatch to copy its hex")).toBeVisible();
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByTestId("copy-css-vars").click();
  await expect(page.getByText("CSS variables copied.")).toBeVisible();
  const css = await page.evaluate(() => navigator.clipboard.readText());
  expect(css).toContain(":root {");
  expect(css).toContain("--display:");
  await expect(page.getByText("CSS variables copied.")).toHaveCount(0);
  await page.screenshot({
    path: path.join(shots, "v3_art_direction.png"),
    scale: "device",
    animations: "disabled",
  });

  await page.locator('[data-tab="export"]').first().click();
  await expect(page.getByTestId("export-handoff")).toBeVisible();
  await page.locator(".workspace-main").evaluate((el) => { el.scrollTop = 0; });
  await page.screenshot({
    path: path.join(shots, "v3_export.png"),
    scale: "device",
    animations: "disabled",
  });
  await page.getByTestId("copy-markdown").click();
  await expect(page.getByText("Markdown copied.")).toBeVisible();
  const markdown = await page.evaluate(() => navigator.clipboard.readText());
  expect(markdown).toContain("# Atelier Brief");
  expect(markdown).toContain("The Aster Hotel");
  expect(markdown).toContain("## Design Decision Rationale");
  expect(markdown).toContain("## Sitemap");

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("download-markdown").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/aster-hotel.*\.md$/);

  await page.getByTestId("delete-project").first().click();
  await expect(page.getByTestId("delete-confirm")).toBeVisible();
  await page.getByTestId("delete-confirm").getByRole("button", { name: "Keep" }).click();
  await expect(page.getByTestId("delete-confirm")).toHaveCount(0);

  await expect(page.getByText("Markdown copied.")).toHaveCount(0);
  await page.getByTestId("present-client").click();
  await expect(page.getByTestId("presentation-view")).toBeVisible();
  await expect(page.getByTestId("studio-sidebar")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "The Aster Hotel" })).toBeVisible();
  await expect(page).toHaveURL(/presentation=1/);
  await expect(page.getByText("14\\bis Rue des Teinturiers")).toHaveCount(0);
  await expect(page.getByText("jane.jj.aster@asterhotel.example")).toHaveCount(0);
  await expect(page.getByText("+33 1 42 86 17 09")).toHaveCount(0);
  await page.screenshot({
    path: path.join(shots, "v3_presentation.png"),
    scale: "device",
    animations: "disabled",
  });
  await page.getByTestId("exit-presentation").click();
  await expect(page.getByTestId("studio-sidebar")).toBeVisible();

  const mobile = await context.newPage();
  const mobileErrors = await dismissOrAssertNoPageError(mobile);
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto("/");
  await mobile.evaluate(() => document.fonts.ready);
  await expect(mobile.getByTestId("studio-sidebar")).toBeHidden();
  await expect(mobile.getByTestId("bottom-nav")).toBeVisible();
  await mobile.getByTestId("judge-demo").click();
  await expect(mobile.getByTestId("brief-canvas")).toBeVisible({ timeout: 15_000 });
  await mobile.screenshot({
    path: path.join(shots, "v3_mobile.png"),
    scale: "device",
    animations: "disabled",
  });

  const serious = [...errors, ...mobileErrors].filter(
    (line) =>
      !line.includes("favicon") &&
      !line.includes("Download the React DevTools") &&
      !/Failed to load resource/i.test(line),
  );
  expect(serious, serious.join("\n")).toEqual([]);
});
