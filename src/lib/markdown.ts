import type { StudioProject } from "./types";
import { flattenSitemap } from "./validateBundle";

function stamp(project: StudioProject): { date: string; version: string } {
  const date = new Date(project.updatedAt || project.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const short = project.id.slice(0, 6).toUpperCase();
  return { date, version: `AB-${short}` };
}

export function projectToMarkdown(project: StudioProject): string {
  const { intake, sections, sitemap, artDirection, rationale, lastTelemetry } = project;
  const { date, version } = stamp(project);
  const tones = intake.tones.join(", ") || "—";
  const lines: string[] = [
    "# Atelier Brief",
    "",
    `**${intake.projectName || "Untitled brief"}**  `,
    "A studio-grade website briefing deliverable.",
    "",
    `Client: ${intake.clientName || "—"}  `,
    `Industry: ${intake.industry || "—"}  `,
    `Budget: ${intake.budget || "—"}  `,
    `Timeline: ${intake.timeline || "—"}  `,
    `Tone: ${tones}  `,
    `Voice reserve: ${intake.voiceReserve}/100  `,
    `Date: ${date}  `,
    `Version: ${version}`,
    "",
    "## Goal",
    "",
    intake.coreGoal || "_Not specified._",
    "",
    "## Audience",
    "",
    intake.audience || "_Not specified._",
    "",
  ];

  if (intake.confidentialNotes.trim()) {
    lines.push(
      "## Proprietary notes",
      "",
      "_These notes are stored in this browser only (IndexedDB / localStorage). They are not end-to-end encrypted. When a cloud model is used, configured confidential fields and detected emails/phones are replaced with reversible tokens first; this is not a guarantee of full anonymization of arbitrary free-text context._",
      "",
      intake.confidentialNotes,
      "",
    );
  }

  sections.forEach((section, index) => {
    lines.push(`## ${String(index + 1).padStart(2, "0")}. ${section.title}`, "", section.body.trim() || "_Empty._", "");
  });

  if (rationale.length) {
    lines.push("## Design Decision Rationale", "");
    rationale.forEach((item, index) => {
      lines.push(
        `### ${index + 1}. ${item.recommendation}`,
        "",
        `Reasoning: ${item.reasoning}`,
        "",
        `Business objective: ${item.businessObjective}`,
        "",
        `Implementation: ${item.implementation}`,
        "",
      );
    });
  }

  if (sitemap.length) {
    lines.push("## Sitemap", "");
    flattenSitemap(sitemap).forEach((page, index) => {
      lines.push(`### ${index + 1}. ${page.name}` + (page.priority ? " (Priority)" : ""), "", page.purpose, "", `Hero: ${page.heroCopy}`, "");
      if (page.conversionGoal) lines.push(`Conversion: ${page.conversionGoal}`, "");
      if (page.sections.length) {
        lines.push("Sections:", ...page.sections.map((item) => `- ${item}`), "");
      }
    });
  }

  lines.push("## Art direction", "", artDirection.narrative, "", `Density: ${artDirection.density}`, `Motion: ${artDirection.motion}`, "", "Palette:", "");
  for (const color of artDirection.palette) {
    lines.push(`- ${color.name} (${color.role}): ${color.hex}`);
  }
  lines.push("", "Type hierarchy:", "");
  for (const row of artDirection.hierarchy) {
    lines.push(`- ${row.role}: ${row.family}, ${row.size}, weight ${row.weight}, tracking ${row.tracking}`);
    if (row.sample) lines.push(`  Specimen: ${row.sample}`);
  }

  if (lastTelemetry) {
    lines.push(
      "",
      "---",
      "",
      `_Composed with ${lastTelemetry.label}. ${lastTelemetry.reason} Latency ${lastTelemetry.latencyMs} ms. Privacy Shield redactions: ${lastTelemetry.redactionCount}. Model: ${lastTelemetry.model}. Schema valid: ${lastTelemetry.schemaValid ? "yes" : "no"}._`,
      "",
    );
  }

  return lines.join("\n").trim() + "\n";
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadMarkdown(project: StudioProject) {
  const blob = new Blob([projectToMarkdown(project)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const slug = (project.intake.projectName || "atelier-brief")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  anchor.href = url;
  anchor.download = `${slug || "atelier-brief"}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function projectStamp(project: StudioProject) {
  return stamp(project);
}
