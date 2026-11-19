import type { ArtDirection, BriefSection, DesignRationaleItem, GeneratedBundle, SitemapPage } from "./types";
import { SECTION_DEFS } from "./types";

const HEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const DENSITIES = new Set(["airy", "balanced", "compact"]);

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  bundle?: GeneratedBundle;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asSections(value: unknown): BriefSection[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return { id: text(row.id), title: text(row.title), body: text(row.body) };
  });
}

function asPage(item: unknown): SitemapPage {
  const row = (item ?? {}) as Record<string, unknown>;
  return {
    id: text(row.id) || "",
    name: text(row.name),
    purpose: text(row.purpose),
    sections: Array.isArray(row.sections) ? row.sections.map((entry) => String(entry)) : [],
    heroCopy: text(row.heroCopy),
    priority: Boolean(row.priority),
    conversionGoal: text(row.conversionGoal),
    children: Array.isArray(row.children) ? row.children.map(asPage) : [],
  };
}

function asPages(value: unknown): SitemapPage[] {
  if (!Array.isArray(value)) return [];
  return value.map(asPage);
}

export function flattenSitemap(pages: SitemapPage[]): SitemapPage[] {
  const out: SitemapPage[] = [];
  const walk = (nodes: SitemapPage[]) => {
    for (const page of nodes) {
      out.push(page);
      if (page.children?.length) walk(page.children);
    }
  };
  walk(pages);
  return out;
}

function asRationale(value: unknown): DesignRationaleItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      recommendation: text(row.recommendation),
      reasoning: text(row.reasoning),
      businessObjective: text(row.businessObjective),
      implementation: text(row.implementation),
    };
  });
}

function asArt(value: unknown): ArtDirection | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const palette = Array.isArray(row.palette)
    ? row.palette.map((item) => {
        const color = (item ?? {}) as Record<string, unknown>;
        return { name: text(color.name), hex: text(color.hex), role: text(color.role) };
      })
    : [];
  const hierarchy = Array.isArray(row.hierarchy)
    ? row.hierarchy.map((item) => {
        const type = (item ?? {}) as Record<string, unknown>;
        return {
          role: text(type.role),
          family: text(type.family),
          size: text(type.size),
          weight: text(type.weight),
          tracking: text(type.tracking),
          sample: text(type.sample),
        };
      })
    : [];
  return {
    narrative: text(row.narrative),
    displayFamily: text(row.displayFamily),
    bodyFamily: text(row.bodyFamily),
    monoFamily: text(row.monoFamily),
    density: (text(row.density) as ArtDirection["density"]) || "balanced",
    motion: text(row.motion),
    palette,
    hierarchy,
  };
}

export function validateBundle(value: unknown, mode: "full" | "section" = "full", sectionId?: string): ValidationResult {
  const errors: string[] = [];
  if (!value || typeof value !== "object") {
    return { ok: false, errors: ["The model did not return a JSON object."] };
  }

  const raw = value as Record<string, unknown>;
  const sections = asSections(raw.sections);

  if (mode === "section") {
    const target = sectionId ? sections.find((section) => section.id === sectionId) : sections[0];
    if (!target) errors.push(`Missing regenerated section ${sectionId ?? ""}.`.trim());
    else if (!target.title || !target.body) errors.push(`Section "${target.id}" is missing a title or body.`);
    return { ok: errors.length === 0, errors, bundle: errors.length ? undefined : {
      sections,
      sitemap: [],
      artDirection: asArt({}) as ArtDirection,
      rationale: [],
    } };
  }

  for (const def of SECTION_DEFS) {
    const section = sections.find((item) => item.id === def.id);
    if (!section) errors.push(`Missing required section "${def.id}".`);
    else if (!section.body) errors.push(`Section "${def.id}" has an empty body.`);
  }

  const sitemap = asPages(raw.sitemap);
  const flat = flattenSitemap(sitemap);
  if (flat.length < 5) errors.push("Sitemap must include at least 5 pages.");
  const ids = flat.map((page) => page.id);
  if (ids.some((id) => !id)) errors.push("Every sitemap page must have a non-empty id.");
  if (new Set(ids.filter(Boolean)).size !== ids.filter(Boolean).length) {
    errors.push("Sitemap page ids must be unique.");
  }
  if (flat.some((page) => !page.name || !page.purpose || !page.heroCopy)) {
    errors.push("Every sitemap page needs a name, purpose, and hero copy.");
  }

  const art = asArt(raw.artDirection);
  if (!art) errors.push("Missing artDirection object.");
  else {
    if (!art.narrative || !art.displayFamily || !art.bodyFamily || !art.monoFamily || !art.motion) {
      errors.push("Art direction is missing required typographic fields.");
    }
    if (!DENSITIES.has(art.density)) errors.push("Art direction density must be airy, balanced, or compact.");
    if (art.palette.length < 5) errors.push("Art direction palette must include at least 5 colors.");
    if (art.palette.some((color) => !HEX.test(color.hex) || !color.name)) {
      errors.push("Every palette color must have a name and a valid hex value.");
    }
    if (art.hierarchy.length < 3 || art.hierarchy.some((row) => !row.role || !row.family || !row.sample)) {
      errors.push("Art direction hierarchy is incomplete.");
    }
  }

  const rationale = asRationale(raw.rationale);
  if (rationale.length < 3) errors.push("Design Decision Rationale must include at least 3 items.");
  if (rationale.some((item) => !item.recommendation || !item.reasoning || !item.businessObjective || !item.implementation)) {
    errors.push("Every rationale item needs recommendation, reasoning, businessObjective, and implementation.");
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    errors: [],
    bundle: {
      sections: SECTION_DEFS.map((def) => sections.find((section) => section.id === def.id)!),
      sitemap,
      artDirection: art!,
      rationale,
    },
  };
}

export function humanBadgeLabel(badge: "on-device" | "cloud" | "error-fallback" | "preview" | "idle" | string): string {
  switch (badge) {
    case "on-device":
      return "On-Device";
    case "cloud":
      return "Cloud Hybrid";
    case "error-fallback":
      return "Local Fallback";
    default:
      return "Studio Preview";
  }
}

export function labelForBadge(badge: "on-device" | "cloud" | "error-fallback" | "preview"): string {
  switch (badge) {
    case "on-device":
      return "On-Device · Gemini Nano";
    case "cloud":
      return "Cloud Hybrid · Firebase AI Logic";
    case "error-fallback":
      return "Local Fallback · AI Call Failed";
    default:
      return "Studio Preview · Deterministic Non-AI";
  }
}

export function statusStripCopy(badge: "on-device" | "cloud" | "error-fallback" | "preview" | "idle", fieldCount: number): string {
  const n = Math.max(0, fieldCount);
  const fields = `${n} confidential field${n === 1 ? "" : "s"}`;
  switch (badge) {
    case "on-device":
      return "On-device · Gemini Nano · Stays local";
    case "cloud":
      return `Cloud hybrid · ${n} field${n === 1 ? "" : "s"} redacted before send`;
    case "error-fallback":
      return "Local Fallback · AI call failed";
    default:
      return `Studio preview · No cloud call · ${fields} ready for redaction`;
  }
}

export function badgeForSuccessfulInference(source: "on_device" | "in_cloud" | string | null | undefined): "on-device" | "cloud" | null {
  if (source === "on_device") return "on-device";
  if (source === "in_cloud") return "cloud";
  return null;
}

export function badgeForFailure(configured: boolean): "error-fallback" | "preview" {
  return configured ? "error-fallback" : "preview";
}
