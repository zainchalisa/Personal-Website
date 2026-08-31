/** Remote static assets base (Cloudflare Pages Direct Upload). */
function getAssetBaseUrl(): string {
  const base = import.meta.env.VITE_ASSET_BASE_URL?.trim()
  if (!base) {
    throw new Error(
      'VITE_ASSET_BASE_URL is not set. Copy .env.example to .env and set your Cloudflare assets URL.',
    )
  }
  return base.replace(/\/$/, '')
}

/** Optional cache-bust token — bump after re-uploading assets to Cloudflare. */
function getAssetCacheVersion(): string | null {
  const version = import.meta.env.VITE_ASSET_CACHE_VERSION?.trim()
  return version || null
}

/** Build a full URL for a path under the remote assets host. */
export function assetUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const encoded = normalized
    .split('/')
    .map((segment) => (segment === '' ? segment : encodeURIComponent(segment)))
    .join('/')
  const url = `${getAssetBaseUrl()}${encoded}`
  const version = getAssetCacheVersion()
  if (!version) return url
  return `${url}?v=${encodeURIComponent(version)}`
}
