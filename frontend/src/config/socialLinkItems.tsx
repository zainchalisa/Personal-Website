import { EmailIcon, GitHubIcon, LinkedInIcon } from '@/components/SocialIcons'
import { SOCIAL_LINK_PATHS } from './socialLinks'

const SOCIAL_ICONS = {
  linkedin: LinkedInIcon,
  github: GitHubIcon,
  email: EmailIcon,
} as const

export const SOCIAL_LINKS = SOCIAL_LINK_PATHS.map((link) => ({
  ...link,
  Icon: SOCIAL_ICONS[link.id],
}))
