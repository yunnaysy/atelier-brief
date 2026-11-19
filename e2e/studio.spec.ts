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

test("atelier brief studio flow and screenshots", async ({ page, context }) => {
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

  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole("heading", { name: "Atelier Brief" })).toBeVisible();
  await expect(page.getByText("Local Preview").first()).toBeVisible();

  await page.locator('[data-preset="harbor-line"]').click();
  await expect(page.getByRole("textbox", { name: "Client name" })).toHaveValue("Harbor & Line Architects");

  await page.locator('[data-preset="kiln-grain"]').click();
  await expect(page.getByRole("textbox", { name: "Client name" })).toHaveValue("Kiln & Grain");

  await page.locator('[data-preset="harbor-line"]').click();
  await page.getByTestId("compose").click();
  await expect(page.getByTestId("brief-canvas")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "Harbor & Line — Studio Website" })).toBeVisible();
  await expect(page.getByText("Executive Summary")).toBeVisible();
  await expect(page.getByText(/Local Preview/).first()).toBeVisible();
  await expect(page.getByText(/No Firebase web config is present/)).toBeVisible();

  await page.locator(".rail").evaluate((el) => { el.scrollTop = 0; });
  await page.screenshot({
    path: path.join(shots, "01_brief_canvas.png"),
    scale: "device",
    animations: "disabled",
  });

  await page.locator('[data-tab="sitemap"]').click();
  await expect(page.getByTestId("sitemap-board")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Page name" }).first()).toHaveValue("Home");
  await page.locator(".rail").evaluate((el) => { el.scrollTop = 0; });
  await page.screenshot({
    path: path.join(shots, "02_sitemap.png"),
    scale: "device",
    animations: "disabled",
  });

  await page.locator('[data-tab="art"]').click();
  await expect(page.getByTestId("art-direction")).toBeVisible();
  await expect(page.getByText("Palette & contrast against the field and the ink")).toBeVisible();
  await page.locator(".rail").evaluate((el) => { el.scrollTop = 0; });
  await page.screenshot({
    path: path.join(shots, "03_art_direction.png"),
    scale: "device",
    animations: "disabled",
  });

  await page.locator('[data-tab="export"]').click();
  await expect(page.getByTestId("export-handoff")).toBeVisible();

  await page.getByTestId("privacy-toggle").click();
  await expect(page.getByRole("button", { name: /Privacy Shield off/i })).toBeVisible();
  await page.getByTestId("privacy-toggle").click();
  await expect(page.getByRole("button", { name: /Privacy Shield on/i })).toBeVisible();

  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByTestId("copy-markdown").click();
  await expect(page.getByText("Markdown copied.")).toBeVisible();
  const markdown = await page.evaluate(() => navigator.clipboard.readText());
  expect(markdown).toContain("# Harbor & Line — Studio Website");
  expect(markdown).toContain("## Executive Summary");
  expect(markdown).toContain("## Sitemap");
  expect(markdown).toContain("## Art direction");

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("download-markdown").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/harbor-line.*\.md$/);

  const mobile = await context.newPage();
  const mobileErrors = await dismissOrAssertNoPageError(mobile);
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto("/");
  await mobile.evaluate(() => document.fonts.ready);
  await mobile.locator('[data-preset="harbor-line"]').click();
  await mobile.getByTestId("compose").click();
  await expect(mobile.getByTestId("brief-canvas")).toBeVisible({ timeout: 10_000 });
  await mobile.getByRole("button", { name: "Hide" }).click();
  await mobile.screenshot({
    path: path.join(shots, "04_mobile.png"),
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
