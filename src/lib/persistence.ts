import type { StudioProject } from "./types";
import { defaultArtDirection } from "./types";

const STORAGE_KEY = "atelier-brief.projects.v1";
const ACTIVE_KEY = "atelier-brief.active.v1";
const DB_NAME = "atelier-brief";
const STORE = "projects";

function normalize(project: StudioProject): StudioProject {
  return {
    ...project,
    sections: Array.isArray(project.sections) ? project.sections : [],
    sitemap: Array.isArray(project.sitemap) ? project.sitemap : [],
    artDirection: project.artDirection ?? defaultArtDirection(),
    rationale: Array.isArray(project.rationale) ? project.rationale : [],
    lastTelemetry: project.lastTelemetry ?? null,
    privacyReceipt: project.privacyReceipt ?? null,
    site: project.site ?? null,
  };
}

function memorySafeParse(raw: string | null): StudioProject[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StudioProject[];
    return Array.isArray(parsed) ? parsed.map(normalize) : [];
  } catch {
    return [];
  }
}

function fromLocal(): StudioProject[] {
  try {
    return memorySafeParse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

function toLocal(projects: StudioProject[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Quota or private mode — in-memory state still works for the session.
  }
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export async function loadProjects(): Promise<StudioProject[]> {
  const local = fromLocal();
  const db = await openDb();
  if (!db) return local;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const rows = ((req.result as StudioProject[]) ?? []).map(normalize);
      resolve(rows.length ? rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : local);
    };
    req.onerror = () => resolve(local);
  });
}

export async function saveProjects(projects: StudioProject[]): Promise<void> {
  toLocal(projects);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.clear();
    for (const project of projects) store.put(project);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export function loadActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveId(id: string) {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    // ignore
  }
}
