/**
 * Dev-only image load instrumentation.
 * Disabled in production builds (`import.meta.env.DEV`).
 * In local dev, set localStorage `zain-image-perf=0` to silence logs.
 */

type ImagePerfKind = 'hit' | 'miss' | 'fail' | 'decode' | 'nav'

function enabled(): boolean {
  if (!import.meta.env.DEV) return false
  try {
    return window.localStorage.getItem('zain-image-perf') !== '0'
  } catch {
    return true
  }
}

function log(kind: ImagePerfKind, details: Record<string, string | number | boolean>): void {
  if (!enabled()) return
  console.debug(`[image-perf:${kind}]`, details)
}

export function logImageCacheHit(src: string): void {
  log('hit', { src: shortSrc(src) })
}

export function logImageCacheMiss(src: string): void {
  log('miss', { src: shortSrc(src) })
}

export function logImageLoadFail(src: string, requestMs: number): void {
  log('fail', { src: shortSrc(src), requestMs: roundMs(requestMs) })
}

export function logImageDecode(
  src: string,
  requestMs: number,
  decodeMs: number,
): void {
  log('decode', {
    src: shortSrc(src),
    requestMs: roundMs(requestMs),
    decodeMs: roundMs(decodeMs),
    totalMs: roundMs(requestMs + decodeMs),
  })
}

export function logImageNavPaint(src: string, clickToPaintMs: number, cached: boolean): void {
  log('nav', {
    src: shortSrc(src),
    clickToPaintMs: roundMs(clickToPaintMs),
    cached,
  })
}

function shortSrc(src: string): string {
  try {
    const url = new URL(src)
    const parts = url.pathname.split('/').filter(Boolean)
    return parts.slice(-3).join('/')
  } catch {
    return src.slice(-80)
  }
}

function roundMs(value: number): number {
  return Math.round(value * 10) / 10
}
