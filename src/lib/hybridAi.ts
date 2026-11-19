import { initializeApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
  InferenceSource,
  type GenerativeModel,
} from "firebase/ai";
import { composeLocalBrief, composeLocalSection, ensureSectionOrder } from "./localStudio";
import { planPrivacyShield, restoreBundle } from "./privacyShield";
import type {
  BriefSection,
  GeneratedBundle,
  Intake,
  NanoAvailability,
  Telemetry,
} from "./types";
import { SECTION_DEFS } from "./types";

/**
 * Official Firebase AI Logic hybrid modes, referenced at module scope so the
 * production bundle always retains the real `firebase/ai` symbols even when a
 * Spark config is supplied later.
 */
export const HYBRID_MODES = {
  PREFER_ON_DEVICE: InferenceMode.PREFER_ON_DEVICE,
  ONLY_ON_DEVICE: InferenceMode.ONLY_ON_DEVICE,
  ONLY_IN_CLOUD: InferenceMode.ONLY_IN_CLOUD,
  PREFER_IN_CLOUD: InferenceMode.PREFER_IN_CLOUD,
} as const;

export const DEFAULT_CLOUD_MODEL = "gemini-3.5-flash-lite";

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  recaptchaSiteKey: string;
  appCheckDebug: boolean;
  cloudModel: string;
}

interface Runtime {
  app: FirebaseApp;
  modelPrefer: GenerativeModel;
  modelOnDevice: GenerativeModel;
  modelCloud: GenerativeModel;
  prepared: boolean;
}

let runtime: Runtime | null = null;
let initError: string | null = null;

export function readFirebaseConfig(): FirebaseWebConfig {
  const env = import.meta.env;
  return {
    apiKey: String(env.VITE_FIREBASE_API_KEY ?? "").trim(),
    authDomain: String(env.VITE_FIREBASE_AUTH_DOMAIN ?? "").trim(),
    projectId: String(env.VITE_FIREBASE_PROJECT_ID ?? "").trim(),
    storageBucket: String(env.VITE_FIREBASE_STORAGE_BUCKET ?? "").trim(),
    messagingSenderId: String(env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "").trim(),
    appId: String(env.VITE_FIREBASE_APP_ID ?? "").trim(),
    recaptchaSiteKey: String(env.VITE_FIREBASE_RECAPTCHA_V3_SITE_KEY ?? "").trim(),
    appCheckDebug: String(env.VITE_FIREBASE_APPCHECK_DEBUG ?? "") === "true",
    cloudModel: String(env.VITE_FIREBASE_CLOUD_MODEL ?? DEFAULT_CLOUD_MODEL).trim() || DEFAULT_CLOUD_MODEL,
  };
}

export function isFirebaseConfigured(config: FirebaseWebConfig = readFirebaseConfig()): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId);
}

export async function detectNanoAvailability(): Promise<NanoAvailability> {
  if (typeof window === "undefined") return "unknown";
  const LanguageModel = window.LanguageModel;
  if (!LanguageModel || typeof LanguageModel.availability !== "function") {
    return "unavailable";
  }
  try {
    const value = String(await LanguageModel.availability()).toLowerCase();
    if (value === "available" || value === "readily") return "available";
    if (value === "downloadable" || value === "after-download" || value === "downloadable-after-accept") {
      return "downloadable";
    }
    if (value === "downloading") return "downloading";
    if (value === "unavailable" || value === "no") return "unavailable";
    return "unknown";
  } catch {
    return "unavailable";
  }
}

export function connectionLabel(opts: {
  configured: boolean;
  nano: NanoAvailability;
  previewForced?: boolean;
}): { state: "preview" | "configured"; hint: string } {
  if (!opts.configured || opts.previewForced) {
    return {
      state: "preview",
      hint: "Local Preview · Connect Firebase Config",
    };
  }
  if (opts.nano === "available") {
    return { state: "configured", hint: "Firebase ready · Gemini Nano detected" };
  }
  if (opts.nano === "downloadable" || opts.nano === "downloading") {
    return { state: "configured", hint: "Firebase ready · Nano available after download" };
  }
  return { state: "configured", hint: "Firebase ready · Cloud fallback available" };
}

function inCloudParams(model: string) {
  return {
    model,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  };
}

