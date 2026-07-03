const SOCIAL_REDIRECT_TARGETS = {
  linkedin: 'https://www.linkedin.com/in/zainchalisa',
  github: 'https://github.com/zainchalisa',
  email: 'mailto:zainchalisabiz@gmail.com',
} as const

export const SOCIAL_LINK_PATHS = [
  {
    id: 'linkedin' as const,
    label: 'LinkedIn',
    path: '/linkedin',
    external: true,
  },
  {
    id: 'github' as const,
    label: 'GitHub',
    path: '/github',
    external: true,
  },
  {
    id: 'email' as const,
    label: 'Mail',
    path: '/email',
    external: false,
  },
] as const

export function resolveSocialRedirect(pathname: string): string | null {
  const link = SOCIAL_LINK_PATHS.find((item) => item.path === pathname)
  return link ? SOCIAL_REDIRECT_TARGETS[link.id] : null
}
