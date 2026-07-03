import styles from './AboutContentTabs.module.css'

type AboutPosterCardProps = {
  imageUrl: string
  imageAlt: string
  title: string
  subtitle?: string
  noteLead?: string
  note: string
  aspect: 'portrait' | 'square' | 'landscape'
  hideDescription?: boolean
  onSelect?: () => void
}

function noteParts(noteLead: string | undefined, note: string) {
  if (noteLead) {
    return { lead: noteLead, rest: note }
  }

  const split = note.match(/^(.+?[.!?])\s+(.+)$/s)
  if (split) {
    return { lead: split[1], rest: split[2] }
  }

  const words = note.split(' ')
  if (words.length <= 4) {
    return { lead: note, rest: '' }
  }

  return {
    lead: words.slice(0, 3).join(' '),
    rest: words.slice(3).join(' '),
  }
}

export function AboutPosterCard({
  imageUrl,
  imageAlt,
  title,
  subtitle,
  noteLead,
  note,
  aspect,
  hideDescription = false,
  onSelect,
}: AboutPosterCardProps) {
  const { lead, rest } = noteParts(noteLead, note)

  const artClass =
    aspect === 'portrait'
      ? styles.cardArtPortrait
      : aspect === 'square'
        ? styles.cardArtSquare
        : styles.cardArtLandscape

  return (
    <article
      className={`${styles.posterCard}${onSelect ? ` ${styles.posterCardInteractive}` : ''}`}
      tabIndex={onSelect ? 0 : undefined}
      role={onSelect ? 'button' : undefined}
      onClick={onSelect}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect()
              }
            }
          : undefined
      }
    >
      <div className={styles.posterFrame}>
        {imageUrl ? (
          <img
            className={`${styles.cardArt} ${artClass}`}
            src={imageUrl}
            alt={imageAlt}
            loading="eager"
            draggable={false}
          />
        ) : (
          <div className={`${styles.cardArt} ${artClass}`} aria-hidden />
        )}
      </div>
      <div className={styles.cardMeta}>
        <p className={styles.cardTitle}>{title}</p>
        {subtitle ? <p className={styles.cardArtist}>{subtitle}</p> : null}
        {hideDescription ? null : (
          <p className={styles.cardNote}>
            <span className={styles.noteLead}>{lead}</span>
            {rest ? ` ${rest}` : null}
          </p>
        )}
      </div>
    </article>
  )
}
