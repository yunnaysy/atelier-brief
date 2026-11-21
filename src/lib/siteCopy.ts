import { polishGeneratedText } from "./privacyShield";
import { defaultSitePhotoIds, photoById } from "./referencePhotos";
import type {
  ArtDirection,
  BriefSection,
  Intake,
  SiteCopy,
  SiteExperience,
  SiteGalleryItem,
  SiteRoom,
  SitemapPage,
} from "./types";

export const LOREM_RE = /\b(lorem|ipsum|dolor sit|consectetur adipiscing|placeholder text)\b/i;

const PRIVATE_TOKENS = [
  "[BUDGET]",
  "[BUDGET_RANGE]",
  "[PROPRIETARY_NOTES]",
  "[CONFIDENTIAL_NOTES]",
  "[CLIENT_EMAIL]",
  "[CLIENT_PHONE]",
  "[CONTACT_EMAIL]",
  "[CONTACT_PHONE]",
];

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanLine(value: unknown): string {
  return polishGeneratedText(String(value ?? "").replace(/\s+/g, " ").trim());
}

function stripPrivateMaterial(text: string, intake: Intake): string {
  let out = text;
  const secrets = [
    intake.budget,
    intake.confidentialNotes,
    ...PRIVATE_TOKENS,
  ].filter((item) => item && item.length > 3);
  for (const secret of secrets) {
    out = out.split(secret).join("");
  }
  // Drop leftover empty parentheses or doubled punctuation from redaction.
  out = out
    .replace(/\(\s*\)/g, "")
    .replace(/€\s*[–-]\s*/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
  return out;
}

function hotelName(intake: Intake): string {
  return (intake.projectName || intake.clientName || "The House").trim();
}

function assignPhoto(id: string, fallback: string): string {
  return photoById(id) ? id : fallback;
}

export function scrubSiteCopy(copy: SiteCopy, intake: Intake): SiteCopy {
  const scrub = (value: string) => stripPrivateMaterial(value, intake);
  return {
    ...copy,
    kicker: scrub(copy.kicker),
    headline: scrub(copy.headline),
    lede: scrub(copy.lede),
    ctaLabel: scrub(copy.ctaLabel),
    aboutTitle: scrub(copy.aboutTitle),
    aboutBody: scrub(copy.aboutBody),
    roomsTitle: scrub(copy.roomsTitle),
    rooms: copy.rooms.map((room) => ({
      name: scrub(room.name),
      lede: scrub(room.lede),
      photoId: room.photoId,
    })),
    experiencesTitle: scrub(copy.experiencesTitle),
    experiences: copy.experiences.map((item) => ({
      title: scrub(item.title),
      body: scrub(item.body),
      photoId: item.photoId,
    })),
    galleryTitle: scrub(copy.galleryTitle),
    gallery: copy.gallery.map((item) => ({
      photoId: item.photoId,
      caption: scrub(item.caption),
    })),
    bookingTitle: scrub(copy.bookingTitle),
    bookingBody: scrub(copy.bookingBody),
    bookingCta: scrub(copy.bookingCta),
    footerTagline: scrub(copy.footerTagline),
    nav: copy.nav?.map((link) => ({ label: scrub(link.label), href: link.href })),
  };
}

export function defaultNav(): { label: string; href: string }[] {
  return [
    { label: "The House", href: "#house" },
    { label: "Rooms", href: "#rooms" },
    { label: "Experiences", href: "#experiences" },
    { label: "Gallery", href: "#gallery" },
    { label: "Reserve", href: "#stay" },
  ];
}

export function composeLocalWebsite(input: {
  intake: Intake;
  sections: BriefSection[];
  sitemap: SitemapPage[];
  artDirection: ArtDirection;
}): SiteCopy {
  const name = hotelName(input.intake);
  const industry = (input.intake.industry || "hospitality").trim();
  const hospitable = /hotel|hospitality|resort|inn|maison/i.test(`${industry} ${name}`);

  const kicker = hospitable ? "A house, not a landmark" : name;
  const headline = hospitable
    ? `Arrive slowly at ${name}.`
    : `A considered house for ${name}.`;
  const lede = hospitable
    ? `A quieter kind of stay, shaped by open rooms and the pleasure of having nowhere in particular to be. Discover the house, find your room, and make the days your own.`
    : `${name} presents its work plainly: a short public site, precise typography, and a clear path to enquire.`;

  const aboutBody = hospitable
    ? `${name} is kept for travelers who would rather write to the house than book through a marketplace. The stay is personal, the design is considered, and nothing here is arranged as a catalogue of amenities.`
    : `${name} presents itself with typographic reserve: a clear promise, evidence in the work, and a calm invitation to begin.`;

  const rooms: SiteRoom[] = hospitable
    ? [
        {
          name: "The Garden Suite",
          lede: "A high-ceilinged room, dressed simply, with doors that open toward planted ground. Kept for guests who want a quieter stay, booked directly with the house.",
          photoId: "garden",
        },
        {
          name: "The Pool Suite",
          lede: "A different kind of room: private water a few steps from the threshold, for days that are allowed to move slowly. Still booked by writing to the house.",
          photoId: "water",
        },
      ]
    : [
        {
          name: "The work, in rooms",
          lede: "Each section of the site is a room: a headline, a short argument, and a path forward.",
          photoId: "garden",
        },
        {
          name: "The atelier",
          lede: "A second chamber for process and materials — typography, palette, and the decisions behind them.",
          photoId: "hero",
        },
      ];

  const experiences: SiteExperience[] = hospitable
    ? [
        {
          title: "Arrive in your own time",
          body: "The house is arranged for a slower day. There is no itinerary to complete, and no marketplace standing between you and a stay.",
        },
        {
          title: "Stay as a guest, not a booking",
          body: "Reservations are held directly. Write with your dates, and the house will answer with what is free.",
        },
        {
          title: "A quieter kind of hospitality",
          body: "The rooms are for travelers and couples who already prefer distinctive houses to landmarks, and who would rather be known than processed.",
        },
      ]
    : [
        { title: "The argument", body: "A clear opening that states what the practice is for, and who it is not for." },
        { title: "The evidence", body: "Selected work, presented as a short gallery rather than a grid of case-study cards." },
        { title: "The invitation", body: "A single, unhurried call to begin — a conversation, not a checkout." },
      ];

  const gallery: SiteGalleryItem[] = [
    { photoId: "hero", caption: "Reference imagery, not photographs of the house." },
    { photoId: "garden", caption: "Reference imagery, not photographs of the house." },
    { photoId: "water", caption: "Reference imagery, not photographs of the house." },
  ];

  const copy: SiteCopy = {
    kicker,
    headline,
    lede,
    ctaLabel: hospitable ? "Explore the rooms" : "Begin a conversation",
    aboutTitle: hospitable ? "The house" : "The practice",
    aboutBody,
    roomsTitle: hospitable ? "Rooms" : "Chambers",
    rooms,
    experiencesTitle: hospitable ? "In the grounds" : "In practice",
    experiences,
    galleryTitle: "A few rooms, in light",
    gallery,
    bookingTitle: hospitable ? "Write to the house" : "Write to the studio",
    bookingBody: hospitable
      ? `Tell us when you would like to visit. We'll respond directly with availability and the details of your stay.`
      : `Enquiries reach the studio directly. Share the question you have not yet written down.`,
    bookingCta: hospitable ? "Request your dates" : "Send an enquiry",
    footerTagline: hospitable
      ? `${name} — a house kept for a few, booked without a marketplace.`
      : `${name} — a public site written from the brief, not the other way around.`,
    nav: defaultNav(),
  };

  const prepared = scrubSiteCopy(normalizeSiteCopy(copy), input.intake);
  return lintGuestCopy(prepared, input.intake).copy;
}

export interface SiteCopyValidation {
  ok: boolean;
  errors: string[];
  copy?: SiteCopy;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function normalizeSiteCopy(raw: unknown): SiteCopy {
  const rec = asRecord(raw) ?? {};
  const roomsIn = Array.isArray(rec.rooms) ? rec.rooms : [];
  const experiencesIn = Array.isArray(rec.experiences) ? rec.experiences : [];
  const galleryIn = Array.isArray(rec.gallery) ? rec.gallery : [];
  const navIn = Array.isArray(rec.nav) ? rec.nav : defaultNav();
  const rooms: SiteRoom[] = roomsIn
    .map((item, index) => {
      const row = asRecord(item) ?? {};
      return {
        name: cleanLine(row.name) || `Room ${index + 1}`,
        lede: cleanLine(row.lede),
        photoId: assignPhoto(cleanLine(row.photoId), index === 0 ? "garden" : "water"),
      };
    })
    .filter((room) => room.name && room.lede)
    .slice(0, 3);
  const experiences: SiteExperience[] = experiencesIn
    .map((item, index) => {
      const row = asRecord(item) ?? {};
      const fallback = ["hero", "garden", "water"][index] ?? "hero";
      return {
        title: cleanLine(row.title) || `Experience ${index + 1}`,
        body: cleanLine(row.body),
        photoId: row.photoId ? assignPhoto(cleanLine(row.photoId), fallback) : fallback,
      };
    })
    .filter((item) => item.title && item.body)
    .slice(0, 4);
  // One tile per catalog photo: unknown or repeated ids take the next unused photo,
  // so the gallery never shows the same reference image twice.
  const catalog = defaultSitePhotoIds();
  const usedInGallery = new Set<string>();
  const gallery: SiteGalleryItem[] = [];
  for (const item of galleryIn) {
    const row = asRecord(item) ?? {};
    const asked = cleanLine(row.photoId);
    const photoId =
      photoById(asked) && !usedInGallery.has(asked) ? asked : catalog.find((id) => !usedInGallery.has(id));
    if (!photoId) break;
    usedInGallery.add(photoId);
    gallery.push({ photoId, caption: cleanLine(row.caption) });
  }

  return {
    kicker: cleanLine(rec.kicker),
    headline: cleanLine(rec.headline),
    lede: cleanLine(rec.lede),
    ctaLabel: cleanLine(rec.ctaLabel) || "Reserve a stay",
    aboutTitle: cleanLine(rec.aboutTitle) || "The house",
    aboutBody: cleanLine(rec.aboutBody),
    roomsTitle: cleanLine(rec.roomsTitle) || "Rooms",
    rooms,
    experiencesTitle: cleanLine(rec.experiencesTitle) || "Experiences",
    experiences,
    galleryTitle: cleanLine(rec.galleryTitle) || "Gallery",
    gallery,
    bookingTitle: cleanLine(rec.bookingTitle) || "Write to the house",
    bookingBody: cleanLine(rec.bookingBody),
    bookingCta: cleanLine(rec.bookingCta) || "Request dates",
    footerTagline: cleanLine(rec.footerTagline),
    nav: navIn
      .map((item) => {
        const row = asRecord(item) ?? {};
        return { label: cleanLine(row.label), href: cleanLine(row.href) || "#house" };
      })
      .filter((item) => item.label),
  };
}

export function validateSiteCopy(value: unknown): SiteCopyValidation {
  const copy = normalizeSiteCopy(value);
  const errors: string[] = [];
  const required: Array<[string, string]> = [
    ["headline", copy.headline],
    ["lede", copy.lede],
    ["aboutBody", copy.aboutBody],
    ["bookingBody", copy.bookingBody],
  ];
  for (const [key, val] of required) {
    if (!val || val.length < 8) errors.push(`Site copy is missing a usable ${key}.`);
  }
  if (copy.rooms.length < 2) errors.push("Site copy must include at least two rooms.");
  if (copy.experiences.length < 3) errors.push("Site copy must include at least three experiences.");
  if (copy.gallery.length < 2) errors.push("Site copy must include at least two reference gallery images.");
  const blob = JSON.stringify(copy);
  if (LOREM_RE.test(blob)) errors.push("Site copy must not include lorem ipsum or placeholder text.");
  if (errors.length) return { ok: false, errors };
  return { ok: true, errors: [], copy };
}

export function sitePhotoIds(copy: SiteCopy): string[] {
  const ids = [
    "hero",
    ...copy.rooms.map((room) => room.photoId),
    ...copy.experiences.map((item) => item.photoId).filter((id): id is string => Boolean(id)),
    ...copy.gallery.map((item) => item.photoId),
  ];
  const extras = defaultSitePhotoIds().filter((id) => !ids.includes(id));
  return [...new Set([...ids, ...extras])];
}


export const STRATEGY_LANGUAGE_RE =
  /\b(this website should|the website should communicate|target audience|brand aims to position|position itself as|the sitemap|art direction|handoff document|deliverable|conversion funnel|stakeholders|positioning statement|business objective|user flow|the brief (says|asks|requires))\b/i;

const UNSUPPORTED_AMENITY_RE =
  /\b(spa treatments?|award[- ]winning|michelin|private annex|rate card|family office)\b/i;

function mapText(copy: SiteCopy, fn: (value: string, path: string) => string): SiteCopy {
  return {
    ...copy,
    kicker: fn(copy.kicker, "kicker"),
    headline: fn(copy.headline, "headline"),
    lede: fn(copy.lede, "lede"),
    ctaLabel: fn(copy.ctaLabel, "ctaLabel"),
    aboutTitle: fn(copy.aboutTitle, "aboutTitle"),
    aboutBody: fn(copy.aboutBody, "aboutBody"),
    roomsTitle: fn(copy.roomsTitle, "roomsTitle"),
    rooms: copy.rooms.map((room, i) => ({
      ...room,
      name: fn(room.name, `rooms.${i}.name`),
      lede: fn(room.lede, `rooms.${i}.lede`),
    })),
    experiencesTitle: fn(copy.experiencesTitle, "experiencesTitle"),
    experiences: copy.experiences.map((item, i) => ({
      ...item,
      title: fn(item.title, `experiences.${i}.title`),
      body: fn(item.body, `experiences.${i}.body`),
    })),
    galleryTitle: fn(copy.galleryTitle, "galleryTitle"),
    gallery: copy.gallery.map((item, i) => ({
      ...item,
      caption: fn(item.caption, `gallery.${i}.caption`),
    })),
    bookingTitle: fn(copy.bookingTitle, "bookingTitle"),
    bookingBody: fn(copy.bookingBody, "bookingBody"),
    bookingCta: fn(copy.bookingCta, "bookingCta"),
    footerTagline: fn(copy.footerTagline, "footerTagline"),
  };
}

function dropOffendingSentences(text: string, pattern: RegExp): string {
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.filter((sentence) => !pattern.test(sentence)).join(" ").trim();
}

/** Post-generation check: drop strategy language and unsupported amenity claims. */
export function lintGuestCopy(copy: SiteCopy, intake: Intake): { copy: SiteCopy; warnings: string[] } {
  const warnings: string[] = [];
  const confidential = intake.confidentialNotes || "";
  const next = mapText(copy, (value, path) => {
    let out = value;
    if (STRATEGY_LANGUAGE_RE.test(out)) {
      warnings.push(`Removed strategy language from ${path}.`);
      out = dropOffendingSentences(out, STRATEGY_LANGUAGE_RE);
    }
    if (UNSUPPORTED_AMENITY_RE.test(out) && !UNSUPPORTED_AMENITY_RE.test(`${intake.coreGoal} ${intake.audience} ${intake.industry}`)) {
      warnings.push(`Removed an unsupported claim from ${path}.`);
      out = dropOffendingSentences(out, UNSUPPORTED_AMENITY_RE);
    }
    if (confidential) {
      for (const line of confidential.split(/\n+/)) {
        const snippet = line.trim();
        if (snippet.length > 12 && out.includes(snippet)) {
          warnings.push(`Removed confidential phrasing from ${path}.`);
          out = out.split(snippet).join("").replace(/\s{2,}/g, " ").trim();
        }
      }
    }
    return out;
  });
  return { copy: next, warnings };
}
