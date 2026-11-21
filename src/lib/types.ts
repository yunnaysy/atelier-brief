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

export type WorkspaceTab = "brief" | "sitemap" | "art" | "site" | "export";

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

export type PhotoRole = "hero" | "lobby" | "lounge" | "room" | "pool" | "dining" | "detail" | "spa";

export interface PhotoCredit {
  id: string;
  file: string;
  role: PhotoRole;
  alt: string;
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  source: string;
  subjectNote: string;
  width: number;
  height: number;
  bytes?: number;
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
  photoCredits?: PhotoCredit[];
  fontMap?: FontSubstitution[];
  executionTrace?: ReceiptTraceStep[];
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
  /** House-style adjustments applied to the model's palette, shown in the palette log. */
  paletteNotes?: string[];
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



export interface FontSubstitution {
  role: "display" | "body" | "mono";
  requested: string;
  rendered: string;
  status: "exact" | "substitute";
}

export interface DesignDecision {
  from: string;
  to: string;
}

export interface ReceiptTraceStep {
  id: string;
  label: string;
  status: "done" | "skipped" | "not-run";
  detail: string;
}

export interface SiteRoom {
  name: string;
  lede: string;
  photoId: string;
}

export interface SiteExperience {
  title: string;
  body: string;
  photoId?: string;
}

export interface SiteGalleryItem {
  photoId: string;
  caption: string;
}

export interface SiteNavLink {
  label: string;
  href: string;
}

export interface SiteCopy {
  kicker: string;
  headline: string;
  lede: string;
  ctaLabel: string;
  aboutTitle: string;
  aboutBody: string;
  roomsTitle: string;
  rooms: SiteRoom[];
  experiencesTitle: string;
  experiences: SiteExperience[];
  galleryTitle: string;
  gallery: SiteGalleryItem[];
  bookingTitle: string;
  bookingBody: string;
  bookingCta: string;
  footerTagline: string;
  nav?: SiteNavLink[];
}

export interface GeneratedSite {
  copy: SiteCopy;
  photoIds: string[];
  builtAt: string;
  telemetry: Telemetry | null;
  fontMap: FontSubstitution[];
  paletteLog: string[];
  designDecisions: DesignDecision[];
  copyWarnings: string[];
  trace: ReceiptTraceStep[];
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
  site: GeneratedSite | null;
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
    site: null,
  };
}

export function defaultArtDirection(): ArtDirection {
  return {
    narrative:
      "A white-and-charcoal studio system: a clean field, charcoal typography, and a single umber accent reserved for actions.",
    displayFamily: "Instrument Serif",
    bodyFamily: "DM Sans",
    monoFamily: "IBM Plex Mono",
    density: "airy",
    motion: "Transitions should feel quiet and brief, like a page turning rather than a dashboard loading.",
    palette: [
      { name: "Gallery White", hex: "#FFFFFF", role: "Field" },
      { name: "Charcoal", hex: "#1C1917", role: "Text" },
      { name: "Stone Grey", hex: "#D6D3D1", role: "Rule" },
      { name: "Muted Stone", hex: "#78716C", role: "Secondary" },
      { name: "Umber", hex: "#A66A35", role: "Accent" },
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
