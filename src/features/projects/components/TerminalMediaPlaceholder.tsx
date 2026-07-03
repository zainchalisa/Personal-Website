import styles from './TerminalMediaPlaceholder.module.css'

type Props = {
  title: string
  variant?: 'desktop' | 'mobile'
}

export function TerminalMediaPlaceholder({
  title,
  variant = 'desktop',
}: Props) {
  return (
    <div
      className={`${styles.root} ${variant === 'mobile' ? styles.rootMobile : ''}`}
      role="status"
      aria-label={`${title} showcase coming soon`}
    >
      <div className={styles.frame}>
        <div className={styles.content}>
          <span className={styles.label}>Coming soon</span>
          <span className={styles.sub}>Showcase media in progress</span>
        </div>
      </div>
    </div>
  )
}
