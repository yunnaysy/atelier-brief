import type { ArtDirection, FontSubstitution, PaletteColor } from "./types";

/** Default editorial system used when a brief has no palette of its own. */
export const EDITORIAL_PALETTE: PaletteColor[] = [
  { name: "Gallery White", hex: "#FFFFFF", role: "Field" },
  { name: "Charcoal", hex: "#1C1917", role: "Text" },
  { name: "Stone Grey", hex: "#D6D3D1", role: "Rule" },
  { name: "Muted Stone", hex: "#78716C", role: "Secondary" },
  { name: "Umber", hex: "#A66A35", role: "Accent" },
];

const WARM_CREAM = new Set(
  ["#F4F2EC", "#F4F3F0", "#F4EFE6", "#F5E6D3", "#FFF8E7", "#F3EBE0", "#F6F3EC"].map((hex) =>
    hex.toUpperCase(),
  ),
);

export function normalizeHex(value: string | undefined, fallback: string): string {
  const raw = (value ?? "").trim();
  if (/^#([0-9a-fA-F]{3})$/.test(raw)) {
    const short = raw.slice(1);
    return `#${short[0]}${short[0]}${short[1]}${short[1]}${short[2]}${short[2]}`.toUpperCase();
  }
  if (/^#([0-9a-fA-F]{6})$/.test(raw)) return raw.toUpperCase();
  return fallback.toUpperCase();
}

export function isWarmCreamHex(hex: string): boolean {
  return WARM_CREAM.has(normalizeHex(hex, "#000000"));
}

export function pickPaletteColor(
  palette: PaletteColor[],
  pattern: RegExp,
  fallback: string,
  index = 0,
): string {
  const found = palette.find((color) => pattern.test(`${color.role} ${color.name}`));
  return normalizeHex(found?.hex ?? palette[index]?.hex, fallback);
}

/**
 * Use the brief's palette as specified. Never silently replace a warm or cream
 * field color — log it so the receipt can show what was actually rendered.
 */
export function resolvePalette(art: ArtDirection): { palette: PaletteColor[]; log: string[] } {
  const log: string[] = [];
  const palette = (art.palette?.length ? art.palette : EDITORIAL_PALETTE).map((color) => ({
    ...color,
    hex: normalizeHex(color.hex, "#FFFFFF"),
  }));
  if (!art.palette?.length) {
    log.push("No palette on the brief; the renderer used the default gallery-white editorial system.");
  }
  for (const color of palette) {
    if (isWarmCreamHex(color.hex)) {
      log.push(
        `Brief specified ${color.name} ${color.hex} (${color.role}). The renderer used this color as written and did not replace it with gallery white.`,
      );
    }
  }
  const field = pickPaletteColor(palette, /field|paper|ground|canvas|background/i, "#FFFFFF", 0);
  log.push(`Rendered field color: ${field}.`);
  return { palette, log };
}

const DISPLAY_BUNDLED = ["instrument serif", "cormorant garamond"];
const BODY_BUNDLED = ["dm sans", "inter"];
const MONO_BUNDLED = ["ibm plex mono"];

function canonical(name: string): string {
  return name.replace(/["']/g, "").replace(/\s+/g, " ").trim();
}

function substitute(requested: string, role: FontSubstitution["role"]): FontSubstitution {
  const name = canonical(requested);
  const lower = name.toLowerCase();
  if (role === "display") {
    if (DISPLAY_BUNDLED.includes(lower)) {
      return { role, requested: name || "Instrument Serif", rendered: name, status: "exact" };
    }
    return { role, requested: name || "Fraunces", rendered: "Instrument Serif", status: "substitute" };
  }
  if (role === "mono") {
    if (MONO_BUNDLED.includes(lower)) {
      return { role, requested: name || "IBM Plex Mono", rendered: name, status: "exact" };
    }
    return { role, requested: name || "IBM Plex Mono", rendered: "IBM Plex Mono", status: "substitute" };
  }
  if (BODY_BUNDLED.includes(lower)) {
    return { role, requested: name || "DM Sans", rendered: name, status: "exact" };
  }
  return { role, requested: name || "IBM Plex Sans", rendered: "DM Sans", status: "substitute" };
}

export function resolveFonts(art: ArtDirection): FontSubstitution[] {
  return [
    substitute(art.displayFamily || "Instrument Serif", "display"),
    substitute(art.bodyFamily || "DM Sans", "body"),
    substitute(art.monoFamily || "IBM Plex Mono", "mono"),
  ];
}

export function fontStack(rendered: string, role: FontSubstitution["role"]): string {
  const named = canonical(rendered);
  if (role === "display") {
    return `"${named}", "Instrument Serif", "Cormorant Garamond", "Palatino Linotype", Palatino, serif`;
  }
  if (role === "mono") {
    return `"${named}", "IBM Plex Mono", ui-monospace, monospace`;
  }
  return `"${named}", "DM Sans", Inter, "Helvetica Neue", system-ui, sans-serif`;
}

export function fontFaceCss(assetBase: string): string {
  const base = assetBase.replace(/\/$/, "") + "/fonts";
  const faces: Array<[string, string, string, string]> = [
    ["Instrument Serif", "400", "normal", "instrument-serif-latin-400-normal.woff2"],
    ["Instrument Serif", "400", "italic", "instrument-serif-latin-400-italic.woff2"],
    ["Cormorant Garamond", "500", "normal", "cormorant-garamond-latin-500-normal.woff2"],
    ["Cormorant Garamond", "500", "italic", "cormorant-garamond-latin-500-italic.woff2"],
    ["DM Sans", "400", "normal", "dm-sans-latin-400-normal.woff2"],
    ["DM Sans", "400", "italic", "dm-sans-latin-400-italic.woff2"],
    ["DM Sans", "500", "normal", "dm-sans-latin-500-normal.woff2"],
    ["IBM Plex Mono", "400", "normal", "ibm-plex-mono-latin-400-normal.woff2"],
    ["IBM Plex Mono", "500", "normal", "ibm-plex-mono-latin-500-normal.woff2"],
    ["Inter", "400", "normal", "inter-latin-400-normal.woff2"],
    ["Inter", "500", "normal", "inter-latin-500-normal.woff2"],
  ];
  return faces
    .map(
      ([family, weight, style, file]) =>
        `@font-face{font-family:"${family}";font-weight:${weight};font-style:${style};font-display:swap;src:url("${base}/${file}") format("woff2");}`,
    )
    .join("");
}

export const FONT_FILES = [
  "instrument-serif-latin-400-normal.woff2",
  "instrument-serif-latin-400-italic.woff2",
  "cormorant-garamond-latin-500-normal.woff2",
  "cormorant-garamond-latin-500-italic.woff2",
  "dm-sans-latin-400-normal.woff2",
  "dm-sans-latin-400-italic.woff2",
  "dm-sans-latin-500-normal.woff2",
  "ibm-plex-mono-latin-400-normal.woff2",
  "ibm-plex-mono-latin-500-normal.woff2",
  "inter-latin-400-normal.woff2",
  "inter-latin-500-normal.woff2",
];
