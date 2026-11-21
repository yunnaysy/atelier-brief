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

function firstSection(sections: BriefSection[], id: string): string {
  return sections.find((section) => section.id === id)?.body ?? "";
}

function firstSentence(text: string, fallback: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return fallback;
  const match = compact.match(/(.+?[.!?])\s/);
  const sentence = (match ? match[1] : compact).trim();
  return sentence.length > 280 ? `${sentence.slice(0, 277).trim()}…` : sentence;
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
  const exec = firstSection(input.sections, "executive-summary");
  const audience = firstSection(input.sections, "audience-positioning");
  const tone = firstSection(input.sections, "tone-voice");
  const industry = (input.intake.industry || "hospitality").trim();
  const hospitable = /hotel|hospitality|resort|inn|maison/i.test(`${industry} ${name}`);

  const briefSpeak = /\b(website|brief|sitemap|handoff|deliverable|art direction|conversion)\b/i;
  const kicker = hospitable ? "A house, not a landmark" : name;
  const headline = hospitable
    ? `Arrive slowly at ${name}.`
    : `A considered house for ${name}.`;
  const fromExec = firstSentence(exec, "");
  const lede =
    fromExec && !briefSpeak.test(fromExec)
      ? fromExec
      : hospitable
        ? `${name} is kept for travelers who would rather write to the house than book through a marketplace. The rooms, the water, and the table are arranged with the same quiet reserve.`
        : `${name} presents its work in a short public site: precise typography, a restrained palette, and a clear path to enquire.`;

  const fromAudience = firstSentence(audience, "");
  const aboutBody =
    fromAudience && !briefSpeak.test(fromAudience)
      ? `${fromAudience} ${
          hospitable
            ? "The house is arranged as a sequence of courts and rooms rather than a catalogue of amenities."
            : "The work is shown as a short, readable argument rather than a marketing funnel."
        }`
      : hospitable
        ? `${name} sits in a quieter register of hospitality: linen, water, and a table that does not shout. Guests are invited to stay because the house feels already inhabited, not because a campaign told them to.`
        : `${name} presents itself with typographic reserve: a clear promise, evidence in the work, and a calm invitation to begin.`;

  const rooms: SiteRoom[] = hospitable
    ? [
        {
          name: "The Garden Suite",
          lede: "A high-ceilinged room looking onto the court. Linen, a writing table, and shutters that keep the afternoon in check.",
          photoId: "suite",
        },
        {
          name: "The Pool Suite",
          lede: "A quieter wing with its own water. The bed is dressed simply; the door opens to stone and shade.",
          photoId: "pool-suite",
        },
      ]
    : [
        {
          name: "The work, in rooms",
          lede: firstSentence(tone, "Each section of the site is a room: a headline, a short argument, and a path forward."),
          photoId: "suite",
        },
        {
          name: "The atelier",
          lede: "A second chamber for process and materials — typography, palette, and the decisions behind them.",
          photoId: "library",
        },
      ];

  const experiences: SiteExperience[] = hospitable
    ? [
        {
          title: "The water",
          body: "A long pool and a terrace that faces the main house. Late light is the point; swimming is optional.",
          photoId: "pool",
        },
        {
          title: "The table",
          body: "Breakfast and supper in a dining room that opens to the garden. The menu is short, and the cloth is white.",
          photoId: "restaurant",
        },
        {
          title: "The spa",
          body: "An indoor pool cut into stone, used slowly. Treatments are booked with the same concierge who keeps the rooms.",
          photoId: "spa",
        },
      ]
    : [
        {
          title: "The argument",
          body: "A clear opening that states what the practice is for, and who it is not for.",
          photoId: "library",
        },
        {
          title: "The evidence",
          body: "Selected work and materials, presented as a gallery rather than a grid of case-study cards.",
          photoId: "lounge",
        },
        {
          title: "The invitation",
          body: "A single, unhurried call to begin — a conversation, not a checkout.",
          photoId: "restaurant",
        },
      ];

  const gallery: SiteGalleryItem[] = [
    { photoId: "lobby", caption: "The lobby at the blue hour, when the lanterns do the work of a sign." },
    { photoId: "lounge", caption: "A lounge kept low, looking out to the garden." },
    { photoId: "library", caption: "The library: shelves, a desk, and afternoon light." },
    { photoId: "spa", caption: "The spa pool, cut into stone." },
  ];

  const copy: SiteCopy = {
    kicker,
    headline,
    lede,
    ctaLabel: hospitable ? "Reserve a stay" : "Begin a conversation",
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
      ? `Reservations are held directly with ${name}. Share your dates, and the house will answer with what is free and how the days are usually spent.`
      : `Enquiries reach the studio directly. Share the brief you already have, or the question you have not yet written down.`,
    bookingCta: hospitable ? "Request dates" : "Send an enquiry",
    footerTagline: hospitable
      ? `${name} — a house kept for a few, booked without a marketplace.`
      : `${name} — a public site written from the brief, not the other way around.`,
    nav: defaultNav(),
  };

  return scrubSiteCopy(normalizeSiteCopy(copy), input.intake);
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
        photoId: assignPhoto(cleanLine(row.photoId), index === 0 ? "suite" : "pool-suite"),
      };
    })
    .filter((room) => room.name && room.lede)
    .slice(0, 3);
  const experiences: SiteExperience[] = experiencesIn
    .map((item, index) => {
      const row = asRecord(item) ?? {};
      const fallback = ["pool", "restaurant", "spa"][index] ?? "library";
      return {
        title: cleanLine(row.title) || `Experience ${index + 1}`,
        body: cleanLine(row.body),
        photoId: row.photoId ? assignPhoto(cleanLine(row.photoId), fallback) : fallback,
      };
    })
    .filter((item) => item.title && item.body)
    .slice(0, 4);
  const gallery: SiteGalleryItem[] = galleryIn
    .map((item) => {
      const row = asRecord(item) ?? {};
      return {
        photoId: assignPhoto(cleanLine(row.photoId), "lobby"),
        caption: cleanLine(row.caption),
      };
    })
    .filter((item) => photoById(item.photoId))
    .slice(0, 6);

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
  if (copy.gallery.length < 3) errors.push("Site copy must include at least three gallery images.");
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
