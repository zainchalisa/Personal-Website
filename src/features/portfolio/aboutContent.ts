import type { PortfolioClip } from './types'
import { TIMELINE_IMAGES } from './timelineAssets'

export type AboutView = 'overview' | 'movies' | 'music' | 'places'

export {
  ABOUT_META_DESCRIPTION,
  ABOUT_OVERVIEW_BODY_MOBILE,
  ABOUT_OVERVIEW_HEADLINE,
  ABOUT_OVERVIEW_PARAGRAPHS,
  ABOUT_OVERVIEW_SUBLINE,
} from './aboutOverviewCopy'

export const ABOUT_OVERVIEW_CLIP: PortfolioClip = {
  id: 'overview',
  name: 'About',
  date: 'Now',
  dateRange: 'Present',
  year: '2026',
  w: 96,
  bg: '#141414',
  stripe: '#7070cc',
  cat: 'ABOUT',
  catC: '#7070cc',
  title: "Hi, I'm Zain.",
  desc: 'Software engineer based in NYC.',
  tags: ['NYC'],
  filter: 'all',
  v: 'default',
  imageUrl: TIMELINE_IMAGES.babyMe,
}
