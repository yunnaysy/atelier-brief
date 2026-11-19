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
  redactedPromptText: (raw: string) => string;
  restore: (raw: string) => string;
}

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]\d{3,4}/g;

export const CONFIDENTIAL_LABELS = [
  "Client Name",
  "Budget",
  "Contact",
  "Proprietary Notes",
] as const;

function uniqueContacts(notes: string): string[] {
  const found = new Set<string>();
  for (const match of notes.match(EMAIL) ?? []) found.add(match);
  for (const match of notes.match(PHONE) ?? []) {
    if (match.trim().length >= 8) found.add(match.trim());
  }
  return [...found];
}

export function planPrivacyShield(intake: Intake): ShieldPlan {
  const fields: ShieldField[] = [];

  if (intake.clientName.trim()) {
    fields.push({
      key: "clientName",
      token: "[CLIENT_NAME]",
      label: "Client Name",
      value: intake.clientName.trim(),
    });
  }
  if (intake.budget.trim()) {
    fields.push({
      key: "budget",
      token: "[BUDGET_RANGE]",
      label: "Budget",
      value: intake.budget.trim(),
    });
  }

  const contacts = uniqueContacts(intake.confidentialNotes);
  contacts.forEach((value, index) => {
    fields.push({
      key: "contact",
      token: contacts.length === 1 ? "[CONTACT]" : `[CONTACT_${index + 1}]`,
      label: "Contact",
      value,
    });
  });

  if (intake.confidentialNotes.trim()) {
    fields.push({
      key: "confidentialNotes",
      token: "[PROPRIETARY_NOTES]",
      label: "Proprietary Notes",
      value: intake.confidentialNotes.trim(),
    });
  }

  // Apply longest values first so a short name is not replaced inside a longer note.
  const byLength = [...fields].sort((a, b) => b.value.length - a.value.length);

  const apply = (raw: string, from: "value" | "token", to: "token" | "value") => {
    let next = raw;
    for (const field of byLength) {
      if (!field.value) continue;
      next = next.split(field[from]).join(field[to]);
    }
    return next;
  };

  const redactedIntake: Intake = {
    ...intake,
    clientName: intake.clientName.trim() ? "[CLIENT_NAME]" : intake.clientName,
    budget: intake.budget.trim() ? "[BUDGET_RANGE]" : intake.budget,
    confidentialNotes: intake.confidentialNotes.trim()
      ? apply(intake.confidentialNotes, "value", "token")
      : intake.confidentialNotes,
  };

  return {
    fields,
    redactedIntake,
    redactedPromptText: (raw) => apply(raw, "value", "token"),
    restore: (raw) => apply(raw, "token", "value"),
  };
}

export function restoreBundle<T>(value: T, plan: ShieldPlan): T {
  const json = plan.restore(JSON.stringify(value));
  return JSON.parse(json) as T;
}
