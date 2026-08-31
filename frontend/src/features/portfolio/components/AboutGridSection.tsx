import type { ReactNode } from 'react'
import styles from './AboutContentTabs.module.css'

type AboutGridSectionProps = {
  label: string
  subtitle?: string
  belowLabel?: ReactNode
  gridClassName: string
  children: ReactNode
}

export function AboutGridSection({
  label,
  subtitle,
  belowLabel,
  gridClassName,
  children,
}: AboutGridSectionProps) {
  return (
    <div className={styles.gridStage}>
      <div className={styles.gridColumn}>
        <div className={styles.sectionPill}>
          <span>{label}</span>
          {subtitle ? <span className={styles.sectionPillSubtitle}>{subtitle}</span> : null}
        </div>
        {belowLabel}
        <div className={`${styles.grid} ${gridClassName}`}>{children}</div>
      </div>
    </div>
  )
}
