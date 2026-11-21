import { DOUBLED_ARTICLE_HINT, formatIntakeBlock } from "./privacyShield";
import { REFERENCE_PHOTOS } from "./referencePhotos";
import type { ArtDirection, BriefSection, Intake, SitemapPage } from "./types";


export function schemaInstructions(): string {
  return `Return a JSON object with this exact shape:
{
  "sections": [
    { "id": "executive-summary", "title": "Executive Summary", "body": "..." },
    { "id": "audience-positioning", "title": "Audience & Positioning", "body": "..." },
    { "id": "conversion-flow", "title": "Core Conversion Flow", "body": "..." },
    { "id": "tone-voice", "title": "Tone & Voice Guidelines", "body": "..." },
    { "id": "discovery-questions", "title": "Discovery Questions", "body": "..." },
    { "id": "deliverables-risks", "title": "Deliverables & Risks", "body": "..." }
  ],
  "sitemap": [
    { "id": "page-1", "name": "Home", "purpose": "...", "sections": ["..."], "heroCopy": "..." }
  ],
  "artDirection": {
    "narrative": "...",
    "displayFamily": "Fraunces",
    "bodyFamily": "IBM Plex Sans",
    "monoFamily": "IBM Plex Mono",
    "density": "airy" | "balanced" | "compact",
    "motion": "...",
    "palette": [{ "name": "...", "hex": "#RRGGBB", "role": "..." }],
    "hierarchy": [{ "role": "...", "family": "...", "size": "...", "weight": "...", "tracking": "...", "sample": "..." }]
  },
  "rationale": [
    {
      "recommendation": "...",
      "reasoning": "...",
      "businessObjective": "...",
      "implementation": "..."
    }
  ]
}
Write 2 short paragraphs per brief section (except Discovery Questions, which should be a numbered list of 5). Provide 5 or 6 sitemap pages with unique ids. Palette must include 5 colors with real #RRGGBB hex values. Studio house style: the field/background is pure white #FFFFFF and primary text is charcoal #1C1917; rules and secondary text use neutral greys; at most one accent color. Never use cream, ivory, beige, alabaster, taupe, sand, linen, or any warm off-white. Provide at least 3 design-decision rationale items, each with recommendation, reasoning, businessObjective, and implementation. English only. No markdown fences. ${DOUBLED_ARTICLE_HINT}`;
}

export function buildFullBriefCloudPrompt(redactedIntake: Intake): string {
  return [
    "Compose a complete website brief for a design studio handoff.",
    schemaInstructions(),
    "",
    "Intake (confidential values already replaced with Privacy Shield tokens):",
    formatIntakeBlock(redactedIntake),
  ].join("\n");
}

export function buildSectionCloudPrompt(
  redactedIntake: Intake,
  sectionId: string,
  redactedTitle: string,
  redactedBody: string,
): string {
  return [
    "Revise a single section of a website brief. Return JSON: { \"sections\": [{ \"id\", \"title\", \"body\" }] } with only that section.",
    `Section id: ${sectionId}`,
    `Current title: ${redactedTitle}`,
    `Current body:\n${redactedBody}`,
    "",
    "Intake (confidential values already replaced with Privacy Shield tokens):",
    formatIntakeBlock(redactedIntake),
    "",
    DOUBLED_ARTICLE_HINT,
  ].join("\n");
}


