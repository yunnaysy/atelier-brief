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

test("atelier brief studio flow, features, and v3.1 screenshots", async ({ page, context }) => {
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
  await expect(page.getByTestId("status-strip")).toContainText(/Studio preview · No cloud call/i);
  await expect(page.getByText("STUDIO_PREVIEW")).toHaveCount(0);
  await expect(page.getByTestId("studio-sidebar")).toBeVisible();
  await expect(page.getByTestId("bottom-nav")).toBeHidden();
  await expect(page.getByTestId("header-export")).toHaveCount(0);
  await expect(page.getByTestId("judge-demo")).toBeVisible();

  await loadDemo(page);
  await expect(page.getByTestId("brief-canvas")).toBeVisible();
  await expect(page.getByTestId("design-rationale")).toBeVisible();
  await expect(page.getByText("Design Decision / 01").first()).toBeVisible();
  // Unconfigured builds show Studio Preview; configured builds without cloud consent show a calm local-draft note.
  await expect(page.getByTestId("status-strip")).toContainText(
    /Studio preview · No cloud call|Local draft · Cloud AI off until you approve redacted sharing/i,
  );
  await expect(page.getByTestId("status-strip")).not.toContainText(/fail/i);
  // Lucide icon system: decorative, monochrome, with an explicit current tab.
  await expect(page.getByTestId("stage-nav").locator('button[aria-current="page"]')).toHaveCount(1);
  await expect(page.getByTestId("stage-nav").locator("svg.ab-icon[aria-hidden='true']")).toHaveCount(4);
  await expect(page.getByTestId("project-header").locator("svg.ab-icon")).toHaveCount(3);
  await expect(page.getByText("STUDIO_PREVIEW")).toHaveCount(0);
  await expect(page.getByTestId("judge-demo")).toHaveCount(0);
  await expect(page.getByText("almost smell")).toHaveCount(0);
  await expect(page.getByText("32–58")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Executive Summary" })).toBeVisible();
  await expect(page.getByText("Priortiy")).toHaveCount(0);
  const regen = page.getByTestId("regen-executive-summary");
  await expect(regen).toBeVisible();
  const regenOverflow = await regen.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
  expect(regenOverflow, "Regenerate button label is clipped").toBeTruthy();
  const regenText = (await regen.innerText()).replace(/\s+/g, " ").trim();
  expect(["Regenerate brief", "Regenerate", "Regenerating…"]).toContain(regenText);

  await page.screenshot({
    path: path.join(shots, "v3_1_desktop_brief.png"),
    scale: "device",
    animations: "disabled",
  });

  await page.getByTestId("privacy-pill").click();
  await expect(page.getByTestId("privacy-drawer")).toBeVisible();
  await expect(page.getByTestId("privacy-receipt")).toBeVisible();
  await expect(page.getByText(/AB-\d{3}/).first()).toBeVisible();
  await expect(page.getByTestId("hybrid-architecture")).toBeVisible();
  await expect(page.getByTestId("privacy-sent-payload")).toBeVisible();
  await expect(page.getByTestId("privacy-after-receipt")).toContainText("[CLIENT_NAME]");
  await expect(page.getByTestId("privacy-after-receipt")).toContainText("[BUDGET_RANGE]");
  await expect(page.getByTestId("privacy-after-receipt")).toContainText("[PROPRIETARY_NOTES]");
  await expect(page.getByTestId("privacy-after-receipt")).not.toContainText('Maison "JJ" Aster');
  await expect(page.getByTestId("privacy-after-receipt")).not.toContainText("€42,000");
  await expect(page.getByTestId("privacy-after-receipt")).not.toContainText("jane.jj.aster@asterhotel.example");
  await expect(page.getByTestId("device-original")).toBeVisible();
  await expect(page.getByTestId("device-original")).not.toHaveAttribute("open");
  await expect(page.getByTestId("privacy-before")).toHaveCount(0);
  await expect(page.getByTestId("privacy-receipt")).not.toContainText('Maison "JJ" Aster');
  await expect(page.getByTestId("privacy-receipt")).not.toContainText("€42,000");
  await page.screenshot({
    path: path.join(shots, "v3_1_privacy_receipt.png"),
    scale: "device",
    animations: "disabled",
  });

  await page.getByTestId("inspector-toggle").click();
  await expect(page.getByTestId("hybrid-inspector")).toBeVisible();
  await expect(page.getByTestId("privacy-diff")).toBeVisible();
  await expect(page.getByTestId("privacy-after")).toContainText("[CLIENT_NAME]");
  await expect(page.getByTestId("privacy-after")).toContainText("[BUDGET_RANGE]");
  await expect(page.getByTestId("privacy-after")).toContainText("Compose a complete website brief");
  await expect(page.getByTestId("privacy-after")).not.toContainText('Maison "JJ" Aster');
  await expect(page.getByTestId("privacy-after")).not.toContainText("€42,000");
  await expect(page.getByTestId("privacy-after")).not.toContainText("jane.jj.aster@asterhotel.example");
  // On-device original is collapsed so the default view only shows tokens.
  await expect(page.getByTestId("device-original")).toBeVisible();
  await expect(page.getByTestId("device-original")).not.toHaveAttribute("open");
  await expect(page.getByTestId("privacy-before")).toHaveCount(0);
  await page.screenshot({
    path: path.join(shots, "v3_1_inspector.png"),
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
    path: path.join(shots, "v3_1_sitemap.png"),
    scale: "device",
    animations: "disabled",
  });

  await page.locator('[data-tab="art"]').first().click();
  await expect(page.getByTestId("art-direction")).toBeVisible();
  await expect(page.getByText("Color study — click a swatch to copy its hex")).toBeVisible();
  await expect(page.locator(".display")).toHaveText("The Aster Hotel");
  await expect(page.getByText("Terracotta")).toHaveCount(0);
  await expect(page.getByText("#B76E55")).toHaveCount(0);
  await expect(page.getByText("Stone Paper")).toBeVisible();
  await expect(page.getByText("Discover the property.")).toBeVisible();
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByTestId("copy-css-vars").click();
  await expect(page.getByText("CSS variables copied.")).toBeVisible();
  const css = await page.evaluate(() => navigator.clipboard.readText());
  expect(css).toContain(":root {");
  expect(css).toContain("--display:");
  await expect(page.getByText("CSS variables copied.")).toHaveCount(0);
  await page.screenshot({
    path: path.join(shots, "v3_1_art_direction.png"),
    scale: "device",
    animations: "disabled",
  });

  await page.locator('[data-tab="export"]').first().click();
  await expect(page.getByTestId("export-handoff")).toBeVisible();
  await page.locator(".workspace-main").evaluate((el) => { el.scrollTop = 0; });
  await page.screenshot({
    path: path.join(shots, "v3_1_export.png"),
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
  await expect(page.getByText("Version 01")).toBeVisible();
  await expect(page.getByText(/AB-[0-9A-F]{6}/)).toHaveCount(0);
  await expect(page).toHaveURL(/presentation=1/);
  await expect(page.getByText("14\\bis Rue des Teinturiers")).toHaveCount(0);
  await expect(page.getByText("jane.jj.aster@asterhotel.example")).toHaveCount(0);
  await expect(page.getByText("+33 1 42 86 17 09")).toHaveCount(0);
  await page.screenshot({
    path: path.join(shots, "v3_1_presentation.png"),
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
  if (await mobile.getByTestId("brief-canvas").count() === 0) {
    await mobile.getByTestId("judge-demo").click();
  }
  await expect(mobile.getByTestId("brief-canvas")).toBeVisible({ timeout: 15_000 });
  await expect(mobile.getByTestId("brief-canvas").getByRole("heading", { name: "Executive Summary" })).toBeVisible();
  const navBox = await mobile.getByTestId("bottom-nav").boundingBox();
  const summaryBox = await mobile.getByTestId("brief-canvas").getByRole("heading", { name: "Executive Summary" }).boundingBox();
  expect(navBox).toBeTruthy();
  expect(summaryBox).toBeTruthy();
  expect(summaryBox!.y + summaryBox!.height).toBeLessThanOrEqual(navBox!.y + 1);
  await expect(mobile.getByText("STUDIO_PREVIEW")).toHaveCount(0);
  await mobile.screenshot({
    path: path.join(shots, "v3_1_mobile.png"),
    scale: "device",
    animations: "disabled",
  });

  const serious = [...errors, ...mobileErrors].filter(
    (line) =>
      !line.includes("favicon") &&
      !line.includes("Download the React DevTools") &&
      !/Failed to load resource/i.test(line) &&
      !/App Check|appCheck|reCAPTCHA|recaptcha/i.test(line) &&
      !/Unable to obtain a valid App Check token/i.test(line),
  );
  expect(serious, serious.join("\n")).toEqual([]);
});
