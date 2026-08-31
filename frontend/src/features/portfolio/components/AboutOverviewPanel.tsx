import {
  ABOUT_OVERVIEW_BODY_MOBILE,
  ABOUT_OVERVIEW_HEADLINE,
  ABOUT_OVERVIEW_PARAGRAPHS,
  ABOUT_OVERVIEW_SUBLINE,
} from '../aboutContent'
import { TIMELINE_IMAGES } from '../timelineAssets'
import desktopStyles from '../PortfolioPage.module.css'
import mobileStyles from './AboutMobileApp.module.css'

type AboutOverviewPanelProps = {
  variant: 'desktop' | 'mobile'
}

export function AboutOverviewPanel({ variant }: AboutOverviewPanelProps) {
  if (variant === 'mobile') {
    return (
      <div className={mobileStyles.overviewInner}>
        <div className={mobileStyles.overviewCopy}>
          <p className={mobileStyles.overviewHeadline}>{ABOUT_OVERVIEW_HEADLINE}</p>
          <p className={mobileStyles.overviewSubline}>{ABOUT_OVERVIEW_SUBLINE}</p>
          <div className={mobileStyles.aboutBody}>
            {ABOUT_OVERVIEW_BODY_MOBILE.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div className={mobileStyles.overviewPeekRow}>
          <div className={mobileStyles.overviewPeek} aria-hidden>
            <img
              className={mobileStyles.overviewPeekPhoto}
              src={TIMELINE_IMAGES.babyMe}
              alt=""
              draggable={false}
            />
          </div>
          <div className={mobileStyles.overviewMessageBubble}>
            <span className={mobileStyles.overviewMessageText}>Hi!</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={desktopStyles.preview}>
      <div className={desktopStyles.vscreenInner}>
        <div className={desktopStyles.vsBg} style={{ background: '#141414' }} />
        <div className={desktopStyles.vsLeft}>
          <div className={desktopStyles.overviewBody}>
            {ABOUT_OVERVIEW_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph} className={desktopStyles.overviewParagraph}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
        <div className={desktopStyles.vsRight}>
          <img
            className={desktopStyles.overviewPhoto}
            src={TIMELINE_IMAGES.babyMeDesktop}
            alt="Baby photo of Zain"
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
}
