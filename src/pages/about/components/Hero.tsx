import type { PageId } from '../../../types'
import type { Theme } from '../../../hooks/useTheme'
import { HeroCard } from './HeroCard'
import { HeroLeft } from './HeroLeft'
import styles from './Hero.module.css'

type HeroProps = {
  onNavigate: (page: PageId) => void
  theme: Theme
}

export function Hero({ onNavigate, theme }: HeroProps) {
  return (
    <section className={styles.hero}>
      <HeroLeft onNavigate={onNavigate} />
      <div className={`${styles.heroCardWrap} ${styles.heroEnter} ${styles.heroEnterCard}`}>
        <HeroCard theme={theme} />
      </div>
    </section>
  )
}