function onDeviceParams() {
  return {
    createOptions: {
      expectedInputs: [{ type: "text" as const, languages: ["en"] }],
      expectedOutputs: [{ type: "text" as const, languages: ["en"] }],
      initialPrompts: [
        {
          role: "system" as const,
          content: [
            {
              type: "text" as const,
              value:
                "You are a senior design-studio strategist. Return only valid JSON. Write precise, typographic English. Never invent awards, clients, or legal claims.",
            },
          ],
        },
      ],
    },
  };
}

export function initializeFirebaseAi(config: FirebaseWebConfig = readFirebaseConfig()): Runtime | null {
  if (runtime) return runtime;
  if (!isFirebaseConfigured(config)) return null;

  try {
    const app = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    });

    if (config.appCheckDebug) {
      // Official App Check debug hook. A token string must never be committed;
      // `true` lets the SDK mint a local debug token and print it in the console.
      globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    if (config.recaptchaSiteKey || config.appCheckDebug) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(config.recaptchaSiteKey || "debug-unused-site-key"),
        isTokenAutoRefreshEnabled: true,
      });
    }

    const ai = getAI(app, { backend: new GoogleAIBackend() });
    const cloud = inCloudParams(config.cloudModel);
    const device = onDeviceParams();

    runtime = {
      app,
      modelPrefer: getGenerativeModel(ai, {
        mode: InferenceMode.PREFER_ON_DEVICE,
        inCloudParams: cloud,
        onDeviceParams: device,
      }),
      modelOnDevice: getGenerativeModel(ai, {
        mode: InferenceMode.ONLY_ON_DEVICE,
        onDeviceParams: device,
      }),
      modelCloud: getGenerativeModel(ai, {
        mode: InferenceMode.ONLY_IN_CLOUD,
        inCloudParams: cloud,
      }),
      prepared: false,
    };
    initError = null;
    return runtime;
  } catch (error) {
    initError = error instanceof Error ? error.message : "Firebase failed to initialize.";
    runtime = null;
    return null;
  }
}

export function firebaseInitError(): string | null {
  return initError;
}

export async function prepareOnDeviceModel(
  onProgress?: (percent: number) => void,
): Promise<void> {
  const current = initializeFirebaseAi();
  if (!current) return;
  await current.modelPrefer.initializeDeviceModel((value) => {
    onProgress?.(Math.round(value * 10000) / 100);
  });
  current.prepared = true;
}

function schemaInstructions(): string {
  return `Return a JSON object with this exact shape:
{
  "sections": [
    { "id": "executive-summary", "title": "Executive Summary", "body": "..." },
    { "id": "audience-positioning", "title": "Audience & Positioning", "body": "..." },
    { "id": "conversion-flow", "title": "Core Conversion Flow", "body": "..." },
    { "id": "tone-voice", "title": "Tone & Voice Guidelines", "body": "..." },
    { "id": "discovery-questions", "title": "Discovery Questions", "body": "..." },
    { "id": "deliverables-risks", "title": "Deliverables & Risks", "body": "..." }
  ],
  "sitemap": [
    { "id": "page-1", "name": "Home", "purpose": "...", "sections": ["..."], "heroCopy": "..." }
  ],
  "artDirection": {
    "narrative": "...",
    "displayFamily": "Fraunces",
    "bodyFamily": "IBM Plex Sans",
    "monoFamily": "IBM Plex Mono",
    "density": "airy" | "balanced" | "compact",
    "motion": "...",
    "palette": [{ "name": "...", "hex": "#RRGGBB", "role": "..." }],
    "hierarchy": [{ "role": "...", "family": "...", "size": "...", "weight": "...", "tracking": "...", "sample": "..." }]
  }
}
Write 2 short paragraphs per brief section (except Discovery Questions, which should be a numbered list of 5). Provide 5 or 6 sitemap pages. Palette must include 5 colors with real hex values. English only. No markdown fences.`;
}

function intakeBlock(intake: Intake): string {
  return [
    `Project: ${intake.projectName}`,
    `Client: ${intake.clientName}`,
    `Industry: ${intake.industry}`,
    `Budget: ${intake.budget}`,
    `Timeline: ${intake.timeline}`,
    `Tones: ${intake.tones.join(", ")}`,
    `Voice reserve (0 reserved, 100 expressive): ${intake.voiceReserve}`,
    `Core goal: ${intake.coreGoal}`,
    `Audience: ${intake.audience}`,
    `Confidential notes: ${intake.confidentialNotes}`,
  ].join("\n");
}

