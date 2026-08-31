export type Theme = 'light' | 'dark'

export type ThemeTransition = {
  from: Theme
  to: Theme
  progress: number
  active: boolean
}

export const THEME_TRANSITION_MS = 1500

export function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

/** Pinboard lamp overlay strength during photography theme transition (0–~1.2). */
export function getPhotographyLightBoost(
  transition: ThemeTransition | null,
  timeSec: number,
): number {
  if (!transition?.active) return 1

  const p = transition.progress

  if (transition.to === 'dark') {
    if (p < 0.45) return 0.04 + p * 0.04
    const t = (p - 0.45) / 0.55
    const flickerMix = 1 - t * 0.75
    const flicker =
      1 +
      Math.sin(timeSec * 33) * 0.26 * flickerMix +
      Math.sin(timeSec * 51) * 0.16 * flickerMix +
      Math.sin(timeSec * 19) * 0.1 * flickerMix
    return Math.min(0.88, t * flicker * 0.78)
  }

  /* Light mode: smooth fade only (canvas uses daylight branch; boost unused) */
  return 0
}
