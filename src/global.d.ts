export {};

declare global {
  interface LanguageModelAvailability {
    availability?: () => Promise<string>;
  }

  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
    LanguageModel?: {
      availability: () => Promise<string>;
    };
  }

  // Official App Check debug hook is read from the global object.
  // eslint-disable-next-line no-var
  var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined;
}

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_RECAPTCHA_V3_SITE_KEY?: string;
  readonly VITE_FIREBASE_APPCHECK_DEBUG?: string;
  readonly VITE_FIREBASE_CLOUD_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
