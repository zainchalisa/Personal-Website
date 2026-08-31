export const EMAIL_MAILTO = 'mailto:zainchalisabiz@gmail.com'

const SOCIAL_REDIRECT_TARGETS = {
  linkedin: 'https://www.linkedin.com/in/zainchalisa',
  github: 'https://github.com/zainchalisa',
  email: EMAIL_MAILTO,
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
    path: EMAIL_MAILTO,
    external: false,
  },
] as const

export function resolveSocialRedirect(pathname: string): string | null {
  if (pathname === '/email') return SOCIAL_REDIRECT_TARGETS.email
  const link = SOCIAL_LINK_PATHS.find((item) => item.path === pathname)
  return link ? SOCIAL_REDIRECT_TARGETS[link.id] : null
}
