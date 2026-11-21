import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
} from "firebase/app-check";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
  InferenceSource,
  type GenerativeModel,
} from "firebase/ai";
import { composeLocalBrief, composeLocalSection } from "./localStudio";
import { buildFullBriefCloudPrompt, buildSectionCloudPrompt, buildRedactedWebsitePrompt, schemaInstructions, websiteSchemaInstructions } from "./cloudPrompt";
import { formatIntakeBlock, payloadPreview, planPrivacyShield, polishBundle, restoreValue } from "./privacyShield";
import { REFERENCE_PHOTOS } from "./referencePhotos";
import { composeLocalWebsite, lintGuestCopy, scrubSiteCopy, validateSiteCopy } from "./siteCopy";
import { collectPhotoIds } from "./siteRenderer";
import { buildDesignDecisions, buildWebsiteTrace, themeSnapshot } from "./siteMeta";
import type {
  ArtDirection,
  BriefSection,
  GeneratedBundle,
  GeneratedSite,
  InferenceBadge,
  Intake,
  NanoAvailability,
  SitemapPage,
  SiteCopy,
  Telemetry,
} from "./types";
import { labelForBadge, validateBundle } from "./validateBundle";

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

/** Official Gemini Developer API free-tier text model (billing not required). */
export const DEFAULT_CLOUD_MODEL = "gemini-3.5-flash-lite";

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  recaptchaSiteKey: string;
  appCheckProvider: "enterprise" | "v3";
  appCheckDebug: boolean;
  cloudModel: string;
}

interface Runtime {
  app: FirebaseApp;
  modelPrefer: GenerativeModel;
  modelOnDevice: GenerativeModel;
  modelCloud: GenerativeModel;
  prepared: boolean;
  deviceProgress: number;
}

let runtime: Runtime | null = null;
let initError: string | null = null;

