import { assetUrl } from '../../lib/assetUrl'
import type { PortfolioProject } from './projectTypes'

const SYNC_SLIDE_COUNT = 21
const CNN_REPORT_PAGE_COUNT = 7
const PHOTON_SLIDE_COUNT = 3

function projectSlideUrls(pathPrefix: string, count: number): readonly string[] {
  return Array.from({ length: count }, (_, i) =>
    assetUrl(`${pathPrefix}/slide-${String(i + 1).padStart(2, '0')}.webp`),
  )
}

export const PROJECTS: readonly PortfolioProject[] = [
  {
    slug: 'photon',
    title: 'Photon',
    year: 2026,
    projectType: 'macOS App',
    status: 'built',
    tags: ['swiftui', 'python', 'fastapi', 'clip'],
    shortDescription:
      'Photon is a local-first Mac app that transforms the way users rediscover their photos. Rather than searching through folders or relying on dates and filenames, users can type what they remember about a moment and instantly find related images from their library. With natural-language search, people and collection browsing, photo detail views, and entirely on-device processing, Photon makes revisiting personal memories faster, more intuitive, and private.',
    coverImageUrl: assetUrl('/projects/photon/slides/slide-01.webp'),
    documentUrl: null,
    documentLabel: null,
    documentViewer: 'slideshow',
    showcaseSlideUrls: projectSlideUrls('/projects/photon/slides', PHOTON_SLIDE_COUNT),
    githubUrl: 'https://github.com/zainchalisa',
    liveSiteUrl: 'https://zainchalisa.com/photon',
  },
  {
    slug: 'sync',
    title: 'SYNC',
    year: 2022,
    yearNote: 'Rutgers Blueprint Fellowship',
    projectType: 'Product Showcase',
    status: 'concept',
    tags: ['product design', 'user research'],
    shortDescription:
      'SYNC is a social music platform that helps listeners discover new music and connect through shared taste. Rather than streaming alone, it lets users build music-focused profiles, join discussion spaces, share what they are listening to, and explore music playing nearby through location-based features. Designed for avid listeners and emerging artists, SYNC makes music discovery more social while strengthening ties between artists and their communities.',
    coverImageUrl: assetUrl('/projects/sync/cover.webp'),
    documentUrl: assetUrl('/projects/sync/sync-showcase.pdf'),
    documentLabel: 'open pdf',
    documentViewer: 'slideshow',
    showcaseSlideUrls: projectSlideUrls('/projects/sync/slides', SYNC_SLIDE_COUNT),
    githubUrl: null,
    liveSiteUrl: null,
  },
  {
    slug: 'rutgers-cafe',
    title: 'RU Cafe',
    year: 2023,
    projectType: 'Android App',
    status: 'built',
    tags: ['java', 'android sdk', 'androidx', 'material design'],
    shortDescription:
      'Rutgers Cafe is an Android ordering application built in Java that recreates the experience of ordering from a coffee and donut shop. Users can customize coffee drinks by size and add-ons, choose from multiple donut varieties and flavors, manage items in their cart, and review order totals before submitting their purchase. The app also supports viewing and managing placed store orders, bringing together product customization, cart functionality, and order tracking in a multi-screen mobile interface.',
    coverImageUrl: assetUrl('/projects/rutgers-cafe/poster.webp'),
    documentUrl: null,
    documentLabel: null,
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
    year: 2024,
    projectType: 'Machine Learning Project',
    status: 'built',
    tags: ['python', 'machine learning'],
    shortDescription:
      'Classification Neural Networks is a Python machine learning project that implements and compares perceptron and neural network models for classifying faces and handwritten digits from image data. The project evaluates how training data size impacts each model’s accuracy and runtime, while exploring optimization techniques such as NumPy-based computation.',
    coverImageUrl: assetUrl('/projects/classification-neural-networks/cover.webp'),
    documentUrl: assetUrl('/projects/classification-neural-networks/report.pdf'),
    documentLabel: 'open pdf',
    documentViewer: 'scroll',
    showcaseSlideUrls: projectSlideUrls(
      '/projects/classification-neural-networks/slides',
      CNN_REPORT_PAGE_COUNT,
    ),
    githubUrl: 'https://github.com/zainchalisa/Classification-Neural-Networks',
    liveSiteUrl: null,
  },
  {
    slug: 'super-secret-project',
    title: '✈️🐶',
    year: 2026,
    projectType: 'Mobile App',
    status: 'built',
    tags: [],
    shortDescription: 'This project is password protected.',
    coverImageUrl: null,
    documentUrl: null,
    documentLabel: null,
    githubUrl: null,
    liveSiteUrl: null,
    isPasswordProtected: true,
  },
]
