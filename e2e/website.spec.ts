import { expect, test, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const shotDir = path.resolve("/workspace/bounties/buildhybridai/site_shots");
const SECRETS = [
  'Maison "JJ" Aster',
  "€42,000",
  "Rue des Archives",
  "ops@aster-example.test",
];

async function collectLeaks(page: Page) {
  const leaks: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    const isModel =
      /generateContent|firebasevertexai|generativelanguage|googleapis.com\/v1beta/i.test(url);
    if (!isModel) return;
    const data = `${request.postData() ?? ""} ${url}`;
    for (const secret of SECRETS) {
      if (data.includes(secret)) leaks.push(`${secret} in ${url}`);
    }
  });
  return leaks;
}

async function loadDemo(page: Page) {
  await page.goto("/");
  await page.getByTestId("judge-demo").click();
  await expect(page.getByTestId("brief-canvas")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Executive Summary" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("compose")).toBeEnabled();
}

test("build website preview, download, credits, and no confidential leaks", async ({ page }) => {
  const leaks = await collectLeaks(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await loadDemo(page);

  await page.getByTestId("stage-nav").locator('button[data-tab="site"]').click();
  await expect(page.getByTestId("website-studio")).toBeVisible();
  await expect(page.getByTestId("build-website")).toBeEnabled();
  await page.getByTestId("build-website").click();
  await expect(page.getByTestId("site-preview")).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId("website-credits")).toContainText("Basile Morin");
  await expect(page.getByTestId("website-credits")).toContainText("CC BY-SA 4.0");
  await expect(page.getByTestId("website-credits")).toContainText("Wikimedia Commons");
  await expect(page.getByTestId("website-credits")).not.toContainText(/lorem|ipsum/i);

  const frame = page.frameLocator('[data-testid="site-preview"]');
  await expect(frame.locator(".hero h1")).toBeVisible();
  await expect(frame.locator("#house")).toBeVisible();
  await expect(frame.locator("#rooms")).toBeVisible();
  await expect(frame.locator("#experiences")).toBeVisible();
  await expect(frame.locator("#gallery")).toBeVisible();
  await expect(frame.locator("#stay")).toBeVisible();
  await expect(frame.locator(".hero h1")).not.toContainText(/lorem|ipsum/i);
  await expect(frame.locator("[data-testid='site-credits']")).toContainText("Basile Morin");
  const heroText = (await frame.locator(".hero").innerText()).toLowerCase();
  expect(heroText.includes("€42,000") || heroText.includes("rue des archives")).toBeFalsy();

  await page.getByTestId("viewport-mobile").click();
  await expect(page.getByTestId("website-frame")).toHaveAttribute("data-viewport", "mobile");
  await page.getByTestId("viewport-desktop").click();
  await expect(page.getByTestId("website-frame")).toHaveAttribute("data-viewport", "desktop");

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("download-html").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/aster-hotel\.html$/i);

  await page.getByTestId("privacy-pill").click();
  await expect(page.getByTestId("receipt-photo-credits")).toContainText("Basile Morin");
  await expect(page.getByTestId("privacy-after-receipt")).not.toContainText('Maison "JJ" Aster');
  await expect(page.getByTestId("privacy-after-receipt")).not.toContainText("€42,000");
  await expect(page.getByTestId("privacy-receipt")).not.toContainText("€42,000");

  expect(leaks, `Confidential values left the device: ${leaks.join("; ")}`).toEqual([]);
});

test("capture generated site screenshots for critique", async ({ page }) => {
  test.setTimeout(60_000);
  await mkdir(shotDir, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await loadDemo(page);
  await page.getByTestId("stage-nav").locator('button[data-tab="site"]').click();
  await page.getByTestId("build-website").click();
  await expect(page.getByTestId("site-preview")).toBeVisible({ timeout: 45_000 });
  const html = await page.locator('[data-testid="site-preview"]').evaluate((el) => (el as HTMLIFrameElement).srcdoc);
  await writeFile(path.join(shotDir, "generated.html"), html, "utf8");

  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: path.join(shotDir, "01_desktop_hero.png"), fullPage: false });
  await page.locator("#rooms").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(shotDir, "02_desktop_rooms.png"), fullPage: false });
  const booking = page.locator("section.booking");
  await booking.scrollIntoViewIfNeeded();
  await booking.screenshot({ path: path.join(shotDir, "03_desktop_booking.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(shotDir, "04_mobile_hero.png"), fullPage: false });
});
