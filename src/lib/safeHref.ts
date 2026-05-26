/** Allow only https URLs (blocks javascript:, data:, http:, etc.). */
export function safeHref(url: string | null | undefined): string | undefined {
  if (url == null || url === '') return undefined
  try {
    if (new URL(url).protocol === 'https:') {
      return url
    }
  } catch {
    /* invalid URL */
  }
  return undefined
}
