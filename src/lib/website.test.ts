import assert from "node:assert/strict";
import test from "node:test";
import { buildRedactedWebsitePrompt } from "./cloudPrompt";
import { composeLocalBrief } from "./localStudio";
import { planPrivacyShield, restoreValue } from "./privacyShield";
import { composeLocalWebsite, LOREM_RE, scrubSiteCopy, validateSiteCopy } from "./siteCopy";
import { creditsForCopy, renderSiteHtml } from "./siteRenderer";
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

test("local website copy is complete, has no lorem, and scrubs confidential values", () => {
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
  const blob = JSON.stringify(copy);
  assert.equal(blob.includes("€42,000"), false);
  assert.equal(blob.includes("Rue des Archives"), false);
  assert.equal(blob.includes("ops@aster-example.test"), false);
  assert.ok(blob.includes("The Aster Hotel"));
});

test("website cloud prompt is tokenized and redacts brief bodies", () => {
  const intake = asterIntake();
  const bundle = composeLocalBrief(intake);
  // Simulate a restored brief that contains raw secrets in body text.
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
  assert.ok(prompt.includes("[BUDGET]"));
  assert.ok(/\[PROPRIETARY_NOTES\]|\[CONFIDENTIAL_NOTES\]/.test(prompt));
});

test("restored website copy keeps the hotel name and scrubs budget", () => {
  const intake = asterIntake();
  const plan = planPrivacyShield(intake);
  const raw = {
    kicker: "A house",
    headline: "Arrive slowly at [PROJECT_NAME].",
    lede: "Stay with [CLIENT_NAME]. The engagement is [BUDGET].",
    ctaLabel: "Reserve",
    aboutTitle: "The house",
    aboutBody: "A quiet house. Notes: [PROPRIETARY_NOTES].",
    roomsTitle: "Rooms",
    rooms: [
      { name: "Garden Suite", lede: "Linen and a writing table at [PROJECT_NAME].", photoId: "suite" },
      { name: "Pool Suite", lede: "A quieter wing with its own water.", photoId: "pool-suite" },
    ],
    experiencesTitle: "Days",
    experiences: [
      { title: "Water", body: "A long pool.", photoId: "pool" },
      { title: "Table", body: "Breakfast in the dining room.", photoId: "restaurant" },
      { title: "Spa", body: "An indoor pool in stone.", photoId: "spa" },
    ],
    galleryTitle: "Light",
    gallery: [
      { photoId: "lobby", caption: "Lanterns at dusk." },
      { photoId: "lounge", caption: "The lounge." },
      { photoId: "library", caption: "The library." },
    ],
    bookingTitle: "Write",
    bookingBody: "Write to [PROJECT_NAME].",
    bookingCta: "Request dates",
    footerTagline: "[PROJECT_NAME] — a house.",
  };
  const restored = restoreValue(raw, plan) as typeof raw;
  const copy = scrubSiteCopy(validateSiteCopy(restored).copy!, intake);
  assert.ok(copy.headline.includes("The Aster Hotel"));
  assert.ok(copy.lede.includes('Maison "JJ" Aster & Co.'));
  assert.equal(copy.lede.includes("€42,000"), false);
  assert.equal(copy.aboutBody.includes("Rue des Archives"), false);
  assert.equal(JSON.stringify(copy).includes("[BUDGET]"), false);
});

test("rendered HTML uses art direction, credits photographers, and avoids lorem or a cream default", () => {
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
  assert.ok(html.includes("creativecommons.org/licenses/by-sa/4.0"));
  assert.ok(html.includes("commons.wikimedia.org"));
  assert.ok(html.includes("id=\"house\""));
  assert.ok(html.includes("id=\"rooms\""));
  assert.ok(html.includes("id=\"experiences\""));
  assert.ok(html.includes("id=\"gallery\""));
  assert.ok(html.includes("id=\"stay\""));
  assert.ok(html.includes("/references/hero.jpg"));
  assert.ok(html.includes("--display:"));
  assert.equal(/cream|#fff8e7|#f5e6d3/i.test(html), false);
  const credits = creditsForCopy(copy);
  assert.ok(credits.length >= 6);
  assert.ok(credits.every((photo) => photo.photographer === "Basile Morin"));
  // Default field from local art direction is stone paper, not a named cream.
  const field = bundle.artDirection.palette[0]?.hex ?? "";
  assert.ok(html.includes(field));
});