export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("The model did not return JSON.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function asBundle(value: unknown, intake: Intake): GeneratedBundle {
  const fallback = composeLocalBrief(intake);
  if (!value || typeof value !== "object") return fallback;
  const raw = value as Partial<GeneratedBundle>;
  const sections = Array.isArray(raw.sections) ? raw.sections : fallback.sections;
  const sitemap = Array.isArray(raw.sitemap) && raw.sitemap.length ? raw.sitemap : fallback.sitemap;
  const artDirection = raw.artDirection ?? fallback.artDirection;
  const cleaned: BriefSection[] = sections
    .filter((section): section is BriefSection => Boolean(section && section.id && section.title))
    .map((section) => ({
      id: String(section.id),
      title: String(section.title),
      body: String(section.body ?? ""),
    }));
  return {
    sections: ensureSectionOrder(cleaned.length ? cleaned : fallback.sections),
    sitemap: sitemap.map((page, index) => ({
      id: String(page.id || `page-${index + 1}`),
      name: String(page.name || `Page ${index + 1}`),
      purpose: String(page.purpose || ""),
      sections: Array.isArray(page.sections) ? page.sections.map(String) : [],
      heroCopy: String(page.heroCopy || ""),
    })),
    artDirection: {
      ...fallback.artDirection,
      ...artDirection,
      palette: artDirection.palette?.length ? artDirection.palette : fallback.artDirection.palette,
      hierarchy: artDirection.hierarchy?.length ? artDirection.hierarchy : fallback.artDirection.hierarchy,
    },
  };
}

async function runModel(model: GenerativeModel, prompt: string) {
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const source = result.response.inferenceSource;
  return { text, source };
}

export interface GenerateOptions {
  intake: Intake;
  privacyShield: boolean;
  sectionId?: string;
  currentSection?: BriefSection;
  onDeviceProgress?: (percent: number) => void;
}

export interface GenerateResult {
  bundle?: GeneratedBundle;
  section?: BriefSection;
  telemetry: Telemetry;
}

