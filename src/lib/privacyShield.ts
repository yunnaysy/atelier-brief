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

const DOUBLE_QUOTES = `["\u201C\u201D\u201E\u00AB\u00BB]`;
const SINGLE_QUOTES = `['\u2018\u2019\u201A]`;

/**
 * A pattern for one configured value that also matches the spellings a model or editor
 * produces when it echoes the value back: straight vs typographic quotes/apostrophes and
 * any run of whitespace. A restored brief re-sent to the cloud therefore cannot leak it.
 */
export function valuePattern(value: string): RegExp {
  const parts = value
    .trim()
    .split(/\s+/)
    .map((word) =>
      [...word]
        .map((ch) => {
          if (/["\u201C\u201D\u201E\u00AB\u00BB]/.test(ch)) return DOUBLE_QUOTES;
          if (/['\u2018\u2019\u201A]/.test(ch)) return SINGLE_QUOTES;
          return ch.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
        })
        .join(""),
    );
  return new RegExp(parts.join("\\s+"), "g");
}

function redactValues(raw: string, pairs: { from: string; to: string }[]): string {
  let next = raw;
  const sorted = [...pairs].sort((a, b) => b.from.length - a.from.length);
  for (const pair of sorted) {
    if (!pair.from.trim()) continue;
    next = next.replace(valuePattern(pair.from), () => pair.to);
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

  const redactText = (raw: string) => redactValues(raw, redactPairs);
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

export function formatIntakeBlock(intake: Intake): string {
  return [
    `Project: ${intake.projectName}`,
    `Client: ${intake.clientName}`,
    `Industry: ${intake.industry}`,
    `Budget: ${intake.budget}`,
    `Timeline: ${intake.timeline}`,
    intake.tones.length ? `Tones: ${intake.tones.join(", ")}` : "",
    `Voice reserve (0 reserved, 100 expressive): ${intake.voiceReserve}`,
    `Core goal: ${intake.coreGoal}`,
    `Audience: ${intake.audience}`,
    `Confidential notes: ${intake.confidentialNotes}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Intake snapshot only. Prefer the actual sent cloud prompt stored on telemetry. */
export function payloadPreview(intake: Intake, plan: ShieldPlan = planPrivacyShield(intake)): {
  before: string;
  after: string;
} {
  const before = formatIntakeBlock(intake);
  const after = formatIntakeBlock(plan.redactedIntake);
  return { before, after };
}

export const DOUBLED_ARTICLE_HINT =
  'Write naturally. Do not double articles (avoid phrases like "the The Hotel" or "a A studio"). Spell "Priority" correctly.';

const TYPO_FIXES: Array<[RegExp, string]> = [
  [/\bPriortiy\b/g, "Priority"],
  [/\bpriortiy\b/g, "priority"],
  [/\bRecieve\b/g, "Receive"],
  [/\brecieve\b/g, "receive"],
  [/\bSeperate\b/g, "Separate"],
  [/\bseperate\b/g, "separate"],
  [/\bOccured\b/g, "Occurred"],
  [/\boccured\b/g, "occurred"],
  [/\bDefinately\b/g, "Definitely"],
  [/\bdefinately\b/g, "definitely"],
  [/\bAccomodat/g, "Accommodat"],
  [/\baccomodat/g, "accommodat"],
];

/** Light typo and doubled-article cleanup for model output. Does not rewrite meaning. */
export function polishGeneratedText(text: string): string {
  let out = text;
  for (const [pattern, replacement] of TYPO_FIXES) {
    out = out.replace(pattern, replacement);
  }
  out = out.replace(/\b([Tt]he)\s+[Tt]he\b/g, "$1");
  out = out.replace(/\b([Aa]n)\s+[Aa]n\b/g, "$1");
  out = out.replace(/\b([Aa])\s+[Aa]\b/g, "$1");
  return out;
}

function walkPolish(value: unknown): unknown {
  if (typeof value === "string") return polishGeneratedText(value);
  if (Array.isArray(value)) return value.map(walkPolish);
  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      next[key] = walkPolish(item);
    }
    return next;
  }
  return value;
}

export function polishBundle<T>(bundle: T): T {
  return walkPolish(bundle) as T;
}

/**
 * Every configured field value must be absent from `payload`.
 * A token may be omitted when a longer field already covers that value (e.g. emails inside notes).
 */
export function assertPayloadTokenized(
  payload: string,
  plan: ShieldPlan,
): { ok: boolean; leaks: string[]; missingTokens: string[] } {
  const leaks: string[] = [];
  const missingTokens: string[] = [];
  for (const field of plan.fields) {
    if (field.value && payload.includes(field.value)) leaks.push(field.token);
    if (!payload.includes(field.token)) {
      const subsumed = plan.fields.some(
        (other) =>
          other.token !== field.token &&
          other.value.includes(field.value) &&
          payload.includes(other.token),
      );
      if (!subsumed) missingTokens.push(field.token);
    }
  }
  return { ok: leaks.length === 0 && missingTokens.length === 0, leaks, missingTokens };
}
