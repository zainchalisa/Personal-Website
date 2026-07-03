export const PROJECT_ACCENT_COLORS: Record<string, string> = {
  photon: '#4ACFB0',
  sync: '#D4915A',
  'rutgers-cafe': '#4A9EFF',
  'classification-neural-networks': '#4ACFB0',
  tripdog: '#D4915A',
}

export function getProjectDetailPath(slug: string): string {
  return `~/projects/${slug}`
}
