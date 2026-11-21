import assert from "node:assert/strict";
import { test } from "node:test";
import { badgeForFailure, badgeForSuccessfulInference, labelForBadge, validateBundle, isConsentPending, statusStripCopy } from "./validateBundle";

test("rejects incomplete AI output instead of backfilling it", () => {
  const result = validateBundle({
    sections: [{ id: "executive-summary", title: "Executive Summary", body: "Hello" }],
    sitemap: [{ id: "page-1", name: "Home", purpose: "x", heroCopy: "y", sections: [] }],
    artDirection: { narrative: "", displayFamily: "", bodyFamily: "", palette: [] },
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("Missing required section")));
  assert.equal(result.bundle, undefined);
});

test("rejects invalid hex colors and duplicate sitemap ids", () => {
  const sections = [
    "executive-summary",
    "audience-positioning",
    "conversion-flow",
    "tone-voice",
    "discovery-questions",
    "deliverables-risks",
  ].map((id) => ({ id, title: id, body: "Body text for the section." }));
  const result = validateBundle({
    sections,
    sitemap: [
      { id: "page-1", name: "Home", purpose: "a", heroCopy: "h", sections: [] },
      { id: "page-1", name: "Stay", purpose: "a", heroCopy: "h", sections: [] },
      { id: "page-3", name: "Suite", purpose: "a", heroCopy: "h", sections: [] },
      { id: "page-4", name: "House", purpose: "a", heroCopy: "h", sections: [] },
      { id: "page-5", name: "Reserve", purpose: "a", heroCopy: "h", sections: [] },
    ],
    artDirection: {
      narrative: "n",
      displayFamily: "Instrument Serif",
      bodyFamily: "DM Sans",
      monoFamily: "IBM Plex Mono",
      density: "airy",
      motion: "fade",
      palette: [
        { name: "Paper", hex: "blue", role: "Field" },
        { name: "Ink", hex: "#25241F", role: "Text" },
        { name: "A", hex: "#B76E55", role: "Accent" },
        { name: "B", hex: "#747C62", role: "Privacy" },
        { name: "C", hex: "#788D9B", role: "Secondary" },
      ],
      hierarchy: [
        { role: "Display", family: "Instrument Serif", size: "42", weight: "400", tracking: "0", sample: "A" },
        { role: "Section", family: "Instrument Serif", size: "24", weight: "400", tracking: "0", sample: "B" },
        { role: "Body", family: "DM Sans", size: "14", weight: "400", tracking: "0", sample: "C" },
      ],
    },
    rationale: [
      { recommendation: "r1", reasoning: "a", businessObjective: "b", implementation: "c" },
      { recommendation: "r2", reasoning: "a", businessObjective: "b", implementation: "c" },
      { recommendation: "r3", reasoning: "a", businessObjective: "b", implementation: "c" },
    ],
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes("unique")));
  assert.ok(result.errors.some((error) => /hex/i.test(error)));
});

test("failure telemetry never returns cloud or on-device", () => {
  assert.equal(badgeForFailure(true), "error-fallback");
  assert.equal(badgeForFailure(false), "preview");
  assert.equal(badgeForSuccessfulInference("on_device"), "on-device");
  assert.equal(badgeForSuccessfulInference("in_cloud"), "cloud");
  assert.equal(badgeForSuccessfulInference("unknown"), null);
  assert.equal(badgeForSuccessfulInference(null), null);
  assert.equal(labelForBadge("error-fallback"), "Local Fallback · AI Call Failed");
  assert.equal(labelForBadge("preview"), "Studio Preview · Deterministic Non-AI");
  assert.notEqual(labelForBadge("error-fallback"), "Cloud Fallback · Firebase AI Logic");
  assert.notEqual(labelForBadge("error-fallback"), "On-Device · Gemini Nano");
});

test("no-consent status copy is calm, not an error", () => {
  assert.equal(isConsentPending("Cloud fallback was not approved while confidential fields were present.", false), true);
  assert.equal(isConsentPending("network down", true), false);
  const pending = statusStripCopy("error-fallback", 11, true);
  assert.equal(pending, "Local draft · Cloud AI off until you approve redacted sharing");
  assert.ok(!/fail/i.test(pending));
  assert.ok(!/fail/i.test(statusStripCopy("error-fallback", 11, false)));
  assert.equal(
    statusStripCopy("error-fallback", 11, true, true),
    "Local draft · Redacted cloud sharing approved for the next generation",
  );
});
