import type { PhotoCredit, PhotoRole } from "./types";

/**
 * Curated, locally bundled reference photographs.
 * All images are CC BY-SA 4.0 works by Basile Morin, sourced from Wikimedia Commons.
 * They depict Amantaka, Luang Prabang, and are used as visual references — not as
 * photographs of the client property. Credits must appear on every generated site.
 */
export const REFERENCE_PHOTOS: PhotoCredit[] = [
  {
    id: "hero",
    file: "hero.jpg",
    role: "hero",
    alt: "Colonnaded hotel entrance at blue hour",
    photographer: "Basile Morin",
    photographerUrl: "https://commons.wikimedia.org/wiki/User:Basile_Morin",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Entrance_of_Amantaka_luxury_Resort_%26_Hotel_at_blue_hour_in_Luang_Prabang_Laos.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "Wikimedia Commons",
    subjectNote:
      "Reference photograph of Amantaka, Luang Prabang. Used as visual reference for a generated concept site; not a depiction of the client property.",
    width: 1600,
    height: 1066,
    bytes: 410599,
  },
  {
    id: "lobby",
    file: "lobby.jpg",
    role: "lobby",
    alt: "Hotel lobby lanterns and seating at dusk",
    photographer: "Basile Morin",
    photographerUrl: "https://commons.wikimedia.org/wiki/User:Basile_Morin",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Entrance_lobby_of_Amantaka_luxury_Resort_%26_Hotel_at_blue_hour_in_Luang_Prabang_Laos.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "Wikimedia Commons",
    subjectNote:
      "Reference photograph of Amantaka, Luang Prabang. Used as visual reference for a generated concept site; not a depiction of the client property.",
    width: 1600,
    height: 1010,
    bytes: 227073,
  },
  {
    id: "lounge",
    file: "lounge.jpg",
    role: "lounge",
    alt: "Evening lounge with low light and garden beyond",
    photographer: "Basile Morin",
    photographerUrl: "https://commons.wikimedia.org/wiki/User:Basile_Morin",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Lounge_at_Amantaka_luxury_Resort_%26_Hotel_at_blue_hour_in_Luang_Prabang_Laos.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "Wikimedia Commons",
    subjectNote:
      "Reference photograph of Amantaka, Luang Prabang. Used as visual reference for a generated concept site; not a depiction of the client property.",
    width: 1600,
    height: 1142,
    bytes: 261041,
  },
  {
    id: "suite",
    file: "suite.jpg",
    role: "room",
    alt: "Canopy-bed suite with tall windows and linen",
    photographer: "Basile Morin",
    photographerUrl: "https://commons.wikimedia.org/wiki/User:Basile_Morin",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Canopy_bed_of_Amantaka_Suite_in_Amantaka_luxury_Resort_%26_Hotel_in_Luang_Prabang_Laos.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "Wikimedia Commons",
    subjectNote:
      "Reference photograph of Amantaka, Luang Prabang. Used as visual reference for a generated concept site; not a depiction of the client property.",
    width: 1600,
    height: 1200,
    bytes: 227163,
  },
  {
    id: "pool-suite",
    file: "pool-suite.jpg",
    role: "room",
    alt: "Pool suite bedroom with a draped canopy bed",
    photographer: "Basile Morin",
    photographerUrl: "https://commons.wikimedia.org/wiki/User:Basile_Morin",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Canopy_bed_of_Khan_Pool_Suite_in_Amantaka_luxury_Resort_%26_Hotel_in_Luang_Prabang_Laos.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "Wikimedia Commons",
    subjectNote:
      "Reference photograph of Amantaka, Luang Prabang. Used as visual reference for a generated concept site; not a depiction of the client property.",
    width: 1600,
    height: 1066,
    bytes: 239298,
  },
  {
    id: "pool",
    file: "pool.jpg",
    role: "pool",
    alt: "Swimming pool and terrace looking toward the main house",
    photographer: "Basile Morin",
    photographerUrl: "https://commons.wikimedia.org/wiki/User:Basile_Morin",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Swimming_pool_and_terrasse_of_Amantaka_luxury_Resort_%26_Hotel_in_Luang_Prabang_Laos.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "Wikimedia Commons",
    subjectNote:
      "Reference photograph of Amantaka, Luang Prabang. Used as visual reference for a generated concept site; not a depiction of the client property.",
    width: 1600,
    height: 1066,
    bytes: 428561,
  },
  {
    id: "restaurant",
    file: "restaurant.jpg",
    role: "dining",
    alt: "Hotel restaurant with white-clothed tables and garden doors",
    photographer: "Basile Morin",
    photographerUrl: "https://commons.wikimedia.org/wiki/User:Basile_Morin",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Restaurant_room_of_Amantaka_luxury_Resort_%26_Hotel_in_Luang_Prabang_Laos.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "Wikimedia Commons",
    subjectNote:
      "Reference photograph of Amantaka, Luang Prabang. Used as visual reference for a generated concept site; not a depiction of the client property.",
    width: 1600,
    height: 1066,
    bytes: 248400,
  },
  {
    id: "library",
    file: "library.jpg",
    role: "detail",
    alt: "Hotel library with shelves, desks and afternoon light",
    photographer: "Basile Morin",
    photographerUrl: "https://commons.wikimedia.org/wiki/User:Basile_Morin",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Interior_of_the_library_at_Amantaka_luxury_Resort_%26_Hotel_in_Luang_Prabang_Laos_-_front_view.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "Wikimedia Commons",
    subjectNote:
      "Reference photograph of Amantaka, Luang Prabang. Used as visual reference for a generated concept site; not a depiction of the client property.",
    width: 1600,
    height: 1066,
    bytes: 263945,
  },
  {
    id: "spa",
    file: "spa.jpg",
    role: "spa",
    alt: "Indoor spa pool with stone walls and a shaft of light",
    photographer: "Basile Morin",
    photographerUrl: "https://commons.wikimedia.org/wiki/User:Basile_Morin",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Indoor_pool_and_shower_of_spa_at_Amantaka_luxury_Resort_%26_Hotel_in_Luang_Prabang_Laos_front_view.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "Wikimedia Commons",
    subjectNote:
      "Reference photograph of Amantaka, Luang Prabang. Used as visual reference for a generated concept site; not a depiction of the client property.",
    width: 1600,
    height: 1066,
    bytes: 184996,
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
