import type { ArtDirection, PhotoCredit, SiteCopy } from "./types";
import { escapeHtml, defaultNav } from "./siteCopy";
import { photoById, publicPhotoUrl, uniqueCredits } from "./referencePhotos";

export interface RenderOptions {
  /** Origin or "" so preview can load /references and /fonts from the app. */
  assetBase?: string;
  documentTitle?: string;
  brandName?: string;
}

function hex(value: string | undefined, fallback: string): string {
  const raw = (value ?? "").trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(raw) ? raw : fallback;
}

function pick(art: ArtDirection, pattern: RegExp, fallback: string, index = 0): string {
  const found = art.palette.find((color) => pattern.test(`${color.role} ${color.name}`));
  return hex(found?.hex ?? art.palette[index]?.hex, fallback);
}

function fontStack(family: string, role: "display" | "body" | "mono"): string {
  const named = family.replace(/["']/g, "").trim() || (role === "display" ? "Instrument Serif" : role === "mono" ? "IBM Plex Mono" : "DM Sans");
  if (role === "display") {
    return `"${named}", "Instrument Serif", "Cormorant Garamond", "Palatino Linotype", Palatino, serif`;
  }
  if (role === "mono") {
    return `"${named}", "IBM Plex Mono", "IBM Plex Mono", ui-monospace, monospace`;
  }
  return `"${named}", "DM Sans", Inter, "Helvetica Neue", system-ui, sans-serif`;
}

function fontFaces(assetBase: string): string {
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

function figure(photoId: string, assetBase: string, caption?: string): string {
  const photo = photoById(photoId);
  if (!photo) return "";
  const src = publicPhotoUrl(photo, assetBase);
  const cap = caption
    ? `<figcaption>${escapeHtml(caption)}</figcaption>`
    : `<figcaption class="credit-only">${escapeHtml(photo.photographer)} · ${escapeHtml(photo.license)}</figcaption>`;
  return `<figure class="shot" data-photo="${escapeHtml(photo.id)}">
      <img src="${escapeHtml(src)}" alt="${escapeHtml(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy" />
      ${cap}
    </figure>`;
}

export function collectPhotoIds(copy: SiteCopy): string[] {
  return uniqueCredits([
    "hero",
    "lobby",
    ...copy.rooms.map((room) => room.photoId),
    ...copy.experiences.map((item) => item.photoId ?? ""),
    ...copy.gallery.map((item) => item.photoId),
  ]).map((photo) => photo.id);
}

export function creditsForCopy(copy: SiteCopy): PhotoCredit[] {
  return uniqueCredits(collectPhotoIds(copy));
}

export function renderSiteHtml(copy: SiteCopy, art: ArtDirection, options: RenderOptions = {}): string {
  const assetBase = options.assetBase ?? "";
  const field = pick(art, /field|paper|ground|canvas|background/i, "#F4F2EC", 0);
  const ink = pick(art, /text|ink|charcoal|espresso|near.?black/i, "#1C1917", 1);
  const rule = pick(art, /rule|line|border|stone|limestone|muted/i, "#C5C1B6", 2);
  const accent = pick(art, /accent|pine|brand|signal/i, "#45584F", 3);
  const secondary = pick(art, /secondary|mist|slate|quiet/i, "#8799A0", 4);
  const display = fontStack(art.displayFamily, "display");
  const body = fontStack(art.bodyFamily, "body");
  const mono = fontStack(art.monoFamily, "mono");
  const airy = art.density !== "compact";
  const title = options.documentTitle || options.brandName || copy.headline.replace(/[.!?]$/, "") || "House";
  const brand = options.brandName || title;
  const nav = (copy.nav && copy.nav.length ? copy.nav : defaultNav())
    .map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`)
    .join("");
  const hero = photoById("hero");
  const heroSrc = hero ? publicPhotoUrl(hero, assetBase) : "";
  const aboutPhoto = figure("lounge", assetBase);
  const rooms = copy.rooms
    .map(
      (room, index) => `
      <article class="room ${index % 2 === 1 ? "is-flip" : ""}">
        ${figure(room.photoId, assetBase)}
        <div class="room-copy">
          <p class="index">${String(index + 1).padStart(2, "0")}</p>
          <h3>${escapeHtml(room.name)}</h3>
          <p>${escapeHtml(room.lede)}</p>
        </div>
      </article>`,
    )
    .join("");
  const experiences = copy.experiences
    .map(
      (item, index) => `
      <article class="experience">
        <p class="index">${String(index + 1).padStart(2, "0")}</p>
        ${item.photoId ? figure(item.photoId, assetBase) : ""}
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.body)}</p>
      </article>`,
    )
    .join("");
  const gallery = copy.gallery
    .map((item, index) => `<div class="tile tile-${(index % 3) + 1}">${figure(item.photoId, assetBase, item.caption)}</div>`)
    .join("");
  const credits = creditsForCopy(copy)
    .map(
      (photo) => `
      <li>
        <span>${escapeHtml(photo.alt)}.</span>
        Photograph by <a href="${escapeHtml(photo.photographerUrl)}">${escapeHtml(photo.photographer)}</a>,
        <a href="${escapeHtml(photo.sourceUrl)}">${escapeHtml(photo.source)}</a>,
        licensed under <a href="${escapeHtml(photo.licenseUrl)}">${escapeHtml(photo.license)}</a>.
        ${escapeHtml(photo.subjectNote)}
      </li>`,
    )
    .join("");

  const css = `${fontFaces(assetBase)}
:root{
  --field:${field};
  --ink:${ink};
  --rule:${rule};
  --accent:${accent};
  --muted:${secondary};
  --display:${display};
  --body:${body};
  --mono:${mono};
  --pad:${airy ? "clamp(1.5rem, 5vw, 5.5rem)" : "clamp(1.1rem, 3vw, 3.25rem)"};
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--field);color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
img{max-width:100%;height:auto;display:block}
a{color:inherit;text-decoration-thickness:1px;text-underline-offset:0.22em}
a:hover{color:var(--accent)}
.skip{position:absolute;left:-999px;top:0}
.skip:focus{left:1rem;top:1rem;background:var(--field);padding:0.4rem 0.7rem;z-index:20}
.mast{position:absolute;top:0;left:0;right:0;z-index:5;display:flex;justify-content:space-between;align-items:baseline;padding:1.25rem var(--pad);color:#f6f3ee;mix-blend-mode:difference}
.brand{font-family:var(--display);font-size:1.35rem;letter-spacing:-0.03em}
.mast nav{display:flex;gap:1.4rem;font-family:var(--mono);font-size:0.68rem;letter-spacing:0.14em;text-transform:uppercase}
.mast nav a{text-decoration:none}
.hero{position:relative;min-height:100vh;color:#f6f3ee;display:flex;align-items:flex-end}
.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(12,10,8,0.15) 0%,rgba(12,10,8,0.18) 45%,rgba(12,10,8,0.72) 100%)}
.hero-copy{position:relative;z-index:1;padding:0 var(--pad) 4.5rem;max-width:52rem}
.kicker{font-family:var(--mono);font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 1rem}
.hero h1{font-family:var(--display);font-weight:400;font-size:clamp(3.1rem, 8.4vw, 7.4rem);line-height:0.92;letter-spacing:-0.035em;margin:0 0 1.4rem}
.lede{max-width:34rem;font-size:1.08rem;line-height:1.65;margin:0 0 1.8rem;color:rgba(246,243,238,0.88)}
.cta{display:inline-flex;align-items:center;gap:0.7rem;padding:0.85rem 1.3rem;border:1px solid rgba(246,243,238,0.55);color:#f6f3ee;text-decoration:none;font-family:var(--mono);font-size:0.68rem;letter-spacing:0.16em;text-transform:uppercase}
.cta:hover{background:rgba(246,243,238,0.12);color:#fff}
.section{padding:4.8rem var(--pad)}
.section-head{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;border-top:1px solid var(--rule);padding-top:1.1rem;margin-bottom:2.4rem}
.section-head .index,.index{font-family:var(--mono);font-size:0.68rem;letter-spacing:0.16em;text-transform:uppercase;color:var(--muted);margin:0 0 0.6rem}
.section-head h2{font-family:var(--display);font-weight:400;font-size:clamp(2rem, 4vw, 3.4rem);letter-spacing:-0.03em;margin:0}
.about{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:3rem;align-items:end}
.about-copy p{font-size:1.12rem;line-height:1.7;margin:0;max-width:34rem}
.shot{margin:0}
.shot img{width:100%;height:auto;object-fit:cover;aspect-ratio:3/2;background:var(--rule)}
.shot figcaption,.credit-only{font-family:var(--mono);font-size:0.62rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);margin:0.65rem 0 0}
.room{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(16rem,0.85fr);gap:2.4rem;align-items:center;margin-bottom:4rem}
.room.is-flip{grid-template-columns:minmax(16rem,0.85fr) minmax(0,1.35fr)}
.room.is-flip .room-copy{order:-1}
.room-copy h3{font-family:var(--display);font-weight:400;font-size:clamp(1.8rem, 3vw, 2.6rem);letter-spacing:-0.03em;margin:0 0 0.8rem}
.room-copy p{margin:0;max-width:28rem}
.experiences{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.8rem}
.experience h3{font-family:var(--display);font-weight:400;font-size:1.7rem;letter-spacing:-0.02em;margin:0.9rem 0 0.5rem}
.experience p{margin:0;color:var(--ink)}
.experience .shot img{aspect-ratio:4/5}
.gallery{display:grid;grid-template-columns:1.3fr 1fr 1fr;grid-auto-rows:minmax(12rem,auto);gap:0.9rem}
.tile-1{grid-row:span 2}
.tile-1 .shot img{aspect-ratio:3/4;height:100%}
.booking{background:var(--ink);color:var(--field);padding:5.5rem var(--pad)}
.booking h2{font-family:var(--display);font-weight:400;font-size:clamp(2.4rem, 6vw, 5rem);letter-spacing:-0.03em;line-height:0.95;margin:0 0 1.2rem;max-width:16ch}
.booking p{max-width:32rem;margin:0 0 1.8rem;color:rgba(244,242,236,0.82)}
.booking .cta{border-color:rgba(244,242,236,0.5)}
.colophon{padding:3rem var(--pad) 4rem;border-top:1px solid var(--rule)}
.colophon .tagline{font-family:var(--display);font-size:1.5rem;letter-spacing:-0.02em;margin:0 0 2rem}
.credits{margin:0;padding:0;list-style:none;max-width:58rem}
.credits li{font-size:0.78rem;line-height:1.55;color:var(--muted);margin:0 0 0.75rem;padding-bottom:0.75rem;border-bottom:1px solid var(--rule)}
.credits a{color:var(--ink)}
@media (max-width: 860px){
  .mast{flex-direction:column;gap:0.7rem;align-items:flex-start;mix-blend-mode:normal;background:linear-gradient(180deg,rgba(12,10,8,0.55),transparent)}
  .mast nav{flex-wrap:wrap;gap:0.55rem 0.9rem;font-size:0.62rem}
  .about,.room,.room.is-flip,.experiences,.gallery{grid-template-columns:1fr}
  .room.is-flip .room-copy{order:0}
  .tile-1{grid-row:auto}
  .hero{min-height:88vh}
}
`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${css}</style>
</head>
<body>
  <a class="skip" href="#stay">Skip to reservation</a>
  <header class="mast">
    <div class="brand">${escapeHtml(brand)}</div>
    <nav aria-label="Site">${nav}</nav>
  </header>
  <section class="hero">
    ${hero ? `<img src="${escapeHtml(heroSrc)}" alt="${escapeHtml(hero.alt)}" width="${hero.width}" height="${hero.height}" />` : ""}
    <div class="hero-copy">
      <p class="kicker">${escapeHtml(copy.kicker)}</p>
      <h1>${escapeHtml(copy.headline)}</h1>
      <p class="lede">${escapeHtml(copy.lede)}</p>
      <a class="cta" href="#stay">${escapeHtml(copy.ctaLabel)}</a>
    </div>
  </section>
  <section class="section" id="house">
    <div class="section-head"><p class="index">01 · About</p><h2>${escapeHtml(copy.aboutTitle)}</h2></div>
    <div class="about">
      <div class="about-copy"><p>${escapeHtml(copy.aboutBody)}</p></div>
      ${aboutPhoto}
    </div>
  </section>
  <section class="section" id="rooms">
    <div class="section-head"><p class="index">02 · Stay</p><h2>${escapeHtml(copy.roomsTitle)}</h2></div>
    ${rooms}
  </section>
  <section class="section" id="experiences">
    <div class="section-head"><p class="index">03 · Days</p><h2>${escapeHtml(copy.experiencesTitle)}</h2></div>
    <div class="experiences">${experiences}</div>
  </section>
  <section class="section" id="gallery">
    <div class="section-head"><p class="index">04 · Light</p><h2>${escapeHtml(copy.galleryTitle)}</h2></div>
    <div class="gallery">${gallery}</div>
  </section>
  <section class="booking" id="stay">
    <h2>${escapeHtml(copy.bookingTitle)}</h2>
    <p>${escapeHtml(copy.bookingBody)}</p>
    <a class="cta" href="#stay">${escapeHtml(copy.bookingCta)}</a>
  </section>
  <footer class="colophon">
    <p class="tagline">${escapeHtml(copy.footerTagline)}</p>
    <p class="index">Photograph credits</p>
    <ul class="credits" data-testid="site-credits">${credits}</ul>
  </footer>
</body>
</html>`;
}

const FONT_FILES = [
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

async function blobToDataUri(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const mime = blob.type || "application/octet-stream";
  return `data:${mime};base64,${btoa(binary)}`;
}

/** Inline local /references and /fonts assets so the HTML file works offline. */
export async function inlineSiteAssets(html: string, assetBase = ""): Promise<string> {
  const base = assetBase.replace(/\/$/, "");
  const cache = new Map<string, string>();
  const fetchAsData = async (path: string): Promise<string> => {
    if (cache.has(path)) return cache.get(path)!;
    const url = path.startsWith("http") ? path : `${base}${path}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not inline ${path}`);
    const uri = await blobToDataUri(await response.blob());
    cache.set(path, uri);
    return uri;
  };

  let out = html;
  for (const photo of uniqueCredits(
    Array.from(html.matchAll(/\/references\/([a-z0-9-]+)\.jpg/g)).map((match) => match[1]),
  )) {
    const path = `/references/${photo.file}`;
    const uri = await fetchAsData(path);
    out = out.split(`${base}${path}`).join(uri).split(path).join(uri);
  }
  for (const file of FONT_FILES) {
    const path = `/fonts/${file}`;
    if (!out.includes(path) && !out.includes(`${base}${path}`)) continue;
    const uri = await fetchAsData(path);
    out = out.split(`${base}${path}`).join(uri).split(path).join(uri);
  }
  return out;
}

export function downloadHtmlFile(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function siteFilename(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug || "atelier-site"}.html`;
}
