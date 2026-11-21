import { expect, test, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const shotDir = path.resolve("/workspace/bounties/buildhybridai/site_shots_v2");
const SECRETS = [
  'Maison "JJ" Aster',
  "€42,000",
  "Rue des Archives",
  "ops@aster-example.test",
  "Rue des Teinturiers",
];

function siteCopyJson() {
  return {
    kicker: "A house, not a landmark",
    headline: "Arrive slowly at [PROJECT_NAME].",
    lede: "A quieter kind of stay at [PROJECT_NAME], for guests who write to the house directly.",
    ctaLabel: "Explore the rooms",
    aboutTitle: "The house",
    aboutBody: "[PROJECT_NAME] is kept for travelers who would rather write to the house than book through a marketplace.",
    roomsTitle: "Rooms",
    rooms: [
      { name: "The Garden Suite", lede: "A high-ceilinged room with doors that open toward planted ground.", photoId: "garden" },
      { name: "The Pool Suite", lede: "Private water a few steps from the threshold.", photoId: "water" },
    ],
    experiencesTitle: "Days",
    experiences: [
      { title: "Arrive in your own time", body: "The house is arranged for a slower day." },
      { title: "Stay as a guest, not a booking", body: "Reservations are held directly." },
      { title: "A quieter kind of hospitality", body: "The rooms are for travelers who prefer houses to landmarks." },
    ],
    galleryTitle: "A few rooms, in light",
    gallery: [
      { photoId: "hero", caption: "Reference imagery, not photographs of the house." },
      { photoId: "garden", caption: "Reference imagery, not photographs of the house." },
      { photoId: "water", caption: "Reference imagery, not photographs of the house." },
    ],
    bookingTitle: "Write to the house",
    bookingBody: "Tell us when you would like to visit.",
    bookingCta: "Request your dates",
    footerTagline: "[PROJECT_NAME] — a house kept for a few, booked without a marketplace.",
  };
}

async function collectLeaks(page: Page) {
  const leaks: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    const isModel = /generateContent|firebasevertexai|generativelanguage/i.test(url);
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
  await expect(page.getByTestId("design-decisions")).toBeVisible();
  await expect(page.getByTestId("site-font-map")).toContainText("display:");
  await expect(page.getByTestId("palette-log")).toContainText("Rendered field color");

  const frame = page.frameLocator('[data-testid="site-preview"]');
  await expect(frame.locator(".hero h1")).toContainText("Arrive slowly at The Aster Hotel");
  await expect(frame.locator("#enquiry")).toBeVisible();
  await expect(frame.locator('input[name="arrival"]')).toBeVisible();
  await expect(frame.locator(".ref-label").first()).toHaveText(/Reference photography/i);
  await expect(frame.locator("#rooms")).toContainText("The Garden Suite");
  await expect(frame.locator("#rooms")).toContainText("The Pool Suite");
  const html = await page.locator('[data-testid="site-preview"]').evaluate((el) => (el as HTMLIFrameElement).srcdoc);
  expect(html).toContain("/references/garden.jpg");
  expect(html).toContain("/references/water.jpg");
  expect(html).not.toContain("€42,000");
  expect(html).not.toMatch(/booking confirmed|reservation confirmed/i);

  await page.getByTestId("viewport-mobile").click();
  await expect(page.getByTestId("website-frame")).toHaveAttribute("data-viewport", "mobile");
  await page.getByTestId("viewport-desktop").click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("download-html").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/aster-hotel\.html$/i);

  await page.getByTestId("privacy-pill").click();
  await expect(page.getByTestId("receipt-photo-credits")).toContainText("Basile Morin");
  await expect(page.getByTestId("receipt-trace")).toContainText("Private brief received");
  await expect(page.getByTestId("receipt-font-map")).toContainText("rendered");
  await expect(page.getByTestId("privacy-after-receipt")).not.toContainText('Maison "JJ" Aster');
  await expect(page.getByTestId("privacy-after-receipt")).not.toContainText("€42,000");

  expect(leaks, `Confidential values left the device: ${leaks.join("; ")}`).toEqual([]);
});

test("cloud consent sends a tokenized generateContent request", async ({ page }) => {
  test.setTimeout(60_000);
  const leaks: string[] = [];
  let sawGenerate = false;
  let body = "";
  await page.route(/generateContent/i, async (route) => {
    sawGenerate = true;
    body = route.request().postData() ?? "";
    for (const secret of SECRETS) {
      if (body.includes(secret)) leaks.push(secret);
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        candidates: [
          {
            content: { role: "model", parts: [{ text: JSON.stringify(siteCopyJson()) }] },
            finishReason: "STOP",
            index: 0,
          },
        ],
      }),
    });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await loadDemo(page);
  await page.getByTestId("edit-details").click();
  await expect(page.getByTestId("cloud-consent")).toBeVisible();
  await page.getByTestId("cloud-consent").locator("input").check();
  await page.locator(".drawer-backdrop").click({ position: { x: 4, y: 4 } });
  await expect(page.getByTestId("details-drawer")).toHaveCount(0);
  await page.getByTestId("stage-nav").locator('button[data-tab="site"]').click();
  await page.getByTestId("build-website").click();
  await expect(page.getByTestId("site-preview")).toBeVisible({ timeout: 45_000 });
  expect(sawGenerate, "Cloud consent was on, so the studio should have issued a generateContent request.").toBeTruthy();
  expect(leaks, `Raw confidential values in generateContent: ${leaks.join(", ")}`).toEqual([]);
  expect(body).toMatch(/\[CLIENT_NAME\]|\[PROJECT_NAME\]/);
  expect(body).toContain("[BUDGET]");
  const frame = page.frameLocator('[data-testid="site-preview"]');
  await expect(frame.locator(".hero h1")).toContainText("The Aster Hotel");
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
