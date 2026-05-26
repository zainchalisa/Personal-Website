/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ASSET_BASE_URL?: string
  /** Bump when remote assets are re-uploaded (cache-bust query param). */
  readonly VITE_ASSET_CACHE_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
