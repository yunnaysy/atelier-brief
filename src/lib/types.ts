export type ToneId =
  | "quiet"
  | "warm"
  | "precise"
  | "material"
  | "bold"
  | "playful"
  | "editorial"
  | "technical"
  | "hospitable"
  | "formal";

export type WorkspaceTab = "brief" | "sitemap" | "art" | "export";

export type InferenceBadge = "on-device" | "cloud" | "error-fallback" | "preview";

export type NanoAvailability =
  | "available"
  | "downloadable"
  | "downloading"
  | "unavailable"
  | "unknown";

export type ConnectionState = "preview" | "configured";

export interface Intake {
  projectName: string;
  clientName: string;
  industry: string;
  budget: string;
  timeline: string;
  tones: ToneId[];
  voiceReserve: number;
  coreGoal: string;
  audience: string;
  confidentialNotes: string;
}

export interface BriefSection {
  id: string;
  title: string;
  body: string;
}

export interface SitemapPage {
  id: string;
  name: string;
  purpose: string;
  sections: string[];
  heroCopy: string;
  priority?: boolean;
  conversionGoal?: string;
  children?: SitemapPage[];
}

export interface PrivacyReceipt {
  sessionId: string;
  createdAt: string;
  badge: InferenceBadge;
  inferenceSource: "on_device" | "in_cloud" | null;
  model: string;
  protectedFieldCount: number;
  tokens: string[];
  cloudGenerationUsed: boolean;
  localRestoration: boolean;
  redactedPreview: string;
  disclaimer: string;
}

export interface PaletteColor {
  name: string;
  hex: string;
  role: string;
}

export interface TypeSpecimen {
  role: string;
  family: string;
  size: string;
  weight: string;
  tracking: string;
  sample: string;
}

export interface ArtDirection {
  narrative: string;
  displayFamily: string;
  bodyFamily: string;
  monoFamily: string;
  density: "airy" | "balanced" | "compact";
  motion: string;
  palette: PaletteColor[];
  hierarchy: TypeSpecimen[];
}

export interface DesignRationaleItem {
  recommendation: string;
  reasoning: string;
  businessObjective: string;
  implementation: string;
}

export interface Telemetry {
  badge: InferenceBadge;
  label: string;
  reason: string;
  latencyMs: number;
  redactionCount: number;
  tokens: string[];
  nano: NanoAvailability;
  model: string;
  privacyShield: boolean;
  inferenceSource: "on_device" | "in_cloud" | null;
  cloudAttempted: boolean;
  devicePrepared: boolean;
  deviceProgress: number | null;
  schemaValid: boolean;
  schemaErrors: string[];
  success: boolean;
  errorMessage: string | null;
  promptBefore: string;
  promptAfter: string;
}

export interface StudioProject {
  id: string;
  createdAt: string;
  updatedAt: string;
  intake: Intake;
  sections: BriefSection[];
  sitemap: SitemapPage[];
  artDirection: ArtDirection;
  rationale: DesignRationaleItem[];
  lastTelemetry: Telemetry | null;
  privacyReceipt: PrivacyReceipt | null;
}

export interface GeneratedBundle {
  sections: BriefSection[];
  sitemap: SitemapPage[];
  artDirection: ArtDirection;
  rationale: DesignRationaleItem[];
}

export const TONE_OPTIONS: { id: ToneId; label: string }[] = [
  { id: "quiet", label: "Quiet" },
  { id: "warm", label: "Warm" },
  { id: "precise", label: "Precise" },
  { id: "material", label: "Material" },
  { id: "bold", label: "Bold" },
  { id: "playful", label: "Playful" },
  { id: "editorial", label: "Editorial" },
  { id: "technical", label: "Technical" },
  { id: "hospitable", label: "Hospitable" },
  { id: "formal", label: "Formal" },
];

export const SECTION_DEFS: { id: string; title: string }[] = [
  { id: "executive-summary", title: "Executive Summary" },
  { id: "audience-positioning", title: "Audience & Positioning" },
  { id: "conversion-flow", title: "Core Conversion Flow" },
  { id: "tone-voice", title: "Tone & Voice Guidelines" },
  { id: "discovery-questions", title: "Discovery Questions" },
  { id: "deliverables-risks", title: "Deliverables & Risks" },
];

export function emptyIntake(): Intake {
  return {
    projectName: "",
    clientName: "",
    industry: "",
    budget: "",
    timeline: "",
    tones: ["quiet", "editorial"],
    voiceReserve: 42,
    coreGoal: "",
    audience: "",
    confidentialNotes: "",
  };
}

export function newProject(intake: Intake = emptyIntake()): StudioProject {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    intake,
    sections: [],
    sitemap: [],
    artDirection: defaultArtDirection(),
    rationale: [],
    lastTelemetry: null,
    privacyReceipt: null,
  };
}

export function defaultArtDirection(): ArtDirection {
  return {
    narrative:
      "A paper-and-ink studio system: warm alabaster, charcoal ink, antique bronze, and motion that feels like a page turning rather than a dashboard loading.",
    displayFamily: "Instrument Serif",
    bodyFamily: "DM Sans",
    monoFamily: "IBM Plex Mono",
    density: "airy",
    motion: "220ms fades and 1px rule draws; no bounce, no parallax.",
    palette: [
      { name: "Paper", hex: "#F7F5F0", role: "Field" },
      { name: "Ink", hex: "#25241F", role: "Text" },
      { name: "Border", hex: "#E6E2D9", role: "Rule" },
      { name: "Terracotta", hex: "#B76E55", role: "Accent" },
      { name: "Olive", hex: "#747C62", role: "Privacy" },
    ],
    hierarchy: [
      {
        role: "Display",
        family: "Instrument Serif",
        size: "56 / 60",
        weight: "500",
        tracking: "-0.03em",
        sample: "Atelier",
      },
      {
        role: "Section",
        family: "Instrument Serif",
        size: "28 / 34",
        weight: "500",
        tracking: "-0.02em",
        sample: "A brief, not a pitch deck.",
      },
      {
        role: "Body",
        family: "DM Sans",
        size: "16 / 26",
        weight: "400",
        tracking: "0",
        sample:
          "Write for a client who will read this once, slowly, with a pencil in hand.",
      },
      {
        role: "Label",
        family: "IBM Plex Mono",
        size: "11 / 16",
        weight: "500",
        tracking: "0.12em",
        sample: "ON-DEVICE · GEMINI NANO",
      },
    ],
  };
}
