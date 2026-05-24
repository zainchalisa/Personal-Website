import { useRef, type CSSProperties, type ReactNode } from 'react'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import styles from './ScrollReveal.module.css'

type ScrollRevealProps = {
  children: ReactNode
  className?: string
  delay?: string
}

export function ScrollReveal({ children, className = '', delay }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useScrollReveal(ref)

  const style: CSSProperties | undefined = delay
    ? ({ '--reveal-delay': delay } as CSSProperties)
    : undefined

  return (
    <div ref={ref} className={`${styles.reveal} ${isVisible ? styles.visible : ''} ${className}`} style={style}>
      {children}
    </div>
  )
}
