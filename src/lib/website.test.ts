import assert from "node:assert/strict";
import test from "node:test";
import { buildRedactedWebsitePrompt } from "./cloudPrompt";
import { composeLocalBrief } from "./localStudio";
import { planPrivacyShield, restoreValue } from "./privacyShield";
import { composeLocalWebsite, lintGuestCopy, LOREM_RE, scrubSiteCopy, STRATEGY_LANGUAGE_RE, validateSiteCopy } from "./siteCopy";
import { creditsForCopy, renderSiteHtml } from "./siteRenderer";
import { isWarmCreamHex, resolveFonts, resolvePalette } from "./siteTheme";
import { defaultArtDirection, type Intake } from "./types";

function asterIntake(): Intake {
  return {
    projectName: "The Aster Hotel",
    clientName: 'Maison "JJ" Aster & Co.',
    industry: "Independent boutique hospitality",
    budget: "€42,000–€58,000 (design + build)",
    timeline: "14 weeks, soft opening in late spring",
    tones: ["quiet", "editorial", "hospitable"],
    voiceReserve: 62,
    coreGoal: "Increase direct reservations without sounding like a booking engine.",
    audience: "Couples and small private groups who already stay in discreet European houses.",
    confidentialNotes: "Do not mention the family office on Rue des Archives. Contact: ops@aster-example.test, +33 1 23 45 67 89.",
  };
}

test("local website copy is complete, guest-facing, and scrubs confidential values", () => {
  const intake = asterIntake();
  const bundle = composeLocalBrief(intake);
  const copy = composeLocalWebsite({
    intake,
    sections: bundle.sections,
    sitemap: bundle.sitemap,
    artDirection: bundle.artDirection,
  });
  const checked = validateSiteCopy(copy);
  assert.equal(checked.ok, true, checked.errors.join(" "));
  assert.ok(copy.rooms.length >= 2);
  assert.ok(copy.experiences.length >= 3);
  assert.equal(LOREM_RE.test(JSON.stringify(copy)), false);
  assert.equal(STRATEGY_LANGUAGE_RE.test(JSON.stringify(copy)), false);
  const blob = JSON.stringify(copy);
  assert.equal(blob.includes("€42,000"), false);
  assert.equal(blob.includes("Rue des Archives"), false);
  assert.ok(blob.includes("The Aster Hotel"));
  assert.equal(copy.rooms[0].photoId, "garden");
  assert.equal(copy.rooms[1].photoId, "water");
  assert.notEqual(copy.rooms[0].photoId, copy.rooms[1].photoId);
  assert.ok(copy.rooms[0].lede.toLowerCase().includes("planted") || copy.rooms[0].name.includes("Garden"));
  assert.ok(copy.rooms[1].lede.toLowerCase().includes("water") || copy.rooms[1].name.includes("Pool"));
});

test("website cloud prompt is tokenized and redacts brief bodies", () => {
  const intake = asterIntake();
  const bundle = composeLocalBrief(intake);
  bundle.sections[0] = {
    ...bundle.sections[0],
    body: `For Maison "JJ" Aster & Co. the budget is €42,000–€58,000 (design + build). ${intake.confidentialNotes}`,
  };
  const plan = planPrivacyShield(intake);
  const prompt = buildRedactedWebsitePrompt(intake, bundle.sections, bundle.sitemap, bundle.artDirection, plan);
  assert.equal(prompt.includes('Maison "JJ" Aster'), false);
  assert.equal(prompt.includes("€42,000"), false);
  assert.equal(prompt.includes("Rue des Archives"), false);
  assert.equal(prompt.includes("ops@aster-example.test"), false);
  assert.equal(prompt.includes("+33 1 23 45 67 89"), false);
  assert.ok(prompt.includes("[CLIENT_NAME]") || prompt.includes("[PROJECT_NAME]"));
  assert.ok(prompt.includes("Client: [CLIENT_NAME]"));
  assert.ok(prompt.includes("Budget: [BUDGET_RANGE]"));
  assert.ok(prompt.includes("Project: [PROJECT_NAME]"));
  assert.ok(/\[PROPRIETARY_NOTES\]|\[CONFIDENTIAL_NOTES\]/.test(prompt));
});

