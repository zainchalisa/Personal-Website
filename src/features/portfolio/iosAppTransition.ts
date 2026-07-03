export const IOS_APP_OPEN_MS = 360
export const IOS_APP_CLOSE_MS = 420

export type IconOrigin = {
  x: number
  y: number
  scale: number
}

export type AppTransitionPhase = 'idle' | 'opening' | 'open' | 'closing'

export function measureIconOrigin(
  iconEl: HTMLElement | null,
  containerEl: HTMLElement | null,
): IconOrigin {
  if (!iconEl || !containerEl) {
    return fallbackOrigin(containerEl)
  }

  const iconRect = iconEl.getBoundingClientRect()
  const containerRect = containerEl.getBoundingClientRect()
  const width = Math.max(containerRect.width, 1)

  return {
    x: iconRect.left + iconRect.width / 2 - containerRect.left,
    y: iconRect.top + iconRect.height / 2 - containerRect.top,
    scale: Math.max(0.1, Math.min(0.5, iconRect.width / width)),
  }
}

function fallbackOrigin(containerEl: HTMLElement | null): IconOrigin {
  const width = containerEl?.clientWidth ?? 390
  const height = containerEl?.clientHeight ?? 844

  return {
    x: width / 2,
    y: height * 0.85,
    scale: 0.5,
  }
}
