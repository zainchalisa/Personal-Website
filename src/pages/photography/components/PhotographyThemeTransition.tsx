import { useEffect, useRef } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import { THEME_TRANSITION_MS } from '../../../hooks/themeTransition'
import styles from './PhotographyThemeTransition.module.css'

type PhotographyThemeTransitionProps = {
  active?: boolean
}

export function PhotographyThemeTransition({
  active = true,
}: PhotographyThemeTransitionProps) {
  const { themeTransition } = useTheme()
  const runIdRef = useRef(0)

  useEffect(() => {
    if (themeTransition?.active) {
      runIdRef.current += 1
    }
  }, [themeTransition?.active, themeTransition?.from, themeTransition?.to])

  if (!active || !themeTransition?.active) return null

  const toDark = themeTransition.to === 'dark'

  return (
    <div
      key={runIdRef.current}
      className={`${styles.trans} ${toDark ? styles.toDark : styles.toLight}`}
      style={{ ['--photo-trans-ms' as string]: `${THEME_TRANSITION_MS}ms` }}
      aria-hidden
    >
      <div className={`${styles.layer} ${styles.dim}`} />
      {toDark ? <div className={`${styles.layer} ${styles.flicker}`} /> : null}
      {toDark ? <div className={styles.lampSpark} /> : null}
      <div className={styles.lampPool} />
      {!toDark ? <div className={`${styles.layer} ${styles.daylight}`} /> : null}
    </div>
  )
}
