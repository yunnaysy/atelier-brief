import type { PhotoCredit, PhotoRole } from "./types";

/**
 * Curated, locally bundled architectural reference photographs (2–3 images).
 * All are CC BY-SA 4.0 works by Basile Morin, sourced from Wikimedia Commons.
 * They depict Amantaka, Luang Prabang, and must never be presented as photographs
 * of the client property. Visible "Reference photography" captions are required.
 */
export const REFERENCE_PHOTOS: PhotoCredit[] = [
  {
    id: "hero",
    file: "hero.jpg",
    role: "hero",
    alt: "Colonnaded hotel entrance at blue hour, used as architectural reference",
    photographer: "Basile Morin",
    photographerUrl: "https://commons.wikimedia.org/wiki/User:Basile_Morin",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Entrance_of_Amantaka_luxury_Resort_%26_Hotel_at_blue_hour_in_Luang_Prabang_Laos.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "Wikimedia Commons",
    subjectNote:
      "Architectural reference photography of Amantaka, Luang Prabang — not a depiction of the client property.",
    width: 1600,
    height: 1003,
    bytes: 399992,
  },
  {
    id: "garden",
    file: "garden.jpg",
    role: "room",
    alt: "High-ceilinged bedroom with open doors toward planted ground, used as architectural reference",
    photographer: "Basile Morin",
    photographerUrl: "https://commons.wikimedia.org/wiki/User:Basile_Morin",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Canopy_bed_of_Amantaka_Suite_in_Amantaka_luxury_Resort_%26_Hotel_in_Luang_Prabang_Laos.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "Wikimedia Commons",
    subjectNote:
      "Architectural reference photography of Amantaka, Luang Prabang — not a depiction of the client property.",
    width: 1600,
    height: 1152,
    bytes: 225821,
  },
  {
    id: "water",
    file: "water.jpg",
    role: "pool",
    alt: "Private pool beside a white house, used as architectural reference",
    photographer: "Basile Morin",
    photographerUrl: "https://commons.wikimedia.org/wiki/User:Basile_Morin",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Swimming_pool_of_Khan_Pool_Suite_in_Amantaka_luxury_Resort_%26_Hotel_in_Luang_Prabang_Laos.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "Wikimedia Commons",
    subjectNote:
      "Architectural reference photography of Amantaka, Luang Prabang — not a depiction of the client property.",
    width: 1600,
    height: 1066,
    bytes: 287875,
  },
];

export const PHOTO_BASE_PATH = "/references";

export function photoById(id: string): PhotoCredit | undefined {
  return REFERENCE_PHOTOS.find((photo) => photo.id === id);
}

export function photosByRole(role: PhotoRole): PhotoCredit[] {
  return REFERENCE_PHOTOS.filter((photo) => photo.role === role);
}

export function publicPhotoUrl(photo: PhotoCredit, assetBase = ""): string {
  const base = assetBase.replace(/\/$/, "");
  return `${base}${PHOTO_BASE_PATH}/${photo.file}`;
}

export function uniqueCredits(ids: string[]): PhotoCredit[] {
  const seen = new Set<string>();
  const credits: PhotoCredit[] = [];
  for (const id of ids) {
    const photo = photoById(id);
    if (photo && !seen.has(photo.id)) {
      seen.add(photo.id);
      credits.push(photo);
    }
  }
  return credits;
}

export function defaultSitePhotoIds(): string[] {
  return REFERENCE_PHOTOS.map((photo) => photo.id);
}

export function referenceCaption(photo: PhotoCredit): string {
  return `Amantaka, Luang Prabang · ${photo.photographer}`;
}
