export const SCENE_TRANSITION_MS = 2600

export function clamp(v: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, v))
}

/** Linear ramp from 0→1 between start and end timestamps */
export function ramp(t: number, start: number, end: number) {
  if (start >= end) return t <= start ? 1 : 0
  return clamp((t - start) / (end - start))
}

/** Triangle: rises 0→1 from start to peak, falls 1→0 from peak to end */
export function triangle(t: number, start: number, peak: number, end: number) {
  if (t < start) return 0
  if (t < peak) return (t - start) / (peak - start)
  if (t < end) return 1 - (t - peak) / (end - peak)
  return 0
}

export type SceneFrameState = {
  darkBgOpacity: number
  twilightOpacity: number
  moonOpacity: number
  moonTranslateY: number
  starsProgress: number
  lavaGlowOpacity: number
}

export function applyFrameDayToNight(t: number): SceneFrameState {
  const moonOpacity = ramp(t, 0.55, 0.85)
  return {
    darkBgOpacity: ramp(t, 0.35, 0.8),
    twilightOpacity: triangle(t, 0.1, 0.42, 0.7) * 0.72,
    moonOpacity,
    moonTranslateY: -30 * (1 - moonOpacity),
    starsProgress: ramp(t, 0.58, 0.85),
    lavaGlowOpacity: ramp(t, 0.72, 1),
  }
}

export function applyFrameNightToDay(t: number): SceneFrameState {
  const moonOpacity = 1 - ramp(t, 0.1, 0.55)
  return {
    darkBgOpacity: 1 - ramp(t, 0.2, 0.65),
    twilightOpacity: triangle(t, 0.12, 0.38, 0.68) * 0.65,
    moonOpacity,
    moonTranslateY: -30 * (1 - moonOpacity),
    starsProgress: 1 - ramp(t, 0.08, 0.5),
    lavaGlowOpacity: 1 - ramp(t, 0.05, 0.4),
  }
}

export function applyFrame(t: number, towardDark: boolean): SceneFrameState {
  return towardDark ? applyFrameDayToNight(t) : applyFrameNightToDay(t)
}

export function lerpFrame(from: SceneFrameState, to: SceneFrameState, t: number): SceneFrameState {
  const u = clamp(t)
  const mix = (a: number, b: number) => a + (b - a) * u
  return {
    darkBgOpacity: mix(from.darkBgOpacity, to.darkBgOpacity),
    twilightOpacity: mix(from.twilightOpacity, to.twilightOpacity),
    moonOpacity: mix(from.moonOpacity, to.moonOpacity),
    moonTranslateY: mix(from.moonTranslateY, to.moonTranslateY),
    starsProgress: mix(from.starsProgress, to.starsProgress),
    lavaGlowOpacity: mix(from.lavaGlowOpacity, to.lavaGlowOpacity),
  }
}
