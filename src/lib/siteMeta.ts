import type {
  ArtDirection,
  DesignDecision,
  FontSubstitution,
  Intake,
  ReceiptTraceStep,
  Telemetry,
} from "./types";
import { pickPaletteColor, resolveFonts, resolvePalette } from "./siteTheme";

export function buildDesignDecisions(input: {
  intake: Intake;
  art: ArtDirection;
  telemetry: Telemetry | null;
  fontMap: FontSubstitution[];
  fieldHex: string;
}): DesignDecision[] {
  const tones = input.intake.tones.join(", ") || "a restrained tone";
  const display = input.fontMap.find((item) => item.role === "display");
  const field = input.art.palette.find((color) => /field|paper|ground|canvas/i.test(`${color.role} ${color.name}`));
  const tokens = input.telemetry?.tokens ?? [];
  const decisions: DesignDecision[] = [
    {
      from: `Tone: ${tones}`,
      to: "A minimal editorial layout — typography, photography, and whitespace, without marketplace cards.",
    },
  ];
  if (display) {
    decisions.push({
      from: `Requested display type: ${display.requested}`,
      to:
        display.status === "exact"
          ? `Rendered with ${display.rendered}, which is bundled in the studio.`
          : `Rendered with ${display.rendered} as a documented substitute for ${display.requested}.`,
    });
  }
  if (/direct|reserv|book|enquir/i.test(`${input.intake.coreGoal} ${input.intake.audience}`)) {
    decisions.push({
      from: "The brief asks for direct reservations rather than a marketplace.",
      to: "The site uses an enquiry form (arrival, departure, guests, message) that never claims a confirmed booking.",
    });
  }
  decisions.push({
    from: field ? `${field.name} ${field.hex} (${field.role})` : "Art-direction field color",
    to: `The rendered background is ${input.fieldHex}. The renderer does not silently replace a brief palette.`,
  });
  if (tokens.length) {
    decisions.push({
      from: "Private client notes and other configured confidential fields",
      to: `Tokenized before any cloud request (${tokens.join(", ")}). Tokens are restored on this device; public pages are also scrubbed of budget and confidential notes.`,
    });
  }
  return decisions;
}

export function buildWebsiteTrace(input: {
  telemetry: Telemetry;
  consentGranted: boolean;
  scrubWarnings: string[];
  copyReady: boolean;
}): ReceiptTraceStep[] {
  const t = input.telemetry;
  const tokenized = t.privacyShield && t.redactionCount > 0;
  const restored = t.badge === "cloud" && t.redactionCount > 0;
  const scrubOk = input.scrubWarnings.length === 0;
  return [
    {
      id: "intake",
      label: "Private brief received",
      status: "done",
      detail: "Intake was processed in this browser before any model call.",
    },
    {
      id: "tokenize",
      label: "Sensitive fields tokenized",
      status: t.badge === "on-device" ? "skipped" : tokenized ? "done" : t.privacyShield ? "done" : "skipped",
      detail:
        t.badge === "on-device"
          ? "On-device path: client values did not leave this computer, so cloud tokens were not required."
          : tokenized
            ? `${t.redactionCount} configured field${t.redactionCount === 1 ? "" : "s"} and detected contacts were replaced with reversible tokens in the cloud-bound prompt.`
            : "Privacy Shield was off, or no configured confidential fields were present.",
    },
    {
      id: "generate",
      label: "Copy generation",
      status: t.cloudAttempted || t.badge === "on-device" || t.badge === "preview" || t.badge === "error-fallback" ? "done" : "not-run",
      detail: [
        `Route: ${t.inferenceSource === "on_device" ? "On-device" : t.inferenceSource === "in_cloud" ? "Cloud" : t.badge === "preview" ? "Local preview (no AI)" : "Local fallback"}.`,
        `Cloud consent: ${input.consentGranted ? "Granted" : "Not granted"}.`,
        `External request: ${t.cloudAttempted ? "sent" : "not sent"}.`,
        `Model: ${t.model}.`,
      ].join(" "),
    },
    {
      id: "restore",
      label: "Local restoration and output scrub",
      status: input.copyReady ? "done" : "not-run",
      detail: [
        restored || t.badge === "cloud"
          ? "Tokens were restored on this device before render."
          : "No token restoration was required for this path.",
        scrubOk
          ? "Guest-facing copy passed the strategy-language and confidential-phrase check."
          : `Output scrub flags: ${input.scrubWarnings.join(" ")}`,
      ].join(" "),
    },
    {
      id: "render",
      label: "Website rendered",
      status: input.copyReady ? "done" : "not-run",
      detail: "The site was assembled on this device from the copy, the art direction, and bundled reference photographs.",
    },
  ];
}

export function fieldHexFor(art: ArtDirection): string {
  const { palette } = resolvePalette(art);
  return pickPaletteColor(palette, /field|paper|ground|canvas|background/i, "#FFFFFF", 0);
}

export function themeSnapshot(art: ArtDirection) {
  return {
    fontMap: resolveFonts(art),
    palette: resolvePalette(art),
    fieldHex: fieldHexFor(art),
  };
}
