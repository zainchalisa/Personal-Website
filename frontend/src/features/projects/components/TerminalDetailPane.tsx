import { IconBrandGithub, IconExternalLink } from '@tabler/icons-react'
import { safeHref } from '@/lib/safeHref'
import { getProjectDetailPath } from '../terminalProjectMeta'
import type { TerminalProject } from '../terminalProjectTypes'
import { SyncAutoSlideshow } from './SyncAutoSlideshow'
import { TerminalReportViewer } from './TerminalReportViewer'
import { TerminalSlideshow } from './TerminalSlideshow'
import { TerminalMediaPlaceholder } from './TerminalMediaPlaceholder'
import { TerminalVideoPlayer } from './TerminalVideoPlayer'
import styles from './TerminalDetailPane.module.css'

type Props = {
  project: TerminalProject
  variant?: 'desktop' | 'mobile'
  onClose: () => void
}

function ProjectMedia({
  project,
  variant = 'desktop',
}: {
  project: TerminalProject
  variant?: 'desktop' | 'mobile'
}) {
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
          downloadLabel={project.documentLabel ?? 'Download PDF'}
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

export function TerminalDetailPane({ project, variant = 'desktop', onClose }: Props) {
  const githubHref = safeHref(project.githubUrl)
  const liveHref = safeHref(project.liveSiteUrl)
  const pdfHref = safeHref(project.documentUrl)
  const showPdfLink = pdfHref != null && project.pdfFilename != null
  const hasLinkChips = Boolean(liveHref || githubHref)

  const rootClass = variant === 'mobile' ? styles.mobileRoot : styles.root

  return (
    <div className={rootClass}>
      {variant !== 'mobile' ? (
        <div className={styles.topBar}>
          <span className={styles.topBarPath}>{getProjectDetailPath(project.slug)}</span>
          <button type="button" className={styles.topBarClose} onClick={onClose} aria-label="Close project">
            ✕
          </button>
        </div>
      ) : null}

      <div className={styles.body} data-mobile-detail-scroll>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{project.title}</h2>
            <span
              className={`${styles.badge} ${
                project.status === 'concept' ? styles.badgeConcept : styles.badgeBuilt
              }`}
            >
              ● {project.status}
            </span>
          </div>

          <p className={styles.description}>{project.detailOneLiner}</p>

          <div className={styles.metaRow}>
            <div className={styles.tagsRow}>
              {project.tags.map((tag) => (
                <span key={tag} className={styles.pill}>
                  {tag}
                </span>
              ))}
            </div>
            {showPdfLink ? (
              <a
                className={styles.pdfLink}
                href={pdfHref!}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                ↓ {project.pdfFilename}
              </a>
            ) : null}
          </div>

          {hasLinkChips ? (
            <div className={styles.linksRow}>
              {liveHref ? (
                <a className={styles.linkChip} href={liveHref} target="_blank" rel="noopener noreferrer">
                  <IconExternalLink size={13} stroke={1.75} aria-hidden />
                  <span>{liveHref.replace(/^https?:\/\//, '')}</span>
                </a>
              ) : null}
              {githubHref ? (
                <a className={styles.linkChip} href={githubHref} target="_blank" rel="noopener noreferrer">
                  <IconBrandGithub size={13} stroke={1.75} aria-hidden />
                  <span>GitHub</span>
                </a>
              ) : null}
            </div>
          ) : null}
        </header>

        <div className={styles.media}>
          <ProjectMedia project={project} variant={variant} />
        </div>
      </div>
    </div>
  )
}
