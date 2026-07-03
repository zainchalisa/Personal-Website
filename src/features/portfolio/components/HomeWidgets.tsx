import widgetStyles from './HomeWidgets.module.css'
import { SOCIAL_LINK_PATHS } from '@/shared/config/socialLinks'

type HomeWidgetsVariant = 'ios' | 'desktop'

const PHOTON_LP_URL = '/photon'
const LINKEDIN_LINK = SOCIAL_LINK_PATHS.find((link) => link.id === 'linkedin')!

type WidgetSquareProps = {
  family: string
  title: string
  subtitles: string[]
  tint: 'blue' | 'purple'
  animationClass: string
  subtitleClamp?: boolean
  anchorSubtitleBottom?: boolean
  href?: string
  external?: boolean
  linkAriaLabel?: string
}

function WidgetSquare({
  family,
  title,
  subtitles,
  tint,
  animationClass,
  subtitleClamp = false,
  anchorSubtitleBottom = false,
  href,
  external = false,
  linkAriaLabel,
}: WidgetSquareProps) {
  const className = `${widgetStyles.widgetSquare} ${widgetStyles.widgetAnimate} ${animationClass}${
    href ? ` ${widgetStyles.widgetSquareLink}` : ''
  }`

  const content = (
    <div className={widgetStyles.widgetSquareContent}>
      <p className={widgetStyles.widgetFamily}>
        <span className={widgetStyles.widgetAccentDot} aria-hidden />
        {family}
      </p>
      <h2 className={widgetStyles.widgetPrimary}>{title}</h2>
      <div
        className={`${widgetStyles.widgetSubtitleGroup}${
          subtitles.length > 1 ? ` ${widgetStyles.widgetSubtitleStack}` : ''
        }${anchorSubtitleBottom ? ` ${widgetStyles.widgetSubtitleGroupBottom}` : ''}`}
      >
        {subtitles.map((line) => (
          <p
            key={line}
            className={`${widgetStyles.widgetSecondary}${
              subtitleClamp ? ` ${widgetStyles.widgetSecondaryClamp}` : ''
            }`}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  )

  if (href) {
    return (
      <a
        className={className}
        data-tint={tint}
        href={href}
        aria-label={linkAriaLabel ?? `Open ${title}`}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {content}
      </a>
    )
  }

  return (
    <article className={className} data-tint={tint}>
      {content}
    </article>
  )
}

type HomeWidgetsProps = {
  variant?: HomeWidgetsVariant
}

export function HomeWidgets({ variant = 'ios' }: HomeWidgetsProps) {
  const rowClass =
    variant === 'desktop'
      ? `${widgetStyles.widgetRow} ${widgetStyles.widgetRowDesktop}`
      : `${widgetStyles.widgetRow} ${widgetStyles.widgetRowIos}`

  return (
    <div className={rowClass} aria-label="Home screen widgets">
      <WidgetSquare
        family="Currently"
        title="Senior Software Engineer"
        subtitles={['New York City']}
        tint="blue"
        animationClass={widgetStyles.widgetDelay0}
        href={LINKEDIN_LINK.path}
        external={LINKEDIN_LINK.external}
        linkAriaLabel="Senior Software Engineer — open LinkedIn profile"
      />
      <WidgetSquare
        family="Building"
        title="Photon"
        subtitles={[
          'A Mac app that helps you relive your memories how you remember them.',
        ]}
        tint="purple"
        animationClass={widgetStyles.widgetDelay1}
        anchorSubtitleBottom
        href={PHOTON_LP_URL}
        linkAriaLabel="Photon — open landing page"
      />
    </div>
  )
}
