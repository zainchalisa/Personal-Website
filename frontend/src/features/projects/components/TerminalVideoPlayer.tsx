import { useCallback, useEffect, useRef, useState } from 'react'
import { safeHref } from '@/lib/safeHref'
import styles from './TerminalVideoPlayer.module.css'

type Props = {
  title: string
  mp4Url?: string | null
  webmUrl?: string | null
  posterUrl?: string | null
  playbackRate?: number
  allowPause?: boolean
}

export function TerminalVideoPlayer({
  title,
  mp4Url,
  webmUrl,
  posterUrl,
  playbackRate = 1,
  allowPause = true,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(true)
  const safeMp4 = safeHref(mp4Url)
  const safeWebm = safeHref(webmUrl)
  const safePoster = safeHref(posterUrl)
  const hasVideo = Boolean(safeMp4 || safeWebm)

  const applyRate = useCallback(() => {
    const video = videoRef.current
    if (video) video.playbackRate = playbackRate
  }, [playbackRate])

  useEffect(() => {
    applyRate()
  }, [applyRate, safeMp4, safeWebm])

  useEffect(() => {
    if (!allowPause) return
    const video = videoRef.current
    if (!video) return
    if (playing) {
      void video.play().catch(() => setPlaying(false))
    } else {
      video.pause()
    }
  }, [playing, allowPause, safeMp4, safeWebm])

  useEffect(() => {
    if (allowPause) return
    const video = videoRef.current
    if (!video) return

    const keepPlaying = () => {
      if (video.paused) void video.play().catch(() => {})
    }

    video.addEventListener('pause', keepPlaying)
    void video.play().catch(() => {})

    return () => video.removeEventListener('pause', keepPlaying)
  }, [allowPause, safeMp4, safeWebm])

  const toggle = () => setPlaying((p) => !p)

  if (!hasVideo) {
    return (
      <div className={styles.placeholder}>
        <span>Demo video coming soon</span>
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
        onLoadedMetadata={applyRate}
        onPlay={() => {
          if (allowPause) setPlaying(true)
        }}
        onPause={() => {
          if (allowPause) setPlaying(false)
        }}
      >
        {safeWebm ? <source src={safeWebm} type="video/webm" /> : null}
        {safeMp4 ? <source src={safeMp4} type="video/mp4" /> : null}
      </video>
      {allowPause ? (
        <button
          type="button"
          className={styles.overlay}
          onClick={toggle}
          aria-label={playing ? 'Pause video' : 'Play video'}
        >
          <span className={styles.playIcon} aria-hidden>
            {playing ? '⏸' : '▶'}
          </span>
        </button>
      ) : null}
    </div>
  )
}