export function readFirebaseConfig(): FirebaseWebConfig {
  const env = import.meta.env;
  const provider = String(env.VITE_FIREBASE_APPCHECK_PROVIDER ?? "enterprise")
    .trim()
    .toLowerCase();
  const debugRequested = String(env.VITE_FIREBASE_APPCHECK_DEBUG ?? "") === "true";
  return {
    apiKey: String(env.VITE_FIREBASE_API_KEY ?? "").trim(),
    authDomain: String(env.VITE_FIREBASE_AUTH_DOMAIN ?? "").trim(),
    projectId: String(env.VITE_FIREBASE_PROJECT_ID ?? "").trim(),
    storageBucket: String(env.VITE_FIREBASE_STORAGE_BUCKET ?? "").trim(),
    messagingSenderId: String(env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "").trim(),
    appId: String(env.VITE_FIREBASE_APP_ID ?? "").trim(),
    recaptchaSiteKey: String(
      env.VITE_FIREBASE_RECAPTCHA_SITE_KEY ?? env.VITE_FIREBASE_RECAPTCHA_V3_SITE_KEY ?? "",
    ).trim(),
    appCheckProvider: provider === "v3" ? "v3" : "enterprise",
    // Official debug hook is development-only. Production builds never honor the flag,
    // so a debug token cannot leak into a Spark Hosting deploy even if the env is set.
    appCheckDebug: Boolean(env.DEV) && debugRequested,
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
      hint: "Studio Preview · Deterministic Non-AI",
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
      // Official App Check debug hook. A token string must never be committed.
      // `true` lets the SDK mint a local debug token in a private dev session.
      globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    if (config.recaptchaSiteKey || config.appCheckDebug) {
      const key = config.recaptchaSiteKey || "debug-unused-site-key";
      const provider =
        config.appCheckProvider === "v3"
          ? new ReCaptchaV3Provider(key)
          : new ReCaptchaEnterpriseProvider(key);
      initializeAppCheck(app, {
        provider,
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
      deviceProgress: 0,
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
  await current.modelOnDevice.initializeDeviceModel((value) => {
    const percent = Math.round(value * 10000) / 100;
    current.deviceProgress = percent;
    onProgress?.(percent);
  });
  current.prepared = true;
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

function mapSource(value: unknown): "on_device" | "in_cloud" | null {
  if (value === InferenceSource.ON_DEVICE || value === "ON_DEVICE") return "on_device";
  if (value === InferenceSource.IN_CLOUD || value === "IN_CLOUD") return "in_cloud";
  return null;
}

async function runModel(model: GenerativeModel, prompt: string) {
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const source = mapSource(result.response.inferenceSource);
  return { text, source };
}

const TRANSIENT_CLOUD_ERROR = /\b(500|503|429)\b|high demand|overloaded|unavailable|try again later|resource exhausted/i;

export function isTransientCloudError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return TRANSIENT_CLOUD_ERROR.test(message);
}

/** Cloud calls retry briefly on transient capacity errors (free-tier demand spikes), never on other failures. */
async function runCloudModel(model: GenerativeModel, prompt: string, attempts = 3) {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await runModel(model, prompt);
    } catch (error) {
      lastError = error;
      if (!isTransientCloudError(error) || attempt === attempts - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    }
  }
  throw lastError;
}

export interface GenerateOptions {
  intake: Intake;
  privacyShield: boolean;
  sectionId?: string;
  currentSection?: BriefSection;
  onDeviceProgress?: (percent: number) => void;
  cloudFallbackConsent?: boolean;
}

export interface GenerateResult {
  bundle?: GeneratedBundle;
  section?: BriefSection;
  telemetry: Telemetry;
}

function localPayload(options: GenerateOptions): { bundle?: GeneratedBundle; section?: BriefSection } {
  if (options.sectionId && options.currentSection) {
    return { section: composeLocalSection(options.intake, options.sectionId, options.currentSection) };
  }
  return { bundle: composeLocalBrief(options.intake) };
}

export async function generateStudioWork(options: GenerateOptions): Promise<GenerateResult> {
  const started = performance.now();
  const nano = await detectNanoAvailability();
  const config = readFirebaseConfig();
  const configured = isFirebaseConfigured(config);
  const plan = planPrivacyShield(options.intake);
  const preview = payloadPreview(options.intake, plan);
  const redactionCount = plan.fields.length;
  const workingIntake = redactionCount > 0 ? plan.redactedIntake : options.intake;
  const sentCloudPrompt =
    options.sectionId && options.currentSection
      ? buildSectionCloudPrompt(
          workingIntake,
          options.sectionId,
          plan.redactText(options.currentSection.title),
          plan.redactText(options.currentSection.body),
        )
      : buildFullBriefCloudPrompt(workingIntake);
  const diagnostics: string[] = [];
  let cloudAttempted = false;
  let devicePrepared = false;
  let deviceProgress: number | null = null;
  let lastSource: "on_device" | "in_cloud" | null = null;
  let lastModel = configured ? config.cloudModel : "local-studio";

  const finish = (
    badge: InferenceBadge,
    reason: string,
    model: string,
    payload: { bundle?: GeneratedBundle; section?: BriefSection },
    extras: { schemaValid: boolean; schemaErrors: string[]; success: boolean; errorMessage: string | null },
  ): GenerateResult => ({
    ...payload,
    telemetry: {
      badge,
      label: labelForBadge(badge),
      reason,
      latencyMs: Math.round(performance.now() - started),
      redactionCount: badge === "on-device" ? 0 : redactionCount,
      tokens: plan.fields.map((field) => field.token),
      nano,
      model,
      privacyShield: options.privacyShield,
      inferenceSource: lastSource,
      cloudAttempted,
      devicePrepared,
      deviceProgress,
      schemaValid: extras.schemaValid,
      schemaErrors: extras.schemaErrors,
      success: extras.success,
      errorMessage: extras.errorMessage,
      promptBefore: preview.before,
      promptAfter: sentCloudPrompt,
    },
  });

  if (!configured) {
    return finish(
      "preview",
      "No Firebase web config is present, so the studio composed this work with a deterministic, non-AI preview. Connect a Spark project to enable Firebase AI Logic hybrid inference.",
      "local-studio",
      localPayload(options),
      { schemaValid: true, schemaErrors: [], success: true, errorMessage: null },
    );
  }

  const current = initializeFirebaseAi(config);
  if (!current) {
    return finish(
      "error-fallback",
      `Firebase AI Logic failed to initialize (${initError ?? "unknown error"}). Showing the deterministic local studio instead.`,
      "local-studio",
      localPayload(options),
      { schemaValid: false, schemaErrors: [], success: false, errorMessage: initError },
    );
  }

  const cloudPrompt = sentCloudPrompt;

  const devicePrompt = options.sectionId && options.currentSection
    ? [
        "Revise a single section of a website brief. Return JSON: { \"sections\": [{ \"id\", \"title\", \"body\" }] } with only that section.",
        `Section id: ${options.sectionId}`,
        `Current title: ${options.currentSection.title}`,
        `Current body:\n${options.currentSection.body}`,
        "",
        "Intake (this request stays on the device; real client values may be present):",
        formatIntakeBlock(options.intake),
      ].join("\n")
    : [
        "Compose a complete website brief for a design studio handoff.",
        schemaInstructions(),
        "",
        "Intake (this request stays on the device; real client values may be present):",
        formatIntakeBlock(options.intake),
      ].join("\n");

  const mode = options.sectionId ? "section" as const : "full" as const;

  const accept = (raw: unknown) => {
    const restored = polishBundle(restoreValue(raw, plan));
    const checked = validateBundle(restored, mode, options.sectionId);
    if (!checked.ok || !checked.bundle) {
      return { ok: false as const, errors: checked.errors };
    }
    if (mode === "section") {
      const section = checked.bundle.sections.find((item) => item.id === options.sectionId)
        ?? checked.bundle.sections[0];
      if (!section) return { ok: false as const, errors: ["The model did not return the requested section."] };
      return { ok: true as const, payload: { section }, errors: [] };
    }
    return { ok: true as const, payload: { bundle: checked.bundle }, errors: [] };
  };

  if (nano !== "unavailable") {
    try {
      if (!current.prepared) {
        await current.modelOnDevice.initializeDeviceModel((value) => {
          current.deviceProgress = Math.round(value * 10000) / 100;
          deviceProgress = current.deviceProgress;
          options.onDeviceProgress?.(current.deviceProgress);
        });
        current.prepared = true;
      }
      devicePrepared = current.prepared;
      deviceProgress = current.deviceProgress;
      lastModel = "gemini-nano";
      const result = await runModel(current.modelOnDevice, devicePrompt);
      lastSource = result.source;
      if (result.source === "on_device") {
        const parsed = extractJson(result.text);
        const accepted = accept(parsed);
        if (accepted.ok) {
          return finish(
            "on-device",
            "This brief was composed on-device with Gemini Nano. Client values did not leave this computer.",
            "gemini-nano",
            accepted.payload,
            { schemaValid: true, schemaErrors: [], success: true, errorMessage: null },
          );
        }
        diagnostics.push(`On-device output failed schema validation: ${accepted.errors.join(" ")}`);
      } else {
        diagnostics.push(
          `ONLY_ON_DEVICE returned inferenceSource=${result.source ?? "unknown"}, which cannot be badged as on-device.`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "On-device inference failed.";
      diagnostics.push(`On-device inference failed: ${message}`);
      devicePrepared = current.prepared;
      deviceProgress = current.deviceProgress;
    }
  } else {
    diagnostics.push("Chrome Built-in AI (Gemini Nano) is unavailable in this browser.");
  }

  const confidentialPresent = plan.fields.length > 0;
  if (confidentialPresent && !options.cloudFallbackConsent) {
    return finish(
      "error-fallback",
      `${diagnostics.join(" ")} Cloud fallback was not approved. Confidential intake fields are present, so the studio did not send a request to Firebase AI Logic. Approve redacted cloud fallback to continue, or keep composing on this device.`.trim(),
      lastModel,
      localPayload(options),
      {
        schemaValid: false,
        schemaErrors: diagnostics,
        success: false,
        errorMessage: "Cloud fallback was not approved while confidential fields were present.",
      },
    );
  }

  cloudAttempted = true;
  lastModel = config.cloudModel;
  try {
    const result = await runCloudModel(current.modelCloud, cloudPrompt);
    lastSource = result.source;
    if (result.source !== "in_cloud") {
      throw new Error(
        `ONLY_IN_CLOUD returned inferenceSource=${result.source ?? "unknown"}, which cannot be badged as cloud inference.`,
      );
    }
    const parsed = extractJson(result.text);
    const accepted = accept(parsed);
    if (!accepted.ok) {
      return finish(
        "error-fallback",
        `The Firebase AI Logic response failed strict schema validation (${accepted.errors.join(" ")}). The studio did not label incomplete model JSON as a successful AI brief.`,
        config.cloudModel,
        localPayload(options),
        {
          schemaValid: false,
          schemaErrors: accepted.errors,
          success: false,
          errorMessage: accepted.errors.join(" "),
        },
      );
    }
    return finish(
      "cloud",
      confidentialPresent
        ? "Gemini Nano was unavailable or returned an invalid brief, so Firebase AI Logic composed this work in the cloud. Privacy Shield replaced configured confidential fields and detected emails/phones with reversible tokens before transmission; this is not a guarantee of full anonymization of arbitrary free-text context."
        : "Gemini Nano was unavailable or returned an invalid brief, so Firebase AI Logic composed this work in the cloud.",
      config.cloudModel,
      accepted.payload,
      { schemaValid: true, schemaErrors: [], success: true, errorMessage: null },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cloud inference failed.";
    diagnostics.push(`Cloud inference failed: ${message}`);
    return finish(
      "error-fallback",
      `${diagnostics.join(" ")} Showing the deterministic local studio instead.`,
      config.cloudModel,
      localPayload(options),
      {
        schemaValid: false,
        schemaErrors: diagnostics,
        success: false,
        errorMessage: message,
      },
    );
  }
}


export interface WebsiteGenerateOptions {
  intake: Intake;
  sections: BriefSection[];
  sitemap: SitemapPage[];
  artDirection: ArtDirection;
  privacyShield: boolean;
  cloudFallbackConsent?: boolean;
  onDeviceProgress?: (percent: number) => void;
}

export interface WebsiteGenerateResult {
  site: GeneratedSite;
  telemetry: Telemetry;
}

export { buildRedactedWebsitePrompt } from "./cloudPrompt";

function localWebsite(options: WebsiteGenerateOptions): GeneratedSite {
  const copy = composeLocalWebsite({
    intake: options.intake,
    sections: options.sections,
    sitemap: options.sitemap,
    artDirection: options.artDirection,
  });
  const theme = themeSnapshot(options.artDirection);
  return {
    copy,
    photoIds: collectPhotoIds(copy),
    builtAt: new Date().toISOString(),
    telemetry: null,
    fontMap: theme.fontMap,
    paletteLog: theme.palette.log,
    designDecisions: buildDesignDecisions({
      intake: options.intake,
      art: options.artDirection,
      telemetry: null,
      fontMap: theme.fontMap,
      fieldHex: theme.fieldHex,
    }),
    copyWarnings: [],
    trace: [],
  };
}

function acceptWebsiteCopy(raw: unknown, plan: ReturnType<typeof planPrivacyShield>, intake: Intake): {
  ok: boolean;
  copy?: SiteCopy;
  errors: string[];
  warnings: string[];
} {
  const restored = restoreValue(raw, plan);
  const checked = validateSiteCopy(restored);
  if (!checked.ok || !checked.copy) return { ok: false, errors: checked.errors, warnings: [] };
  const scrubbed = scrubSiteCopy(checked.copy, intake);
  const linted = lintGuestCopy(scrubbed, intake);
  const again = validateSiteCopy(linted.copy);
  if (!again.ok || !again.copy) return { ok: false, errors: again.errors, warnings: linted.warnings };
  return { ok: true, copy: again.copy, errors: [], warnings: linted.warnings };
}

export async function generateWebsiteWork(options: WebsiteGenerateOptions): Promise<WebsiteGenerateResult> {
  const started = performance.now();
  const nano = await detectNanoAvailability();
  const config = readFirebaseConfig();
  const configured = isFirebaseConfigured(config);
  const plan = planPrivacyShield(options.intake);
  const preview = payloadPreview(options.intake, plan);
  const redactionCount = plan.fields.length;
  const sentCloudPrompt = buildRedactedWebsitePrompt(
    options.intake,
    options.sections,
    options.sitemap,
    options.artDirection,
    plan,
  );
  const diagnostics: string[] = [];
  let cloudAttempted = false;
  let devicePrepared = false;
  let deviceProgress: number | null = null;
  let lastSource: "on_device" | "in_cloud" | null = null;
  let lastModel = configured ? config.cloudModel : "local-studio";

  let copyWarnings: string[] = [];
  const pack = (copy: SiteCopy, telemetry: Telemetry): GeneratedSite => {
    const theme = themeSnapshot(options.artDirection);
    return {
      copy,
      photoIds: collectPhotoIds(copy),
      builtAt: new Date().toISOString(),
      telemetry,
      fontMap: theme.fontMap,
      paletteLog: theme.palette.log,
      designDecisions: buildDesignDecisions({
        intake: options.intake,
        art: options.artDirection,
        telemetry,
        fontMap: theme.fontMap,
        fieldHex: theme.fieldHex,
      }),
      copyWarnings,
      trace: buildWebsiteTrace({
        telemetry,
        consentGranted: Boolean(options.cloudFallbackConsent),
        scrubWarnings: copyWarnings,
        copyReady: true,
      }),
    };
  };

  const finish = (
    badge: InferenceBadge,
    reason: string,
    model: string,
    copy: SiteCopy,
    extras: { schemaValid: boolean; schemaErrors: string[]; success: boolean; errorMessage: string | null },
  ): WebsiteGenerateResult => {
    const telemetry: Telemetry = {
      badge,
      label: labelForBadge(badge),
      reason,
      latencyMs: Math.round(performance.now() - started),
      redactionCount: badge === "on-device" ? 0 : redactionCount,
      tokens: plan.fields.map((field) => field.token),
      nano,
      model,
      privacyShield: options.privacyShield,
      inferenceSource: lastSource,
      cloudAttempted,
      devicePrepared,
      deviceProgress,
      schemaValid: extras.schemaValid,
      schemaErrors: extras.schemaErrors,
      success: extras.success,
      errorMessage: extras.errorMessage,
      promptBefore: preview.before,
      promptAfter: sentCloudPrompt,
    };
    const site = pack(copy, telemetry);
    return { site, telemetry };
  };

  const localCopy = localWebsite(options).copy;

  if (!configured) {
    return finish(
      "preview",
      "No Firebase web config is present, so the studio composed this website with a deterministic, non-AI preview. Connect a Spark project to enable Firebase AI Logic hybrid inference.",
      "local-studio",
      localCopy,
      { schemaValid: true, schemaErrors: [], success: true, errorMessage: null },
    );
  }

  const current = initializeFirebaseAi(config);
  if (!current) {
    return finish(
      "error-fallback",
      `Firebase AI Logic failed to initialize (${initError ?? "unknown error"}). Showing the deterministic local website instead.`,
      "local-studio",
      localCopy,
      { schemaValid: false, schemaErrors: [], success: false, errorMessage: initError },
    );
  }

  const devicePrompt = [
    "Write published website copy for a multi-section marketing site. Return only the JSON described below.",
    websiteSchemaInstructions(),
    "",
    "Intake (this request stays on the device; real client values may be present):",
    formatIntakeBlock(options.intake),
    "",
    "Brief sections:",
    options.sections.map((section) => `### ${section.title}\n${section.body}`).join("\n\n") || "(none)",
    "",
    "Bundled reference photo ids:",
    REFERENCE_PHOTOS.map((photo) => `${photo.id} (${photo.role})`).join(", "),
  ].join("\n");

  if (nano !== "unavailable") {
    try {
      if (!current.prepared) {
        await current.modelOnDevice.initializeDeviceModel((value) => {
          current.deviceProgress = Math.round(value * 10000) / 100;
          deviceProgress = current.deviceProgress;
          options.onDeviceProgress?.(current.deviceProgress);
        });
        current.prepared = true;
      }
      devicePrepared = current.prepared;
      deviceProgress = current.deviceProgress;
      lastModel = "gemini-nano";
      const result = await runModel(current.modelOnDevice, devicePrompt);
      lastSource = result.source;
      if (result.source === "on_device") {
        const parsed = extractJson(result.text);
        const accepted = acceptWebsiteCopy(parsed, plan, options.intake);
        if (accepted.ok && accepted.copy) {
          copyWarnings = accepted.warnings;
          return finish(
            "on-device",
            "This website was composed on-device with Gemini Nano. Client values did not leave this computer. Tokens were not required for the on-device path.",
            "gemini-nano",
            accepted.copy,
            { schemaValid: true, schemaErrors: [], success: true, errorMessage: null },
          );
        }
        diagnostics.push(`On-device website output failed schema validation: ${accepted.errors.join(" ")}`);
      } else {
        diagnostics.push(
          `ONLY_ON_DEVICE returned inferenceSource=${result.source ?? "unknown"}, which cannot be badged as on-device.`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "On-device inference failed.";
      diagnostics.push(`On-device inference failed: ${message}`);
      devicePrepared = current.prepared;
      deviceProgress = current.deviceProgress;
    }
  } else {
    diagnostics.push("Chrome Built-in AI (Gemini Nano) is unavailable in this browser.");
  }

  const confidentialPresent = plan.fields.length > 0;
  if (confidentialPresent && !options.cloudFallbackConsent) {
    return finish(
      "error-fallback",
      `${diagnostics.join(" ")} Cloud fallback was not approved. Confidential intake fields are present, so the studio did not send a website request to Firebase AI Logic. Approve redacted cloud fallback to continue, or keep composing on this device.`.trim(),
      lastModel,
      localCopy,
      {
        schemaValid: false,
        schemaErrors: diagnostics,
        success: false,
        errorMessage: "Cloud fallback was not approved while confidential fields were present.",
      },
    );
  }

  cloudAttempted = true;
  lastModel = config.cloudModel;
  try {
    const result = await runCloudModel(current.modelCloud, sentCloudPrompt);
    lastSource = result.source;
    if (result.source !== "in_cloud") {
      throw new Error(
        `ONLY_IN_CLOUD returned inferenceSource=${result.source ?? "unknown"}, which cannot be badged as cloud inference.`,
      );
    }
    const parsed = extractJson(result.text);
    const accepted = acceptWebsiteCopy(parsed, plan, options.intake);
    if (!accepted.ok || !accepted.copy) {
      return finish(
        "error-fallback",
        `The Firebase AI Logic website response failed strict schema validation (${accepted.errors.join(" ")}). The studio did not label incomplete model JSON as a successful AI site.`,
        config.cloudModel,
        localCopy,
        {
          schemaValid: false,
          schemaErrors: accepted.errors,
          success: false,
          errorMessage: accepted.errors.join(" "),
        },
      );
    }
    copyWarnings = accepted.warnings;
    return finish(
      "cloud",
      confidentialPresent
        ? "Gemini Nano was unavailable or returned invalid website copy, so Firebase AI Logic composed this site in the cloud. Privacy Shield replaced configured confidential fields and detected emails/phones with reversible tokens before transmission; this is not a guarantee of full anonymization of arbitrary free-text context. Tokens were restored on the device before render. The public site copy is also scrubbed of budget and confidential notes."
        : "Gemini Nano was unavailable or returned invalid website copy, so Firebase AI Logic composed this site in the cloud.",
      config.cloudModel,
      accepted.copy,
      { schemaValid: true, schemaErrors: [], success: true, errorMessage: null },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cloud inference failed.";
    diagnostics.push(`Cloud inference failed: ${message}`);
    return finish(
      "error-fallback",
      `${diagnostics.join(" ")} Showing the deterministic local website instead.`,
      config.cloudModel,
      localCopy,
      {
        schemaValid: false,
        schemaErrors: diagnostics,
        success: false,
        errorMessage: message,
      },
    );
  }
}
