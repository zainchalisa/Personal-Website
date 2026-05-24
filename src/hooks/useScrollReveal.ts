import { useEffect, useState, type RefObject } from 'react'

type ScrollRevealOptions = {
  threshold?: number
}

export function useScrollReveal(
  ref: RefObject<HTMLElement | null>,
  options: ScrollRevealOptions = {},
) {
  const [isVisible, setIsVisible] = useState(false)
  const threshold = options.threshold ?? 0.08

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, threshold])

  return isVisible
}
