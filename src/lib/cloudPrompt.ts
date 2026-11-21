import { DOUBLED_ARTICLE_HINT, formatIntakeBlock } from "./privacyShield";
import type { Intake } from "./types";

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
Write 2 short paragraphs per brief section (except Discovery Questions, which should be a numbered list of 5). Provide 5 or 6 sitemap pages with unique ids. Palette must include 5 colors with real #RRGGBB hex values. Provide at least 3 design-decision rationale items, each with recommendation, reasoning, businessObjective, and implementation. English only. No markdown fences. ${DOUBLED_ARTICLE_HINT}`;
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
