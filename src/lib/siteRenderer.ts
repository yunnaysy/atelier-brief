import type { ArtDirection, PhotoCredit, SiteCopy } from "./types";
import { escapeHtml, defaultNav } from "./siteCopy";
import { photoById, publicPhotoUrl, referenceCaption, uniqueCredits } from "./referencePhotos";
import {
  FONT_FILES,
  fontFaceCss,
  fontStack,
  pickPaletteColor,
  resolveFonts,
  resolvePalette,
} from "./siteTheme";

export interface RenderOptions {
  assetBase?: string;
  documentTitle?: string;
  brandName?: string;
}

function figure(photoId: string, assetBase: string, caption?: string): string {
  const photo = photoById(photoId);
  if (!photo) return "";
  const src = publicPhotoUrl(photo, assetBase);
  const credit = referenceCaption(photo);
  const extra = caption ? `<span class="cap-note">${escapeHtml(caption)}</span>` : "";
  return `<figure class="shot" data-photo="${escapeHtml(photo.id)}">
      <img src="${escapeHtml(src)}" alt="${escapeHtml(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy" />
      <figcaption>
        <span class="ref-label">Reference photography</span>
        ${escapeHtml(credit)}
        ${extra}
      </figcaption>
    </figure>`;
}

export function collectPhotoIds(copy: SiteCopy): string[] {
  return uniqueCredits([
    "hero",
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
  const { palette } = resolvePalette(art);
  const fonts = resolveFonts(art);
  const displayFont = fonts.find((item) => item.role === "display")!;
  const bodyFont = fonts.find((item) => item.role === "body")!;
  const monoFont = fonts.find((item) => item.role === "mono")!;
  const field = pickPaletteColor(palette, /field|paper|ground|canvas|background/i, "#FFFFFF", 0);
  const ink = pickPaletteColor(palette, /text|ink|charcoal|espresso|near.?black/i, "#1C1917", 1);
  const rule = pickPaletteColor(palette, /rule|line|border|stone|grey|gray/i, "#D6D3D1", 2);
  const muted = pickPaletteColor(palette, /secondary|muted|mist|slate|quiet/i, "#78716C", 3);
  const accent = pickPaletteColor(palette, /accent|umber|pine|brand|signal/i, "#A66A35", 4);
  const display = fontStack(displayFont.rendered, "display");
  const body = fontStack(bodyFont.rendered, "body");
  const mono = fontStack(monoFont.rendered, "mono");
  const airy = art.density !== "compact";
  const title = options.documentTitle || options.brandName || copy.headline.replace(/[.!?]$/, "") || "House";
  const brand = options.brandName || title;
  const navLinks = (copy.nav && copy.nav.length ? copy.nav : defaultNav())
    .map(
      (link, index) =>
        `<a href="${escapeHtml(link.href)}"><span class="nav-num">${String(index + 1).padStart(2, "0")}</span> ${escapeHtml(link.label)}</a>`,
    )
    .join("");
  const hero = photoById("hero");
  const heroSrc = hero ? publicPhotoUrl(hero, assetBase) : "";
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
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.body)}</p>
      </article>`,
    )
    .join("");
  const gallery = copy.gallery
    .map((item) => `<div class="tile">${figure(item.photoId, assetBase, item.caption)}</div>`)
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
  const fontNote = fonts
    .map((item) => `${item.role}: ${item.requested} → ${item.rendered} (${item.status})`)
    .join(" · ");

  const css = `${fontFaceCss(assetBase)}
:root{
  --field:${field};
  --ink:${ink};
  --rule:${rule};
  --accent:${accent};
  --muted:${muted};
  --quiet:#F5F5F4;
  --display:${display};
  --body:${body};
  --mono:${mono};
  --pad:${airy ? "clamp(1.5rem, 5vw, 5.5rem)" : "clamp(1.1rem, 3vw, 3.25rem)"};
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--field);color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.65;-webkit-font-smoothing:antialiased}
@media (max-width:860px){html,body{font-size:18px}}
img{max-width:100%;height:auto;display:block}
a{color:inherit;text-decoration-thickness:1px;text-underline-offset:0.22em}
a:hover{color:var(--accent)}
.skip{position:absolute;left:-999px;top:0}
.skip:focus{left:1rem;top:1rem;background:var(--field);padding:0.4rem 0.7rem;z-index:30}
.mast{position:absolute;top:0;left:0;right:0;z-index:8;display:flex;justify-content:space-between;align-items:center;padding:1.1rem var(--pad);color:#FFFFFF;background:linear-gradient(180deg,rgba(12,10,8,0.55) 0%,rgba(12,10,8,0.18) 62%,transparent 100%)}
.brand{font-family:var(--display);font-size:1.35rem;letter-spacing:-0.03em}
.menu-toggle,.menu-close{display:none;appearance:none;border:1px solid rgba(255,255,255,0.55);background:transparent;color:#FFFFFF;font-family:var(--mono);font-size:0.68rem;letter-spacing:0.14em;text-transform:uppercase;padding:0.55rem 0.8rem}
.site-nav{display:flex;gap:28px;align-items:center;font-family:var(--body);font-size:0.7rem;font-weight:500;letter-spacing:0.12em;text-transform:uppercase}
.site-nav a{text-decoration:none;color:#FFFFFF}
.site-nav a:hover{color:#fff}
.site-nav .nav-num{display:none}
.hero{position:relative;min-height:100vh;color:#FFFFFF;display:flex;align-items:flex-end;padding-top:6.5rem;isolation:isolate}
.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(12,10,8,0.12) 0%,rgba(12,10,8,0.16) 42%,rgba(12,10,8,0.66) 100%)}
.hero-copy{position:relative;z-index:1;padding:0 var(--pad) 4.5rem;max-width:52rem}
.kicker{font-family:var(--mono);font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 1rem;color:#FFFFFF;text-shadow:0 1px 2px rgba(0,0,0,0.55),0 0 24px rgba(0,0,0,0.35)}
.hero h1{font-family:var(--display);font-weight:400;font-size:clamp(3rem, 8vw, 6.5rem);line-height:0.92;letter-spacing:-0.035em;margin:0 0 1.4rem;max-width:16ch;text-shadow:0 2px 24px rgba(0,0,0,0.28)}
.lede{max-width:36rem;font-size:1.05rem;line-height:1.65;margin:0 0 1.8rem;color:rgba(255,255,255,0.92);text-shadow:0 1px 12px rgba(0,0,0,0.35)}
.hero-actions{display:flex;flex-wrap:wrap;gap:0.8rem 1.1rem;align-items:center}
.cta{display:inline-flex;align-items:center;gap:0.7rem;padding:0.85rem 1.3rem;border:1px solid rgba(255,255,255,0.55);color:#FFFFFF;text-decoration:none;font-family:var(--mono);font-size:0.68rem;letter-spacing:0.16em;text-transform:uppercase}
.cta:hover{background:rgba(255,255,255,0.12);color:#fff}
.cta-secondary{border-color:transparent;padding-left:0.2rem}
.section{padding:4.8rem var(--pad);background:var(--field)}
.section-head{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;border-top:1px solid var(--rule);padding-top:1.1rem;margin-bottom:2.4rem}
.index{font-family:var(--mono);font-size:0.68rem;letter-spacing:0.16em;text-transform:uppercase;color:var(--muted);margin:0 0 0.6rem}
.section-head h2{font-family:var(--display);font-weight:400;font-size:clamp(2rem, 4vw, 3.4rem);letter-spacing:-0.03em;margin:0}
.about{max-width:38rem}
.about p{font-size:1.12rem;line-height:1.7;margin:0}
.shot{margin:0;min-width:0;position:relative;z-index:0}
.shot img{display:block}
.shot img{width:100%;height:auto;object-fit:cover;aspect-ratio:3/2;background:var(--quiet)}
.shot figcaption{font-family:var(--mono);font-size:0.62rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);margin:0.7rem 0 0;line-height:1.5}
.ref-label{display:inline-block;margin-right:0.6rem;color:var(--ink);letter-spacing:0.12em}
.cap-note{display:block;margin-top:0.25rem;text-transform:none;letter-spacing:0.02em;font-family:var(--body);font-size:0.78rem}
.room{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(16rem,0.85fr);gap:2.4rem;align-items:center;margin-bottom:4rem}
.room.is-flip{grid-template-columns:minmax(16rem,0.85fr) minmax(0,1.35fr)}
.room.is-flip .room-copy{order:-1}
.room-copy{position:relative;z-index:1;min-width:0}
.room-copy h3{font-family:var(--display);font-weight:400;font-size:clamp(1.8rem, 3vw, 2.6rem);letter-spacing:-0.03em;margin:0 0 0.8rem}
.room-copy p{margin:0;max-width:28rem}
.experiences{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.8rem}
.experience h3{font-family:var(--display);font-weight:400;font-size:1.6rem;letter-spacing:-0.02em;margin:0 0 0.5rem}
.experience p{margin:0}
.gallery{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:0.9rem}
.gallery-note{max-width:36rem;margin:0 0 1.4rem;color:var(--muted)}
.booking{background:var(--ink);color:var(--field);padding:5.5rem var(--pad)}
.booking-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(18rem,1fr);gap:3rem;align-items:start}
.booking h2{font-family:var(--display);font-weight:400;font-size:clamp(2.4rem, 6vw, 5rem);letter-spacing:-0.03em;line-height:0.95;margin:0 0 1.2rem;max-width:16ch}
.booking .intro{max-width:32rem;margin:0 0 0.4rem;color:rgba(245,245,244,0.82)}
.booking .index{color:rgba(245,245,244,0.55)}
.enquiry{display:grid;gap:0.75rem}
.enquiry label{display:flex;flex-direction:column;gap:0.3rem;font-family:var(--mono);font-size:0.62rem;letter-spacing:0.14em;text-transform:uppercase;color:rgba(245,245,244,0.7)}
.enquiry input,.enquiry select,.enquiry textarea{
  appearance:none;border:1px solid rgba(245,245,244,0.28);background:transparent;color:var(--field);
  font-family:var(--body);font-size:1rem;letter-spacing:0;text-transform:none;padding:0.7rem 0.8rem
}
.enquiry textarea{min-height:6rem;resize:vertical}
.enquiry button.cta{justify-self:start;cursor:pointer;background:transparent;color:var(--field);border:1px solid rgba(245,245,244,0.55)}
.enquiry-status{margin:0.4rem 0 0;font-size:0.92rem;color:rgba(245,245,244,0.88);display:none}
.enquiry-status.is-visible{display:block}
.enquiry-note{margin:0.6rem 0 0;font-size:0.8rem;color:rgba(245,245,244,0.55)}
.colophon{padding:3rem var(--pad) 4rem;border-top:1px solid var(--rule);background:var(--field)}
.colophon .tagline{font-family:var(--display);font-size:1.5rem;letter-spacing:-0.02em;margin:0 0 2rem}
.credits{margin:0;padding:0;list-style:none;max-width:58rem}
.credits li{font-size:0.84rem;line-height:1.55;color:var(--muted);margin:0 0 0.85rem;padding-bottom:0.85rem;border-bottom:1px solid var(--rule)}
.credits a{color:var(--ink)}
.font-note{margin:1.4rem 0 0;font-family:var(--mono);font-size:0.62rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted)}
@media (max-width: 860px){
  .menu-toggle{display:inline-flex}
  .menu-close{display:inline-flex;position:absolute;top:1.1rem;right:1.1rem}
  .site-nav{display:none}
  body.is-nav-open .site-nav{
    display:flex;flex-direction:column;align-items:flex-start;gap:1.1rem;
    position:fixed;inset:0;background:var(--ink);color:var(--field);z-index:20;
    padding:5rem var(--pad) 2rem;font-size:1rem;letter-spacing:0.08em
  }
  body.is-nav-open .site-nav a{color:var(--field)}
  body.is-nav-open .site-nav .nav-num{display:inline;margin-right:0.5rem;color:var(--muted)}
  .about,.room,.room.is-flip,.experiences,.gallery,.booking-grid{grid-template-columns:1fr}
  .room.is-flip .room-copy{order:0}
  .room,.room.is-flip{gap:1.5rem;align-items:start;margin-bottom:3.5rem}
  .room .shot img{aspect-ratio:4/3}
  .hero{padding-top:5.5rem}
  .hero-copy{padding-bottom:3rem}
  .hero{min-height:88vh}
  .hero h1{font-size:clamp(3rem, 12vw, 3.6rem)}
}
`;

  const script = `(() => {
  const body = document.body;
  const toggle = document.querySelector("[data-menu-toggle]");
  const closeBtn = document.querySelector("[data-menu-close]");
  const nav = document.getElementById("site-nav");
  const setOpen = (open) => {
    body.classList.toggle("is-nav-open", open);
    if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) closeBtn && closeBtn.focus();
    else toggle && toggle.focus();
  };
  toggle && toggle.addEventListener("click", () => setOpen(!body.classList.contains("is-nav-open")));
  closeBtn && closeBtn.addEventListener("click", () => setOpen(false));
  nav && nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
  const form = document.getElementById("enquiry");
  const status = document.getElementById("enquiry-status");
  form && form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (status) {
      status.textContent = "Your enquiry has been prepared. Nothing has been sent — this preview has no booking backend. Copy the details, or write to the house with your own email.";
      status.classList.add("is-visible");
    }
  });
})();`;

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
    <button type="button" class="menu-toggle" data-menu-toggle aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav class="site-nav" id="site-nav" aria-label="Site">
      <button type="button" class="menu-close" data-menu-close>Close</button>
      ${navLinks}
    </nav>
  </header>
  <section class="hero">
    ${hero ? `<img src="${escapeHtml(heroSrc)}" alt="${escapeHtml(hero.alt)}" width="${hero.width}" height="${hero.height}" />` : ""}
    <div class="hero-copy">
      <p class="kicker">${escapeHtml(copy.kicker)}</p>
      <h1>${escapeHtml(copy.headline)}</h1>
      <p class="lede">${escapeHtml(copy.lede)}</p>
      <div class="hero-actions">
        <a class="cta" href="#rooms">${escapeHtml(copy.ctaLabel)}</a>
        <a class="cta cta-secondary" href="#stay">Request a stay</a>
      </div>
    </div>
  </section>
  <section class="section" id="house">
    <div class="section-head"><p class="index">01 · About</p><h2>${escapeHtml(copy.aboutTitle)}</h2></div>
    <div class="about"><p>${escapeHtml(copy.aboutBody)}</p></div>
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
    <p class="gallery-note">Reference imagery, not photographs of ${escapeHtml(brand)}.</p>
    <div class="gallery">${gallery}</div>
  </section>
  <section class="booking" id="stay">
    <div class="booking-grid">
      <div>
        <p class="index">Reservations · Direct enquiries</p>
        <h2>${escapeHtml(copy.bookingTitle)}</h2>
        <p class="intro">${escapeHtml(copy.bookingBody)}</p>
      </div>
      <form class="enquiry" id="enquiry" action="#stay" method="post">
        <p class="index">Your arrival</p>
        <label>Arrival date <input type="date" name="arrival" required /></label>
        <label>Departure date <input type="date" name="departure" required /></label>
        <label>Guests
          <select name="guests" required>
            <option value="1">1 guest</option>
            <option value="2" selected>2 guests</option>
            <option value="3">3 guests</option>
            <option value="4">4 guests</option>
          </select>
        </label>
        <label>Name <input type="text" name="name" autocomplete="name" required /></label>
        <label>Email <input type="email" name="email" autocomplete="email" required /></label>
        <label>Message <textarea name="message" required></textarea></label>
        <button type="submit" class="cta">${escapeHtml(copy.bookingCta)}</button>
        <p class="enquiry-status" id="enquiry-status" role="status"></p>
        <p class="enquiry-note">This form prepares an enquiry in the browser. It does not confirm a reservation or send a message to the hotel.</p>
      </form>
    </div>
  </section>
  <footer class="colophon">
    <p class="tagline">${escapeHtml(copy.footerTagline)}</p>
    <p class="index">Photograph credits</p>
    <ul class="credits" data-testid="site-credits">${credits}</ul>
    <p class="font-note" data-testid="font-map">Type in this file: ${escapeHtml(fontNote)}</p>
  </footer>
  <script>${script}</script>
</body>
</html>`;
}

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

/** Inline only the /references and /fonts assets actually referenced in the HTML. */
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
  const photoFiles = Array.from(html.matchAll(/\/references\/([a-z0-9-]+)\.jpg/g)).map((match) => match[1]);
  for (const photo of uniqueCredits(photoFiles)) {
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
