import { useLayoutEffect, useRef, useState } from 'react'
import styles from './ProjectDescriptionClamp.module.css'

type Props = {
  text: string
  className?: string
}

export function ProjectDescriptionClamp({ text, className }: Props) {
  const textRef = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [canExpand, setCanExpand] = useState(false)

  useLayoutEffect(() => {
    setExpanded(false)
    setCanExpand(false)
  }, [text])

  useLayoutEffect(() => {
    if (expanded) return

    const el = textRef.current
    if (!el) return

    const measure = () => {
      setCanExpand(el.scrollHeight > el.clientHeight + 1)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text, expanded])

  const showFade = canExpand && !expanded

  return (
    <div className={`${styles.block} ${className ?? ''}`}>
      <div className={styles.wrap}>
        <p
          ref={textRef}
          className={`${styles.text} ${showFade ? styles.textClamped : ''} ${expanded ? styles.textExpanded : ''}`}
        >
          {text}
        </p>
        {showFade ? <div className={styles.fade} aria-hidden /> : null}
      </div>
      {canExpand ? (
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
        >
          {expanded ? 'read less' : 'read more'}
        </button>
      ) : null}
    </div>
  )
}
