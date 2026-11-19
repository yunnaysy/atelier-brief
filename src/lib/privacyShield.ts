import type { Intake } from "./types";

export interface ShieldField {
  key: keyof Intake | "contact";
  token: string;
  label: string;
  value: string;
}

export interface ShieldPlan {
  fields: ShieldField[];
  redactedIntake: Intake;
  redactText: (raw: string) => string;
  restoreText: (raw: string) => string;
}

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /(?:\+\d{1,3}[\s.-]?(?:\(?\d{1,4}\)?[\s.-]?){2,4}\d{2,4}|\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4})/g;

const INTAKE_FIELDS: { key: keyof Intake; token: string; label: string }[] = [
  { key: "clientName", token: "[CLIENT_NAME]", label: "Client Name" },
  { key: "budget", token: "[BUDGET_RANGE]", label: "Budget" },
  { key: "confidentialNotes", token: "[PROPRIETARY_NOTES]", label: "Proprietary Notes" },
  { key: "projectName", token: "[PROJECT_NAME]", label: "Project Name" },
  { key: "industry", token: "[INDUSTRY]", label: "Industry" },
  { key: "timeline", token: "[TIMELINE]", label: "Timeline" },
  { key: "coreGoal", token: "[CORE_GOAL]", label: "Core Goal" },
  { key: "audience", token: "[AUDIENCE]", label: "Audience" },
];

function uniqueContacts(...texts: string[]): string[] {
  const found = new Set<string>();
  for (const text of texts) {
    for (const match of text.match(EMAIL) ?? []) found.add(match);
    for (const match of text.match(PHONE) ?? []) {
      if (match.trim().length >= 8) found.add(match.trim());
    }
  }
  return [...found];
}

function applyReplacements(raw: string, pairs: { from: string; to: string }[]): string {
  let next = raw;
  const sorted = [...pairs].sort((a, b) => b.from.length - a.from.length);
  for (const pair of sorted) {
    if (!pair.from) continue;
    next = next.split(pair.from).join(pair.to);
  }
  return next;
}

export function planPrivacyShield(intake: Intake): ShieldPlan {
  const fields: ShieldField[] = [];

  for (const def of INTAKE_FIELDS) {
    const value = String(intake[def.key] ?? "").trim();
    if (!value || typeof intake[def.key] !== "string") continue;
    fields.push({ key: def.key, token: def.token, label: def.label, value });
  }

  const corpus = INTAKE_FIELDS.map((def) => String(intake[def.key] ?? ""));
  const contacts = uniqueContacts(...corpus);
  contacts.forEach((value, index) => {
    if (fields.some((field) => field.value === value && field.key === "contact")) return;
    fields.push({
      key: "contact",
      token: contacts.length === 1 ? "[CONTACT]" : `[CONTACT_${index + 1}]`,
      label: "Contact",
      value,
    });
  });

  const redactPairs = fields.map((field) => ({ from: field.value, to: field.token }));
  const restorePairs = fields.map((field) => ({ from: field.token, to: field.value }));

  const redactText = (raw: string) => applyReplacements(raw, redactPairs);
  const restoreText = (raw: string) => applyReplacements(raw, restorePairs);

  const redactedIntake: Intake = {
    ...intake,
    projectName: redactText(intake.projectName),
    clientName: redactText(intake.clientName),
    industry: redactText(intake.industry),
    budget: redactText(intake.budget),
    timeline: redactText(intake.timeline),
    coreGoal: redactText(intake.coreGoal),
    audience: redactText(intake.audience),
    confidentialNotes: redactText(intake.confidentialNotes),
  };

  return { fields, redactedIntake, redactText, restoreText };
}

export function restoreValue<T>(value: T, plan: ShieldPlan): T {
  if (typeof value === "string") return plan.restoreText(value) as T;
  if (Array.isArray(value)) {
    return value.map((item) => restoreValue(item, plan)) as T;
  }
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      output[key] = restoreValue(nested, plan);
    }
    return output as T;
  }
  return value;
}

/** @deprecated use restoreValue — kept as a named alias for call sites. */
export function restoreBundle<T>(value: T, plan: ShieldPlan): T {
  return restoreValue(value, plan);
}

export function payloadPreview(intake: Intake, plan: ShieldPlan = planPrivacyShield(intake)): {
  before: string;
  after: string;
} {
  const before = [
    `Project: ${intake.projectName}`,
    `Client: ${intake.clientName}`,
    `Industry: ${intake.industry}`,
    `Budget: ${intake.budget}`,
    `Timeline: ${intake.timeline}`,
    `Core goal: ${intake.coreGoal}`,
    `Audience: ${intake.audience}`,
    `Confidential notes: ${intake.confidentialNotes}`,
  ].join("\n");
  return { before, after: plan.redactText(before) };
}
