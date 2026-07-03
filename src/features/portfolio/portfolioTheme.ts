export type PortfolioTheme = 'light' | 'dark'

export function readSystemPortfolioTheme(): PortfolioTheme {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark'
}