export async function generateStudioWork(options: GenerateOptions): Promise<GenerateResult> {
  const started = performance.now();
  const nano = await detectNanoAvailability();
  const config = readFirebaseConfig();
  const configured = isFirebaseConfigured(config);
  const plan = planPrivacyShield(options.intake);
  const redactionCount = options.privacyShield ? plan.fields.length : 0;
  const workingIntake = options.privacyShield && redactionCount > 0 ? plan.redactedIntake : options.intake;

  const finish = (
    badge: Telemetry["badge"],
    label: string,
    reason: string,
    model: string,
    payload: { bundle?: GeneratedBundle; section?: BriefSection },
  ): GenerateResult => ({
    ...payload,
    telemetry: {
      badge,
      label,
      reason,
      latencyMs: Math.round(performance.now() - started),
      redactionCount: badge === "on-device" ? 0 : redactionCount,
      tokens: plan.fields.map((field) => field.token),
      nano,
      model,
      privacyShield: options.privacyShield,
    },
  });

  if (!configured) {
    if (options.sectionId && options.currentSection) {
      return finish(
        "preview",
        "Local Preview · Connect Firebase Config",
        "No Firebase web config is present, so the studio composed this section locally. Connect a Spark project to enable Firebase AI Logic hybrid inference.",
        "local-studio",
        { section: composeLocalSection(options.intake, options.sectionId, options.currentSection) },
      );
    }
    return finish(
      "preview",
      "Local Preview · Connect Firebase Config",
      "No Firebase web config is present, so the studio composed this brief locally. The full interface is reviewable; hybrid inference starts once Spark config is connected.",
      "local-studio",
      { bundle: composeLocalBrief(options.intake) },
    );
  }

  const current = initializeFirebaseAi(config);
  if (!current) {
    const reason = firebaseInitError() ?? "Firebase initialized incorrectly.";
    const fallback = options.sectionId && options.currentSection
      ? { section: composeLocalSection(options.intake, options.sectionId, options.currentSection) }
      : { bundle: composeLocalBrief(options.intake) };
    return finish("preview", "Local Preview · Connect Firebase Config", reason, "local-studio", fallback);
  }

  try {
    await prepareOnDeviceModel(options.onDeviceProgress);
  } catch {
    // initializeDeviceModel can fail when Chrome Built-in AI is absent.
    // PREFER_ON_DEVICE / ONLY_IN_CLOUD still remain available.
  }

  const fullPrompt = options.sectionId
    ? `Revise only the "${SECTION_DEFS.find((item) => item.id === options.sectionId)?.title ?? options.sectionId}" section of a website brief.\n${intakeBlock(options.intake)}\n${schemaInstructions()}\nReturn JSON with a "sections" array containing that one section (same id), and you may omit sitemap and artDirection.`
    : `Compose a complete, client-ready website brief for a design studio.\n${intakeBlock(options.intake)}\n${schemaInstructions()}`;

  const redactedPrompt = options.sectionId
    ? `Revise only the "${SECTION_DEFS.find((item) => item.id === options.sectionId)?.title ?? options.sectionId}" section of a website brief.\n${intakeBlock(workingIntake)}\n${schemaInstructions()}\nReturn JSON with a "sections" array containing that one section (same id), and you may omit sitemap and artDirection.`
    : `Compose a complete, client-ready website brief for a design studio.\n${intakeBlock(workingIntake)}\n${schemaInstructions()}`;

  const nanoReady = nano === "available" || nano === "downloadable" || nano === "downloading";

  const pack = (parsed: unknown) => {
    const restored = options.privacyShield ? restoreBundle(parsed, plan) : parsed;
    if (options.sectionId) {
      const bundle = asBundle(restored, options.intake);
      return {
        section: bundle.sections.find((item) => item.id === options.sectionId) ?? options.currentSection,
      };
    }
    return { bundle: asBundle(restored, options.intake) };
  };

  try {
    if (options.privacyShield && nanoReady) {
      try {
        const onDevice = await runModel(current.modelOnDevice, fullPrompt);
        const parsed = extractJson(onDevice.text);
        if (options.sectionId) {
          return finish(
            "on-device",
            "On-Device · Gemini Nano",
            "Privacy Shield kept confidential fields on-device. Chrome Built-in AI (Gemini Nano) composed this section locally.",
            "gemini-nano",
            pack(parsed),
          );
        }
        return finish(
          "on-device",
          "On-Device · Gemini Nano",
          "Privacy Shield kept confidential fields on-device. Chrome Built-in AI (Gemini Nano) composed this brief locally.",
          "gemini-nano",
          pack(parsed),
        );
      } catch {
        // Fall through to a redacted cloud call so confidential fields never travel unmasked.
      }
    }

    const model = options.privacyShield ? current.modelCloud : current.modelPrefer;
    const prompt = options.privacyShield ? redactedPrompt : fullPrompt;
    const result = await runModel(model, prompt);
    const usedOnDevice = result.source === InferenceSource.ON_DEVICE;
    const payload = pack(extractJson(result.text));

    if (usedOnDevice) {
      return finish(
        "on-device",
        "On-Device · Gemini Nano",
        "Firebase AI Logic completed this work on-device with Gemini Nano.",
        "gemini-nano",
        payload,
      );
    }

    return finish(
      "cloud",
      "Cloud Fallback · Firebase AI Logic",
      options.privacyShield
        ? `On-device inference was unavailable, so the studio called ${config.cloudModel} after reversible Privacy Shield redaction (${redactionCount} field${redactionCount === 1 ? "" : "s"}). Tokens were restored locally before display.`
        : `Firebase AI Logic used the cloud model ${config.cloudModel}. Privacy Shield was off, so confidential fields were not redacted.`,
      config.cloudModel,
      payload,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed.";
    const fallback = options.sectionId && options.currentSection
      ? { section: composeLocalSection(options.intake, options.sectionId, options.currentSection) }
      : { bundle: composeLocalBrief(options.intake) };
    return finish(
      configured ? "cloud" : "preview",
      configured ? "Cloud Fallback · Firebase AI Logic" : "Local Preview · Connect Firebase Config",
      `Hybrid inference did not complete (${message}). The studio used a local composition so the workspace remains usable.`,
      configured ? config.cloudModel : "local-studio",
      fallback,
    );
  }
}
