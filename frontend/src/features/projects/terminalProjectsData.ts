import { assetUrl } from '@/lib/assetUrl'
import type { TerminalProject } from './terminalProjectTypes'
import { PROJECT_ACCENT_COLORS } from './terminalProjectMeta'

const SYNC_SLIDE_COUNT = 21
const CNN_REPORT_PAGE_COUNT = 7
const PHOTON_SLIDE_COUNT = 3

function projectSlideUrls(pathPrefix: string, count: number): readonly string[] {
  return Array.from({ length: count }, (_, i) =>
    assetUrl(`${pathPrefix}/slide-${String(i + 1).padStart(2, '0')}.webp`),
  )
}

export const TERMINAL_PROJECTS: readonly TerminalProject[] = [
  {
    slug: 'photon',
    title: 'Photon',
    terminalIcon: '⚡',
    terminalOneLiner: 'Local-first Mac photo search',
    terminalStack: 'SwiftUI · Python · FastAPI · CLIP',
    detailOneLiner:
      'Local-first Mac app that finds your photos through natural language search — entirely on-device.',
    accentColor: PROJECT_ACCENT_COLORS.photon!,
    aliases: ['photon'],
    year: 2026,
    projectType: 'macOS App',
    status: 'built',
    tags: ['SwiftUI', 'Python', 'FastAPI', 'CLIP'],
    shortDescription:
      'Local-first Mac app that finds your photos through natural language search — entirely on-device.',
    coverImageUrl: assetUrl('/projects/photon/slides/slide-01.webp'),
    documentUrl: null,
    documentLabel: null,
    mediaKind: 'slideshow-manual',
    showcaseSlideUrls: projectSlideUrls('/projects/photon/slides', PHOTON_SLIDE_COUNT),
    githubUrl: 'https://github.com/zainchalisa/Photon',
    liveSiteUrl: 'https://zainchalisa.com/photon',
  },
  {
    slug: 'sync',
    title: 'SYNC',
    terminalIcon: '♪',
    terminalOneLiner: 'Social music discovery platform',
    terminalStack: 'Product Design · User Research',
    detailOneLiner:
      'A social music platform built around shared taste, music profiles, and location-based discovery.',
    accentColor: PROJECT_ACCENT_COLORS.sync!,
    aliases: ['sync'],
    year: 2022,
    yearNote: 'Rutgers Blueprint Fellowship',
    projectType: 'Product Showcase',
    status: 'concept',
    tags: ['Product Design', 'User Research'],
    shortDescription:
      'A social music platform built around shared taste, music profiles, and location-based discovery.',
    coverImageUrl: assetUrl('/projects/sync/cover.webp'),
    documentUrl: assetUrl('/projects/sync/sync-showcase.pdf'),
    documentLabel: 'Download PDF',
    pdfFilename: 'sync-showcase.pdf',
    mediaKind: 'slideshow-auto',
    showcaseSlideUrls: projectSlideUrls('/projects/sync/slides', SYNC_SLIDE_COUNT),
    githubUrl: null,
    liveSiteUrl: null,
  },
  {
    slug: 'rutgers-cafe',
    title: 'RU Cafe',
    terminalIcon: '☕',
    terminalOneLiner: 'Android coffee & donut ordering app',
    terminalStack: 'Java · Android SDK · Material Design',
    detailOneLiner:
      'Android app for customizing and ordering coffee and donuts, with cart and order management.',
    accentColor: PROJECT_ACCENT_COLORS['rutgers-cafe']!,
    aliases: ['ru cafe', 'rucafe', 'rutgers-cafe', 'ru-cafe'],
    year: 2023,
    projectType: 'Android App',
    status: 'built',
    tags: ['Java', 'Android SDK', 'AndroidX', 'Material Design'],
    shortDescription:
      'Android app for customizing and ordering coffee and donuts, with cart and order management.',
    coverImageUrl: assetUrl('/projects/rutgers-cafe/poster.webp'),
    documentUrl: null,
    documentLabel: null,
    mediaKind: 'video',
    demoVideoMp4Url: assetUrl('/projects/rutgers-cafe/demo.mp4'),
    demoVideoWebmUrl: assetUrl('/projects/rutgers-cafe/demo.webm'),
    demoVideoPosterUrl: assetUrl('/projects/rutgers-cafe/poster.webp'),
    demoVideoPlaybackRate: 1.5,
    githubUrl: 'https://github.com/zainchalisa/RUCafe',
    liveSiteUrl: null,
  },
  {
    slug: 'classification-neural-networks',
    title: 'Classification Neural Networks',
    terminalIcon: '🧠',
    terminalOneLiner: 'Perceptron & NN image classifiers',
    terminalStack: 'Python · NumPy · ML',
    detailOneLiner:
      'Perceptron and neural network models benchmarked on face and digit image classification.',
    accentColor: PROJECT_ACCENT_COLORS['classification-neural-networks']!,
    aliases: [
      'classification neural networks',
      'classification-neural-networks',
      'cnn',
      'classification',
    ],
    year: 2024,
    projectType: 'Machine Learning',
    status: 'built',
    tags: ['Python', 'NumPy', 'Machine Learning'],
    shortDescription:
      'Perceptron and neural network models benchmarked on face and digit image classification.',
    coverImageUrl: assetUrl('/projects/classification-neural-networks/slides/slide-01.webp'),
    documentUrl: assetUrl('/projects/classification-neural-networks/report.pdf'),
    documentLabel: 'Download PDF',
    mediaKind: 'scroll-pdf',
    showcaseSlideUrls: projectSlideUrls(
      '/projects/classification-neural-networks/slides',
      CNN_REPORT_PAGE_COUNT,
    ),
    githubUrl: 'https://github.com/zainchalisa/Classification-Neural-Networks',
    liveSiteUrl: null,
  },
  {
    slug: 'tripdog',
    title: 'TripDog',
    terminalIcon: '✈️🐶',
    terminalOneLiner: 'AI travel agent, pre-planning layer',
    terminalStack: 'React Native Expo · FastAPI · Gemini',
    detailOneLiner:
      'AI travel agent that handles the pre-planning layer — before you open a single tab.',
    accentColor: PROJECT_ACCENT_COLORS.tripdog!,
    aliases: ['tripdog', 'trip dog', 'trip-dog'],
    year: 2026,
    projectType: 'Mobile App',
    status: 'concept',
    tags: ['React Native Expo', 'FastAPI', 'Google Gemini'],
    shortDescription:
      'AI travel agent that handles the pre-planning layer — before you open a single tab.',
    coverImageUrl: null,
    documentUrl: null,
    documentLabel: null,
    mediaKind: 'none',
    githubUrl: null,
    liveSiteUrl: null,
  },
]
