import assert from "node:assert/strict";
import { test } from "node:test";
import { planPrivacyShield, restoreValue } from "./privacyShield";
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
