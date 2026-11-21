import assert from "node:assert/strict";
import { test } from "node:test";
import { CLIENT_PRESETS } from "./presets";
import { buildFullBriefCloudPrompt, buildSectionCloudPrompt } from "./cloudPrompt";
import {
  assertPayloadTokenized,
  formatIntakeBlock,
  payloadPreview,
  planPrivacyShield,
  polishBundle,
  polishGeneratedText,
  restoreValue,
} from "./privacyShield";
import type { Intake } from "./types";

const intake: Intake = {
  projectName: "The Aster Hotel",
  clientName: 'Maison "JJ" Aster & Co.',
  industry: "Independent boutique hospitality",
  budget: "€42,000–€58,000 (design + build)",
  timeline: "14 weeks, spring arrival",
  tones: ["hospitable"],
  voiceReserve: 34,
  coreGoal: "Book direct stays from design-led travelers.",
  audience: "Couples who already stay in considered houses.",
  confidentialNotes:
    "Do not publish the reserved suite rate card or the owner's private annex at 14\\bis Rue des Teinturiers.\nPress: press@asterhotel.example. Suite résumé: L'Étoile.\nPrincipal: jane.jj.aster@asterhotel.example · +33 1 42 86 17 09",
};

test("redacts names, budget, emails, phones, and notes across the full prompt", () => {
  const plan = planPrivacyShield(intake);
  const tokens = plan.fields.map((field) => field.token);
  assert.ok(tokens.includes("[CLIENT_NAME]"));
  assert.ok(tokens.includes("[BUDGET_RANGE]"));
  assert.ok(tokens.includes("[PROPRIETARY_NOTES]"));
  assert.ok(tokens.includes("[PROJECT_NAME]"));
  assert.ok(plan.fields.some((field) => field.key === "contact" && field.value.includes("@")));
  assert.ok(plan.fields.some((field) => field.key === "contact" && field.value.includes("+33")));
  const after = plan.redactText(
    `Client: ${intake.clientName}\nBudget: ${intake.budget}\n${intake.confidentialNotes}`,
  );
  assert.equal(after.includes('Maison "JJ" Aster'), false);
  assert.equal(after.includes("€42,000"), false);
  assert.equal(after.includes("jane.jj.aster@asterhotel.example"), false);
  assert.equal(after.includes("+33 1 42 86 17 09"), false);
  assert.ok(after.includes("[CLIENT_NAME]"));
  assert.ok(after.includes("[PROPRIETARY_NOTES]"));
  const emailOnly = plan.redactText("Write to jane.jj.aster@asterhotel.example or +33 1 42 86 17 09");
  assert.equal(emailOnly.includes("@asterhotel.example"), false);
  assert.equal(emailOnly.includes("+33 1 42 86 17 09"), false);
  assert.ok(emailOnly.includes("[CONTACT"));
});

test("structural restore keeps quotes, backslashes, newlines, and unicode intact", () => {
  const plan = planPrivacyShield(intake);
  const raw = {
    title: "[CLIENT_NAME] — L'Étoile",
    note: "Path token then value",
    nested: [{ quote: "Visit [CLIENT_NAME]" }],
  };
  // Simulate a model returning tokens inside structured JSON (already parsed).
  const restored = restoreValue(
    {
      title: "[CLIENT_NAME] — L'Étoile",
      path: "14\\bis",
      lines: "[PROPRIETARY_NOTES]",
      nested: [{ quote: "Visit [CLIENT_NAME]" }],
    },
    plan,
  );
  assert.equal(restored.title, 'Maison "JJ" Aster & Co. — L\'Étoile');
  assert.equal(restored.path, "14\\bis");
  assert.ok(restored.lines.includes("14\\bis"));
  assert.ok(restored.lines.includes("L'Étoile") || restored.lines.includes("L'Étoile") || restored.lines.includes("résumé"));
  assert.equal(restored.nested[0].quote, 'Visit Maison "JJ" Aster & Co.');

  // The legacy stringify/replace/parse path would throw on the quoted client name.
  const naive = JSON.stringify({ client: "[CLIENT_NAME]" }).split("[CLIENT_NAME]").join(intake.clientName);
  assert.throws(() => JSON.parse(naive));
  assert.deepEqual(restoreValue({ client: "[CLIENT_NAME]" }, plan), { client: intake.clientName });
  void raw;
});

