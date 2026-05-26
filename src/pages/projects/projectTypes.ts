type ProjectStatus = 'concept' | 'built' | 'research'

/** How the modal presents document pages from showcaseSlideUrls. */
type ProjectDocumentViewer = 'slideshow' | 'scroll'

export type PortfolioProject = {
  slug: string
  title: string
  /** Calendar year the project was created. */
  year: number
  /** Optional note shown inline after the year (e.g. fellowship or program). */
  yearNote?: string
  projectType: string
  status: ProjectStatus
  tags: readonly string[]
  shortDescription: string
  longDescription?: string
  coverImageUrl: string | null
  documentUrl: string | null
  documentLabel: string | null
  /** When set with showcaseSlideUrls, enables in-modal document viewing (slideshow or scroll). */
  documentViewer?: ProjectDocumentViewer
  /** Remote page images (e.g. slide-01.webp …) for documentViewer. */
  showcaseSlideUrls?: readonly string[]
  /** Optional demo video shown in the project media panel (autoplay + loop). */
  demoVideoMp4Url?: string | null
  /** Optional WebM source for better compression/compatibility fallback. */
  demoVideoWebmUrl?: string | null
  /** Optional poster image shown before video frame is ready. */
  demoVideoPosterUrl?: string | null
  /** Playback speed for demo video (default 1). */
  demoVideoPlaybackRate?: number
  githubUrl: string | null
  liveSiteUrl: string | null
  /** When true, full project data is fetched from the server after password unlock. */
  isPasswordProtected?: boolean
}
