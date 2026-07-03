type PortfolioProject = {
  slug: string
  title: string
  year: number
  yearNote?: string
  projectType: string
  status: 'built' | 'concept'
  tags: readonly string[]
  shortDescription: string
  coverImageUrl: string | null
  documentUrl: string | null
  documentLabel: string | null
  showcaseSlideUrls?: readonly string[]
  demoVideoMp4Url?: string
  demoVideoWebmUrl?: string
  demoVideoPosterUrl?: string
  demoVideoPlaybackRate?: number
  githubUrl: string | null
  liveSiteUrl: string | null
}

type TerminalMediaKind =
  | 'slideshow-manual'
  | 'slideshow-auto'
  | 'video'
  | 'scroll-pdf'
  | 'none'

export type TerminalProject = PortfolioProject & {
  terminalIcon: string
  terminalOneLiner: string
  terminalStack: string
  detailOneLiner: string
  accentColor: string
  terminalExtra?: string
  aliases: readonly string[]
  mediaKind: TerminalMediaKind
  /** Filename shown for inline PDF download link (e.g. sync-showcase.pdf). */
  pdfFilename?: string
}
