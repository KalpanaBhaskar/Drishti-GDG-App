/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY?: string;
    readonly VITE_XAI_API_KEY?: string;
    readonly VITE_NVIDIA_API_KEY?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
