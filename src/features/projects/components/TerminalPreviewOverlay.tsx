import { useEffect } from 'react'
import type { TerminalProject } from '../terminalProjectTypes'
import { SyncAutoSlideshow } from './SyncAutoSlideshow'
import { TerminalReportViewer } from './TerminalReportViewer'
import { TerminalSlideshow } from './TerminalSlideshow'
import { TerminalMediaPlaceholder } from './TerminalMediaPlaceholder'
import { TerminalVideoPlayer } from './TerminalVideoPlayer'
import styles from './TerminalPreviewOverlay.module.css'

type Props = {
  project: TerminalProject
  mobile?: boolean
  onClose: () => void
}

function PreviewMedia({
  project,
  mobile = false,
}: {
  project: TerminalProject
  mobile?: boolean
}) {
  const variant = mobile ? 'mobile' : 'desktop'
  switch (project.mediaKind) {
    case 'slideshow-manual':
      return (
        <TerminalSlideshow
          slideUrls={project.showcaseSlideUrls ?? []}
          title={project.title}
          variant={variant}
        />
      )
    case 'slideshow-auto':
      return (
        <SyncAutoSlideshow
          slideUrls={project.showcaseSlideUrls ?? []}
          title={project.title}
          variant={variant}
        />
      )
    case 'video':
      return (
        <TerminalVideoPlayer
          title={project.title}
          mp4Url={project.demoVideoMp4Url}
          webmUrl={project.demoVideoWebmUrl}
          posterUrl={project.demoVideoPosterUrl}
          playbackRate={project.demoVideoPlaybackRate}
          allowPause={project.slug !== 'rutgers-cafe'}
        />
      )
    case 'scroll-pdf':
      return (
        <TerminalReportViewer
          pageUrls={project.showcaseSlideUrls ?? []}
          title={project.title}
          pdfUrl={project.documentUrl}
        />
      )
    case 'none':
      return (
        <TerminalMediaPlaceholder
          title={project.title}
          variant={variant}
        />
      )
    default:
      return null
  }
}

export function TerminalPreviewOverlay({ project, mobile = false, onClose }: Props) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const isVideoOnly = project.mediaKind === 'video'

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`${project.title} preview`}
      onClick={onClose}
    >
      <div
        className={`${styles.panel} ${mobile ? styles.panelMobile : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${styles.media} ${isVideoOnly ? styles.mediaVideo : ''}`}>
          <PreviewMedia project={project} mobile={mobile} />
        </div>
        {!mobile ? <span className={styles.closeHint}>Click outside or press Escape to close</span> : null}
      </div>
    </div>
  )
}