export function websiteSchemaInstructions(): string {
  return `Return a JSON object with this exact shape (no HTML, no markdown fences):
{
  "kicker": "short uppercase-friendly eyebrow, under 8 words",
  "headline": "a distinctive editorial headline, one or two short sentences",
  "lede": "two sentences of published marketing copy",
  "ctaLabel": "short call to action",
  "aboutTitle": "...",
  "aboutBody": "two sentences about the house or practice",
  "roomsTitle": "...",
  "rooms": [
    { "name": "...", "lede": "two sentences", "photoId": "garden" },
    { "name": "...", "lede": "two sentences", "photoId": "water" }
  ],
  "experiencesTitle": "...",
  "experiences": [
    { "title": "...", "body": "two sentences", "photoId": "hero" },
    { "title": "...", "body": "two sentences", "photoId": "garden" },
    { "title": "...", "body": "two sentences", "photoId": "water" }
  ],
  "galleryTitle": "...",
  "gallery": [
    { "photoId": "hero", "caption": "one sentence" },
    { "photoId": "garden", "caption": "one sentence" },
    { "photoId": "water", "caption": "one sentence" }
  ],
  "bookingTitle": "...",
  "bookingBody": "two sentences inviting a direct reservation or enquiry",
  "bookingCta": "short label",
  "footerTagline": "one quiet sentence",
  "nav": [
    { "label": "The House", "href": "#house" },
    { "label": "Rooms", "href": "#rooms" },
    { "label": "Experiences", "href": "#experiences" },
    { "label": "Gallery", "href": "#gallery" },
    { "label": "Reserve", "href": "#stay" }
  ]
}
Rules:
- This copy will be published on a public marketing website. Never include budget figures, confidential notes, private contact details, or Privacy Shield tokens such as [BUDGET_RANGE] or [PROPRIETARY_NOTES].
- You may use the project or client name tokens naturally when they appear in the intake; they will be restored on the device.
- English only. No lorem ipsum, no placeholder text, no exclamation-heavy sales copy, no generic startup voice.
- Write like a small editorial house journal: concrete, calm, specific.
- Use only the photoId values listed in the catalog.
- Provide two rooms, three experiences, and exactly three gallery items that use each catalog photo once.
- Do not mention cream, beige, or a default palette unless the art direction already specifies it.
- ${DOUBLED_ARTICLE_HINT}`;
}

export function buildWebsiteCloudPrompt(input: {
  redactedIntake: Intake;
  redactedSections: { title: string; body: string }[];
  redactedSitemap: { name: string; purpose: string; heroCopy: string }[];
  artSummary: string;
  photoCatalog: { id: string; role: string; alt: string }[];
}): string {
  const sections = input.redactedSections
    .map((section) => `### ${section.title}\n${section.body}`)
    .join("\n\n");
  const sitemap = input.redactedSitemap
    .map((page) => `- ${page.name}: ${page.purpose} ${page.heroCopy}`.trim())
    .join("\n");
  const photos = input.photoCatalog
    .map((photo) => `- ${photo.id} (${photo.role}): ${photo.alt}`)
    .join("\n");
  return [
    "Write published website copy for a multi-section marketing site that will be rendered on-device from this JSON.",
    "The typography, color, and layout are applied later from the art direction; you only write words and choose photoId values.",
    websiteSchemaInstructions(),
    "",
    "Intake (confidential values already replaced with Privacy Shield tokens):",
    formatIntakeBlock(input.redactedIntake),
    "",
    "Brief sections (already redacted):",
    sections || "(none)",
    "",
    "Sitemap (already redacted):",
    sitemap || "(none)",
    "",
    "Art direction summary (already redacted):",
    input.artSummary,
    "",
    "Bundled reference photo catalog (licensed images already on the device):",
    photos,
  ].join("\n");
}

export function buildRedactedWebsitePrompt(
  intake: Intake,
  sections: BriefSection[],
  sitemap: SitemapPage[],
  art: ArtDirection,
  plan: { fields: unknown[]; redactedIntake: Intake; redactText: (value: string) => string },
): string {
  const workingIntake = plan.fields.length > 0 ? plan.redactedIntake : intake;
  const redactedSections = sections.map((section) => ({
    title: plan.redactText(section.title),
    body: plan.redactText(section.body),
  }));
  const redactedSitemap = sitemap.map((page) => ({
    name: plan.redactText(page.name),
    purpose: plan.redactText(page.purpose),
    heroCopy: plan.redactText(page.heroCopy ?? ""),
  }));
  const artSummary = plan.redactText(
    [
      art.narrative,
      `Display: ${art.displayFamily}. Body: ${art.bodyFamily}. Mono: ${art.monoFamily}. Density: ${art.density}.`,
      `Palette: ${art.palette.map((color) => `${color.name} ${color.hex} (${color.role})`).join(", ")}.`,
    ].join(" "),
  );
  return buildWebsiteCloudPrompt({
    redactedIntake: workingIntake,
    redactedSections,
    redactedSitemap,
    artSummary,
    photoCatalog: REFERENCE_PHOTOS.map((photo) => ({ id: photo.id, role: photo.role, alt: photo.alt })),
  });
}