test("restored website copy keeps the hotel name, scrubs budget, and drops strategy language", () => {
  const intake = asterIntake();
  const plan = planPrivacyShield(intake);
  const raw = {
    kicker: "A house",
    headline: "Arrive slowly at [PROJECT_NAME].",
    lede: "Stay with [CLIENT_NAME]. The engagement is [BUDGET]. This website should communicate luxury.",
    ctaLabel: "Explore the rooms",
    aboutTitle: "The house",
    aboutBody: "A quiet house. Notes: [PROPRIETARY_NOTES].",
    roomsTitle: "Rooms",
    rooms: [
      { name: "Garden Suite", lede: "Doors toward planted ground at [PROJECT_NAME].", photoId: "garden" },
      { name: "Pool Suite", lede: "Private water a few steps from the door.", photoId: "water" },
    ],
    experiencesTitle: "Days",
    experiences: [
      { title: "Arrive", body: "A slower day." },
      { title: "Stay", body: "Write with your dates." },
      { title: "Quiet", body: "A quieter kind of hospitality." },
    ],
    galleryTitle: "Light",
    gallery: [
      { photoId: "hero", caption: "Reference imagery, not photographs of the house." },
      { photoId: "garden", caption: "Reference imagery, not photographs of the house." },
      { photoId: "water", caption: "Reference imagery, not photographs of the house." },
    ],
    bookingTitle: "Write",
    bookingBody: "Write to [PROJECT_NAME].",
    bookingCta: "Request your dates",
    footerTagline: "[PROJECT_NAME] — a house.",
  };
  const restored = restoreValue(raw, plan) as typeof raw;
  const linted = lintGuestCopy(scrubSiteCopy(validateSiteCopy(restored).copy!, intake), intake);
  assert.ok(linted.copy.headline.includes("The Aster Hotel"));
  assert.ok(linted.copy.lede.includes('Maison "JJ" Aster & Co.'));
  assert.equal(linted.copy.lede.includes("€42,000"), false);
  assert.equal(STRATEGY_LANGUAGE_RE.test(linted.copy.lede), false);
  assert.ok(linted.warnings.some((item) => /strategy/i.test(item)));
  assert.equal(linted.copy.aboutBody.includes("Rue des Archives"), false);
});

test("renderer uses the brief palette, credits reference photos, and ships an honest enquiry form", () => {
  const intake = asterIntake();
  const bundle = composeLocalBrief(intake);
  const copy = composeLocalWebsite({
    intake,
    sections: bundle.sections,
    sitemap: bundle.sitemap,
    artDirection: bundle.artDirection,
  });
  const html = renderSiteHtml(copy, bundle.artDirection, {
    assetBase: "https://atelier-brief-ai.web.app",
    brandName: "The Aster Hotel",
    documentTitle: "The Aster Hotel",
  });
  assert.equal(LOREM_RE.test(html), false);
  assert.ok(html.includes("The Aster Hotel"));
  assert.ok(html.includes("Basile Morin"));
  assert.ok(html.includes("CC BY-SA 4.0"));
  assert.ok(html.includes("Reference photography"));
  assert.ok(html.includes("not photographs of The Aster Hotel") || html.includes("not a depiction of the client property"));
  assert.ok(html.includes("id=\"enquiry\""));
  assert.ok(html.includes('name="arrival"'));
  assert.ok(html.includes('name="departure"'));
  assert.ok(html.includes('name="guests"'));
  assert.ok(html.includes('name="message"'));
  assert.ok(html.includes("Your enquiry has been prepared"));
  assert.equal(/reservation (was )?confirmed|booking confirmed|has been received/i.test(html), false);
  assert.ok(html.includes("data-menu-toggle"));
  assert.ok(html.includes("/references/hero.jpg"));
  assert.ok(html.includes("/references/garden.jpg"));
  assert.ok(html.includes("/references/water.jpg"));
  assert.equal(html.includes("/references/suite.jpg"), false);
  assert.equal(html.includes("#F4F2EC"), false);
  assert.ok(html.includes("#FFFFFF") || html.includes("#ffffff") || html.toLowerCase().includes("gallery white"));
  const credits = creditsForCopy(copy);
  assert.ok(credits.length <= 3 && credits.length >= 2);
  const fonts = resolveFonts(bundle.artDirection);
  assert.ok(fonts.some((item) => item.role === "display"));
});

test("default art direction is gallery white, and the renderer does not silently override a cream brief", () => {
  const def = defaultArtDirection();
  assert.equal(def.palette[0].hex.toUpperCase(), "#FFFFFF");
  assert.equal(isWarmCreamHex(def.palette[0].hex), false);
  assert.equal(def.palette.some((color) => color.hex.toUpperCase() === "#F4F2EC"), false);

  const warm = {
    ...def,
    displayFamily: "Fraunces",
    bodyFamily: "IBM Plex Sans",
    palette: [
      { name: "Stone Paper", hex: "#F4F2EC", role: "Field" },
      { name: "Charcoal", hex: "#1C1917", role: "Text" },
      { name: "Stone Grey", hex: "#D6D3D1", role: "Rule" },
      { name: "Muted Stone", hex: "#78716C", role: "Secondary" },
      { name: "Umber", hex: "#A66A35", role: "Accent" },
    ],
  };
  const resolved = resolvePalette(warm);
  assert.equal(resolved.palette[0].hex, "#F4F2EC");
  assert.ok(resolved.log.some((line) => line.includes("#F4F2EC") && /did not replace/i.test(line)));
  const fonts = resolveFonts(warm);
  const display = fonts.find((item) => item.role === "display")!;
  const body = fonts.find((item) => item.role === "body")!;
  assert.equal(display.status, "substitute");
  assert.equal(display.rendered, "Instrument Serif");
  assert.equal(body.status, "substitute");
  assert.equal(body.rendered, "DM Sans");
});