test("aster preset plans 11 fields and the actual cloud prompt is fully tokenized", () => {
  const aster = CLIENT_PRESETS.find((item) => item.id === "aster-hotel");
  assert.ok(aster);
  const plan = planPrivacyShield(aster.intake);
  assert.equal(plan.fields.length, 11, plan.fields.map((field) => field.token).join(", "));

  const sent = buildFullBriefCloudPrompt(plan.redactedIntake);
  const check = assertPayloadTokenized(sent, plan);
  assert.equal(check.ok, true, `leaks=${check.leaks.join(",")} missing=${check.missingTokens.join(",")}`);
  assert.equal(sent.includes(aster.intake.clientName), false);
  assert.equal(sent.includes(aster.intake.budget), false);
  assert.equal(sent.includes("€42,000"), false);
  assert.equal(sent.includes("€40,000"), false);
  assert.equal(sent.includes("jane.jj.aster@asterhotel.example"), false);
  assert.equal(sent.includes("+33 1 42 86 17 09"), false);
  assert.equal(sent.includes("14\\bis Rue des Teinturiers"), false);
  assert.ok(sent.includes("[CLIENT_NAME]"));
  assert.ok(sent.includes("[BUDGET_RANGE]"));
  assert.ok(sent.includes("[PROPRIETARY_NOTES]"));
  assert.ok(sent.includes("Compose a complete website brief"));

  const preview = payloadPreview(aster.intake, plan);
  assert.equal(preview.after, formatIntakeBlock(plan.redactedIntake));
  assert.equal(preview.after.includes(aster.intake.clientName), false);
  assert.ok(preview.after.includes("[CLIENT_NAME]"));
  // The receipt stores the full sent prompt, not only the reconstructed intake snapshot.
  assert.ok(sent.includes(preview.after));
  assert.ok(sent.length > preview.after.length);
});

test("section regenerate redacts current title and body before the cloud prompt is built", () => {
  const aster = CLIENT_PRESETS.find((item) => item.id === "aster-hotel");
  assert.ok(aster);
  const plan = planPrivacyShield(aster.intake);
  const leakyTitle = `Brief for ${aster.intake.clientName}`;
  const leakyBody = `Budget is ${aster.intake.budget}. ${aster.intake.confidentialNotes}`;
  const sent = buildSectionCloudPrompt(
    plan.redactedIntake,
    "executive-summary",
    plan.redactText(leakyTitle),
    plan.redactText(leakyBody),
  );
  const check = assertPayloadTokenized(sent, plan);
  assert.equal(check.ok, true, `leaks=${check.leaks.join(",")} missing=${check.missingTokens.join(",")}`);
  assert.equal(sent.includes(aster.intake.clientName), false);
  assert.equal(sent.includes("€42,000"), false);
  assert.equal(sent.includes("jane.jj.aster@asterhotel.example"), false);
  assert.ok(sent.includes("[CLIENT_NAME]"));
  assert.ok(sent.includes("[BUDGET_RANGE]"));
});

test("polishGeneratedText removes doubled articles and common model typos", () => {
  assert.equal(
    polishGeneratedText("Stays under the The Aster Hotel feel considered."),
    "Stays under the Aster Hotel feel considered.",
  );
  assert.equal(polishGeneratedText("Priortiy page: Garden Room"), "Priority page: Garden Room");
  assert.equal(polishGeneratedText("A a quiet courtyard."), "A quiet courtyard.");
  const bundle = polishBundle({
    sections: [{ title: "Priortiy page", body: "Book under the The maison." }],
  });
  assert.equal(bundle.sections[0].title, "Priority page");
  assert.equal(bundle.sections[0].body, "Book under the maison.");
});

test("typographic-quote and whitespace variants of a confidential value are tokenized too", () => {
  const plan = planPrivacyShield(intake);
  const echoed = [
    "Prepared for Maison \u201CJJ\u201D Aster & Co. this spring.",
    "Budget  noted: €42,000–€58,000  (design + build).",
    "Owner\u2019s annex stays private.",
  ].join("\n");
  const after = plan.redactText(echoed);
  assert.equal(after.includes("Aster & Co"), false, after);
  assert.equal(after.includes("€42,000"), false, after);
  assert.ok(after.includes("[CLIENT_NAME]"));
  assert.ok(after.includes("[BUDGET_RANGE]"));
});

test("the tokenized intake block names every configured field by token, never by value", () => {
  const plan = planPrivacyShield(intake);
  const block = formatIntakeBlock(plan.redactedIntake);
  assert.match(block, /^Project: \[PROJECT_NAME\]$/m);
  assert.match(block, /^Client: \[CLIENT_NAME\]$/m);
  assert.match(block, /^Budget: \[BUDGET_RANGE\]$/m);
  assert.match(block, /^Confidential notes: \[PROPRIETARY_NOTES\]$/m);
  for (const field of plan.fields) assert.equal(block.includes(field.value), false, field.token);
  assert.equal(/The Aster Hotel|Maison|€|rate card: \$/i.test(block), false);
});
