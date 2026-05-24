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

/** 0 = full day lava, 1 = full night lava intensity */
export function getLavaGlowBoost(theme: Theme, transition: ThemeTransition | null) {
  if (transition?.active) {
    return transition.to === 'dark' ? transition.progress : 1 - transition.progress
  }
  return theme === 'dark' ? 1 : 0
}
