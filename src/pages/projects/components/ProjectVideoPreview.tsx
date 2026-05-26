import { useCallback, useEffect, useRef } from 'react'
import { safeHref } from '../../../lib/safeHref'
import { readVideoTime, writeVideoTime } from '../../../lib/projectMediaSession'
import styles from './ProjectVideoPreview.module.css'

type Props = {
  projectSlug: string
  title: string
  mp4Url?: string | null
  webmUrl?: string | null
  posterUrl?: string | null
  playbackRate?: number
}

export function ProjectVideoPreview({
  projectSlug,
  title,
  mp4Url,
  webmUrl,
  posterUrl,
  playbackRate = 1,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const safeMp4 = safeHref(mp4Url)
  const safeWebm = safeHref(webmUrl)
  const safePoster = safeHref(posterUrl)
  const hasVideo = Boolean(safeMp4 || safeWebm)

  const applyPlaybackRate = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = playbackRate
  }, [playbackRate])

  const restoreTime = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = playbackRate
    const saved = readVideoTime(projectSlug)
    if (saved == null || saved <= 0) return
    const duration = video.duration
    if (Number.isFinite(duration) && duration > 0) {
      video.currentTime = Math.min(saved, duration - 0.05)
    } else {
      video.currentTime = saved
    }
  }, [projectSlug, playbackRate])

  useEffect(() => {
    applyPlaybackRate()
  }, [applyPlaybackRate, safeMp4, safeWebm])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onTimeUpdate = () => {
      if (video.currentTime > 0) {
        writeVideoTime(projectSlug, video.currentTime)
      }
    }

    video.addEventListener('timeupdate', onTimeUpdate)
    return () => video.removeEventListener('timeupdate', onTimeUpdate)
  }, [projectSlug, safeMp4, safeWebm])

  if (!hasVideo) {
    return (
      <div className={styles.placeholder}>
        <span className={styles.placeholderText}>coming soon</span>
      </div>
    )
  }

  return (
    <div className={styles.frame}>
      <video
        ref={videoRef}
        className={styles.video}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster={safePoster}
        aria-label={`${title} demo video`}
        onLoadedMetadata={restoreTime}
      >
        {safeWebm ? <source src={safeWebm} type="video/webm" /> : null}
        {safeMp4 ? <source src={safeMp4} type="video/mp4" /> : null}
      </video>
    </div>
  )
}
