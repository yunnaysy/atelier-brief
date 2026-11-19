import type { StudioProject } from "./types";

export function projectToMarkdown(project: StudioProject): string {
  const { intake, sections, sitemap, artDirection, lastTelemetry } = project;
  const tones = intake.tones.join(", ") || "—";
  const lines: string[] = [
    `# ${intake.projectName || "Untitled brief"}`,
    "",
    `Client: ${intake.clientName || "—"}  `,
    `Industry: ${intake.industry || "—"}  `,
    `Budget: ${intake.budget || "—"}  `,
    `Timeline: ${intake.timeline || "—"}  `,
    `Tone: ${tones}  `,
    `Voice reserve: ${intake.voiceReserve}/100`,
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
    lines.push("## Proprietary notes (kept on-device when Nano is available)", "", intake.confidentialNotes, "");
  }

  for (const section of sections) {
    lines.push(`## ${section.title}`, "", section.body.trim() || "_Empty._", "");
  }

  if (sitemap.length) {
    lines.push("## Sitemap", "");
    for (const page of sitemap) {
      lines.push(`### ${page.name}`, "", page.purpose, "", `Hero: ${page.heroCopy}`, "");
      if (page.sections.length) {
        lines.push("Sections:", ...page.sections.map((item) => `- ${item}`), "");
      }
    }
  }

  lines.push("## Art direction", "", artDirection.narrative, "", `Density: ${artDirection.density}`, `Motion: ${artDirection.motion}`, "", "Palette:", "");
  for (const color of artDirection.palette) {
    lines.push(`- ${color.name} (${color.role}): ${color.hex}`);
  }
  lines.push("", "Type hierarchy:", "");
  for (const row of artDirection.hierarchy) {
    lines.push(`- ${row.role}: ${row.family}, ${row.size}, weight ${row.weight}, tracking ${row.tracking}`);
  }

  if (lastTelemetry) {
    lines.push(
      "",
      "---",
      "",
      `_Composed with ${lastTelemetry.label}. ${lastTelemetry.reason} Latency ${lastTelemetry.latencyMs} ms. Privacy Shield redactions: ${lastTelemetry.redactionCount}._`,
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
