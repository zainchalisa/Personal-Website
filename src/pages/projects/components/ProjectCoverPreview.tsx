import { useState } from 'react'
import { safeHref } from '../../../lib/safeHref'
import styles from './ProjectCoverPreview.module.css'

type Props = {
  coverImageUrl: string | null
  title: string
}

export function ProjectCoverPreview({ coverImageUrl, title }: Props) {
  const [failed, setFailed] = useState(false)

  const safeCover = safeHref(coverImageUrl)

  if (!safeCover || failed) {
    return (
      <div className={styles.placeholder}>
        <span className={styles.placeholderText}>coming soon</span>
      </div>
    )
  }

  return (
    <div className={styles.frame}>
      <img
        className={styles.image}
        src={safeCover}
        alt={`${title} preview`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
