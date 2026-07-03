type ClipFilter = 'all' | 'project' | 'photography'

type VisualType =
  | 'born'
  | 'default'
  | 'photos'
  | 'rutgers'
  | 'grad'
  | 'pwc'
  | 'photon'
  | 'tripdog'
  | 'senior'

export interface PortfolioClip {
  id: string
  name: string
  date: string
  dateRange: string
  year: string
  w: number
  bg: string
  stripe: string
  cat: string
  catC: string
  title: string
  desc: string
  tags: string[]
  filter: ClipFilter
  v: VisualType
  imageUrl?: string
  note?: string
}
