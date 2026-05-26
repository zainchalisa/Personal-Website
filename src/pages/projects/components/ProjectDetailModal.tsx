import { useCallback, useEffect, useState } from 'react'
import { GitHubIcon } from '../../about/components/SocialIcons'
import { preloadProjectMedia } from '../../../lib/preloadProjectAssets'
import { safeHref } from '../../../lib/safeHref'
import type { PortfolioProject } from '../projectTypes'
import { ProjectDescriptionClamp } from './ProjectDescriptionClamp'
import { ProjectCoverPreview } from './ProjectCoverPreview'
import { ProjectPasswordGate } from './ProjectPasswordGate'
import { ProjectReportScroll } from './ProjectReportScroll'
import { ProjectShowcaseSlideshow } from './ProjectShowcaseSlideshow'
import { ProjectVideoPreview } from './ProjectVideoPreview'
import styles from './ProjectDetailModal.module.css'

type Props = {
  project: PortfolioProject
  onClose: () => void
  onProjectResolved?: (project: PortfolioProject) => void
}

function formatDocumentLabel(label: string): string {
  const trimmed = label.trim()
  return trimmed.endsWith('↗') ? trimmed : `${trimmed} ↗`
}

export function ProjectDetailModal({ project, onClose, onProjectResolved }: Props) {
  const [resolved, setResolved] = useState<PortfolioProject | null>(
    project.isPasswordProtected ? null : project,
  )

  useEffect(() => {
    setResolved(project.isPasswordProtected ? null : project)
  }, [project])

  const handleUnlocked = useCallback(
    (unlocked: PortfolioProject) => {
      setResolved(unlocked)
      onProjectResolved?.(unlocked)
    },
    [onProjectResolved],
  )

  const display = resolved ?? project
  const locked = project.isPasswordProtected === true && resolved === null

  const githubHref = safeHref(display.githubUrl)
  const documentHref = safeHref(display.documentUrl)
  const liveHref = safeHref(display.liveSiteUrl)
  const showGithub = githubHref != null
  const showLive = liveHref != null
  const showDocument = documentHref != null && Boolean(display.documentLabel)
  const hasLinks = showGithub || showLive || showDocument
  const slideUrls = display.showcaseSlideUrls
  const hasSlides = Boolean(slideUrls?.length)
  const hasDemoVideo = Boolean(display.demoVideoMp4Url || display.demoVideoWebmUrl)
  const showSlideshow = display.documentViewer === 'slideshow' && hasSlides
  const showScroll = display.documentViewer === 'scroll' && hasSlides

  useEffect(() => {
    if (locked) return
    preloadProjectMedia(display)
  }, [display, locked])

  const hasDocumentViewer = showSlideshow || showScroll

  return (
    <div
      className={`${styles.modal} ${hasDocumentViewer ? styles.modalDocument : ''} ${locked ? styles.modalLocked : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pg-modal-title"
    >
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
        ×
      </button>
      <div className={styles.route}>/{project.slug}</div>

      {locked ? (
        <div className={styles.lockedBody}>
          <h2 id="pg-modal-title" className={styles.title}>
            {project.title}
          </h2>
          <p className={styles.year}>{project.year}</p>
          <ProjectPasswordGate onUnlocked={handleUnlocked} />
        </div>
      ) : (
      <div className={styles.layout}>
        <div className={styles.info}>
          <h2 id="pg-modal-title" className={styles.title}>
            {display.title}
          </h2>
          {display.yearNote ? <p className={styles.yearNote}>{display.yearNote}</p> : null}
          <p className={styles.year}>{display.year}</p>

          <p className={styles.tagsLabel}>stack</p>
          <div className={styles.tags}>
            {display.tags.map((t, index) => (
              <span
                key={t}
                className={styles.tag}
                style={{ '--tag-index': index } as React.CSSProperties}
              >
                {t}
              </span>
            ))}
          </div>

          <ProjectDescriptionClamp text={display.shortDescription} />

          {display.longDescription ? (
            <p className={styles.descriptionLong}>{display.longDescription}</p>
          ) : null}

          {hasLinks ? (
            <div className={styles.links}>
              {showGithub ? (
                <a
                  className={styles.link}
                  href={githubHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>github</span>
                  <GitHubIcon className={styles.linkIcon} />
                </a>
              ) : null}
              {showDocument ? (
                <a
                  className={styles.link}
                  href={documentHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {formatDocumentLabel(display.documentLabel!)}
                </a>
              ) : null}
              {showLive ? (
                <a
                  className={styles.link}
                  href={liveHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  live site ↗
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className={styles.media}>
          {showSlideshow ? (
            <ProjectShowcaseSlideshow
              projectSlug={project.slug}
              slideUrls={slideUrls!}
              title={display.title}
              placeholderUrl={display.coverImageUrl}
            />
          ) : showScroll ? (
            <ProjectReportScroll
              projectSlug={project.slug}
              pageUrls={slideUrls!}
              title={display.title}
              placeholderUrl={display.coverImageUrl}
            />
          ) : hasDemoVideo ? (
            <ProjectVideoPreview
              projectSlug={project.slug}
              title={display.title}
              mp4Url={display.demoVideoMp4Url}
              webmUrl={display.demoVideoWebmUrl}
              posterUrl={display.demoVideoPosterUrl}
              playbackRate={display.demoVideoPlaybackRate}
            />
          ) : (
            <ProjectCoverPreview coverImageUrl={display.coverImageUrl} title={display.title} />
          )}
        </div>
      </div>
      )}

      <p className={styles.dismiss}>press C to close</p>
    </div>
  )
}
