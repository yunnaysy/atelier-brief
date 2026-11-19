import type { ArtDirection, Intake, PaletteColor } from "./types";
import { defaultArtDirection } from "./types";

export function relativeLuminance(hex: string): number {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = Number.parseInt(full, 16);
  const srgb = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  const lin = srgb.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function wcagLabel(ratio: number, large = false): "AAA" | "AA" | "Fail" {
  if (large) {
    if (ratio >= 4.5) return "AAA";
    if (ratio >= 3) return "AA";
    return "Fail";
  }
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "Fail";
}

function has(intake: Intake, ...ids: string[]) {
  return ids.some((id) => intake.tones.includes(id as Intake["tones"][number]));
}

export function deriveArtDirection(intake: Intake): ArtDirection {
  const base = defaultArtDirection();
  const industry = intake.industry.toLowerCase();
  let palette: PaletteColor[] = base.palette;
  let narrative = base.narrative;
  let density: ArtDirection["density"] = "airy";
  let motion = base.motion;
  let displayFamily = "Fraunces";

  if (industry.includes("architect") || has(intake, "material", "quiet")) {
    palette = [
      { name: "Plaster", hex: "#F4EFE6", role: "Field" },
      { name: "Ink", hex: "#1C1916", role: "Text" },
      { name: "Stone", hex: "#8A8175", role: "Secondary" },
      { name: "Copper", hex: "#B85C38", role: "Accent" },
      { name: "Graphite", hex: "#3F3A36", role: "Rule" },
    ];
    narrative =
      "A materials board translated to the screen: plaster ground, graphite type, and a single copper note used like a well-placed hardware detail.";
    density = "airy";
    motion = "Slow 280ms fades, hairline rules that draw once. No hover leaps.";
  }

  if (industry.includes("coffee") || industry.includes("roaster") || has(intake, "warm", "hospitable")) {
    palette = [
      { name: "Cream", hex: "#F3EBE0", role: "Field" },
      { name: "Espresso", hex: "#2A211C", role: "Text" },
      { name: "Terracotta", hex: "#C2410C", role: "Accent" },
      { name: "Leaf", hex: "#3F6B4B", role: "Secondary" },
      { name: "Roast", hex: "#6B4A32", role: "Rule" },
    ];
    narrative =
      "A cupping table in type: cream paper, espresso ink, terracotta as the tasting note, and a leaf green reserved for origin and season.";
    density = "balanced";
    motion = "Soft 220ms ease, cards that settle rather than pop. Preserve steam, not bounce.";
    displayFamily = "Fraunces";
  }

  if (industry.includes("fintech") || industry.includes("compliance") || has(intake, "precise", "formal")) {
    palette = [
      { name: "Vellum", hex: "#F6F3EC", role: "Field" },
      { name: "Ink", hex: "#16181D", role: "Text" },
      { name: "Slate", hex: "#4C5663", role: "Secondary" },
      { name: "Signal", hex: "#0F766E", role: "Accent" },
      { name: "Rule", hex: "#C9C3B8", role: "Rule" },
    ];
    narrative =
      "A counsel’s desk, not a trading floor: vellum field, slate hierarchy, and a single signal green used only for actions the firm is willing to stand behind.";
    density = "compact";
    motion = "120–180ms opacity and 1px shifts. Motion is a courtesy, never a flourish.";
  }

  if (intake.voiceReserve < 30) density = density === "compact" ? "compact" : "airy";
  if (intake.voiceReserve > 70) density = "balanced";

  const displaySample = intake.clientName.trim() || intake.projectName.trim() || "Atelier";
  const bodySample = intake.coreGoal.trim()
    ? intake.coreGoal.trim()
    : "Write for a client who will read this once, slowly, with a pencil in hand.";

  return {
    ...base,
    narrative,
    displayFamily,
    density,
    motion,
    palette,
    hierarchy: [
      {
        role: "Display",
        family: displayFamily,
        size: density === "airy" ? "64 / 68" : "52 / 58",
        weight: "500",
        tracking: "-0.03em",
        sample: displaySample,
      },
      {
        role: "Section",
        family: displayFamily,
        size: "28 / 34",
        weight: "500",
        tracking: "-0.02em",
        sample: intake.industry || "A brief, not a pitch deck.",
      },
      {
        role: "Body",
        family: "IBM Plex Sans",
        size: density === "compact" ? "15 / 24" : "16 / 26",
        weight: "400",
        tracking: "0",
        sample: bodySample,
      },
      {
        role: "Label",
        family: "IBM Plex Mono",
        size: "11 / 16",
        weight: "500",
        tracking: "0.14em",
        sample: "ON-DEVICE · GEMINI NANO",
      },
    ],
  };
}
