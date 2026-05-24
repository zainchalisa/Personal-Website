import type { PageId } from '../../../types'
import { EmailIcon, GitHubIcon, LinkedInIcon } from './SocialIcons'
import styles from './Hero.module.css'

type HeroLeftProps = {
  onNavigate: (page: PageId) => void
}

const SOCIAL_LINKS = [
  {
    id: 'linkedin',
    label: 'linkedin',
    href: 'https://www.linkedin.com/in/zainchalisa',
    Icon: LinkedInIcon,
    external: true,
  },
  {
    id: 'github',
    label: 'github',
    href: 'https://github.com/zainchalisa',
    Icon: GitHubIcon,
    external: true,
  },
  {
    id: 'email',
    label: 'email',
    href: 'mailto:zainchalisabiz@gmail.com',
    Icon: EmailIcon,
    external: false,
  },
] as const

const BIO = [
  "ive been making stuff since i was 14 years old. from my own landscaping business to creating viral videos on tiktok to reselling random stuff online. ive tried or at least thought of attempting everything under the sun.",
  'i learned how to code 4 years ago, and now im a software engineer in new york city.',
  'right now im working on building things that are cool to me and maybe… will be cool to the world!',
  'take a look around, you might find something you like :p',
] as const

export function HeroLeft({ onNavigate }: HeroLeftProps) {
  return (
    <div className={styles.heroLeft}>
      <h1 className={`${styles.title} ${styles.heroEnter} ${styles.heroEnterTitle}`}>
        hi, i&apos;m zain!
      </h1>
      <div className={`${styles.bio} ${styles.heroEnter} ${styles.heroEnterBio}`}>
        {BIO.map((paragraph, index) => (
          <p
            key={paragraph}
            className={`${styles.subtitle}${index === 1 ? ` ${styles.subtitleEmphasis}` : ''}`}
          >
            {paragraph}
          </p>
        ))}
      </div>
      <div className={`${styles.pills} ${styles.heroEnter} ${styles.heroEnterPills}`}>
        {SOCIAL_LINKS.map(({ id, label, href, Icon, external }) => (
          <a
            key={id}
            className={styles.pill}
            href={href}
            {...(external
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
            aria-label={label}
          >
            <Icon className={styles.pillIcon} />
            <span>{label}</span>
          </a>
        ))}
      </div>
      <div className={`${styles.ctas} ${styles.heroEnter} ${styles.heroEnterCtas}`}>
        <button type="button" className={styles.ctaPrimary} onClick={() => onNavigate('projects')}>
          view projects →
        </button>
        <button
          type="button"
          className={styles.ctaSecondary}
          onClick={() => onNavigate('photography')}
        >
          explore my photography →
        </button>
      </div>
    </div>
  )
}
