import type { AboutView } from '../aboutContent'
import desktopStyles from '../PortfolioPage.module.css'
import mobileStyles from './AboutMobileApp.module.css'

const TABS: { id: AboutView; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'movies', label: 'Movies' },
  { id: 'music', label: 'Music' },
  { id: 'places', label: 'Places' },
]

type AboutViewTabsProps = {
  activeView: AboutView
  onViewChange: (view: AboutView) => void
  variant: 'desktop' | 'mobile'
}

export function AboutViewTabs({ activeView, onViewChange, variant }: AboutViewTabsProps) {
  const styles = variant === 'desktop' ? desktopStyles : mobileStyles
  const tabClass = variant === 'desktop' ? styles.fb : styles.aboutTab
  const activeClass = variant === 'desktop' ? styles.fbOn : styles.aboutTabActive
  const barClass = variant === 'desktop' ? styles.tlTabBar : styles.aboutTabBar

  return (
    <div className={barClass} role="tablist" aria-label="About views">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeView === id}
          className={`${tabClass}${activeView === id ? ` ${activeClass}` : ''}`}
          onClick={() => onViewChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
