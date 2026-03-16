/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STORYBLOK_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
