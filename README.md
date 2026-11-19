# Atelier Brief

A design-first website briefing studio for freelancers and small practices. Atelier Brief composes a structured client brief, a sitemap, and an art-direction sheet — and it treats **on-device inference as a privacy feature**, not a novelty toggle.

Built for [#BuildHybridAI 2026](https://firebasehybridaihackathon.devpost.com/) with the official [Firebase AI Logic](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started) hybrid web SDK (`firebase@13.4.0`).

**Live path:** stay on the Firebase **Spark** free tier. Never enable Blaze billing. Never call billed image-generation models.

## Why hybrid inference is the product

Freelance briefs contain client names, budgets, contacts, and notes a studio should not casually ship to the cloud. When Chrome Built-in AI (Gemini Nano) is available, Atelier Brief uses `InferenceMode.ONLY_ON_DEVICE` so those fields never leave the laptop. If Nano is missing, **Privacy Shield** replaces confidential values with reversible tokens (`[CLIENT_NAME]`, `[BUDGET_RANGE]`, `[CONTACT]`, `[PROPRIETARY_NOTES]`) before any `ONLY_IN_CLOUD` call, then restores the real values locally for display and export.

The studio is honest about which path ran:

- **On-Device · Gemini Nano**
- **Cloud Fallback · Firebase AI Logic**
- **Local Preview · Connect Firebase Config** (full interface, no Firebase env required)

## Architecture

```
src/lib/hybridAi.ts       Official firebase/app, firebase/app-check, firebase/ai
src/lib/privacyShield.ts  Reversible PII tokenisation
src/lib/localStudio.ts    High-quality Offline Studio Preview composer
src/lib/persistence.ts    IndexedDB + localStorage archive
src/components/           Editorial workspace (intake, canvas, sitemap, art, export)
```

The hybrid module calls:

- `initializeApp` from `firebase/app`
- `initializeAppCheck` + `ReCaptchaV3Provider` from `firebase/app-check`
- `getAI`, `getGenerativeModel`, `GoogleAIBackend`, `InferenceMode` from `firebase/ai`
- `model.initializeDeviceModel()` after a user gesture (required by Chrome)
- `result.response.inferenceSource` (`ON_DEVICE` | `IN_CLOUD`, SDK v12.5.0+)

Default cloud text model: `gemini-3.5-flash-lite` (Firebase JS SDK v13 default). Override with `VITE_FIREBASE_CLOUD_MODEL` only if you stay on the free text tier.

## Offline Studio Preview

If no `VITE_FIREBASE_*` keys are present, the app still runs. Sample clients, composition, editing, export, and local persistence all work, and the interface is clearly badged as a local preview. This is so judges and reviewers can inspect the product immediately. Hybrid inference starts the moment a Spark web config is provided and the app is rebuilt or restarted.

## $0 Spark setup

1. Create a Firebase project and **leave it on the Spark plan**. Do not upgrade to Blaze.
2. Register a **Web** app and copy the public config values into a gitignored `.env` (see `.env.example`).
3. Enable **Firebase AI Logic** (Gemini Developer API) for the project. Text inference is free within usage limits; do not enable billed image models.
4. Enable **App Check** with reCAPTCHA v3. Put the public site key in `VITE_FIREBASE_RECAPTCHA_V3_SITE_KEY`.
5. For local development only, set `VITE_FIREBASE_APPCHECK_DEBUG=true` in `.env.local`. The official hook `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` will mint a debug token in the browser console. Register that token in Firebase Console → App Check → Manage debug tokens. **Never commit the token.**
6. Build and deploy with Firebase Hosting on Spark (or any free static host serving the `dist/` folder):

```bash
cp .env.example .env.local   # then fill values
npm install
npm run dev                  # local studio
npm run build
npm run preview
npx firebase-tools deploy --only hosting   # optional, Spark Hosting
```

Official debug-token guidance: [Use App Check with the debug provider in web apps](https://firebase.google.com/docs/app-check/web/debug-provider).

## Scripts

```bash
npm run dev        # Vite dev server
npm run build      # TypeScript + production bundle
npm run preview    # Serve dist/ at http://127.0.0.1:4173
npm run test:e2e   # Playwright checks against the production preview
```

## Export

- Copy Markdown
- Download a `.md` brief
- Print-ready client brief (`window.print()`, studio chrome hidden)
- Local archive of multiple projects (IndexedDB, localStorage fallback)

## License

MIT © 2026 Sri Wahyuni (yunnaysy)
