import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { safeHref } from '@/lib/safeHref'
import styles from './TerminalReportViewer.module.css'

type Props = {
  pageUrls: readonly string[]
  title: string
  pdfUrl?: string | null
  downloadLabel?: string
}

export function TerminalReportViewer({ pageUrls, title, pdfUrl, downloadLabel = 'Download PDF' }: Props) {
  const safePageUrls = useMemo(
    () => pageUrls.map((url) => safeHref(url)).filter((url): url is string => url != null),
    [pageUrls],
  )
  const safePdf = safeHref(pdfUrl)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLImageElement | null)[]>([])
  const rafRef = useRef<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const updatePageFromScroll = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller || safePageUrls.length === 0) return

    const scrollerRect = scroller.getBoundingClientRect()
    const probeY = scrollerRect.top + scrollerRect.height * 0.4

    let best = 0
    let bestDist = Infinity

    pageRefs.current.forEach((el, i) => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.height <= 0) return
      const pageMid = rect.top + rect.height / 2
      const dist = Math.abs(pageMid - probeY)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })

    const nextPage = best + 1
    setCurrentPage((prev) => (prev === nextPage ? prev : nextPage))
  }, [safePageUrls.length])

  const schedulePageUpdate = useCallback(() => {
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      updatePageFromScroll()
    })
  }, [updatePageFromScroll])

  useEffect(() => {
    setCurrentPage(1)
    pageRefs.current = []
  }, [safePageUrls])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    scroller.addEventListener('scroll', schedulePageUpdate, { passive: true })
    schedulePageUpdate()

    const resizeObserver = new ResizeObserver(() => {
      schedulePageUpdate()
    })
    resizeObserver.observe(scroller)

    return () => {
      scroller.removeEventListener('scroll', schedulePageUpdate)
      resizeObserver.disconnect()
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [safePageUrls, schedulePageUpdate])

  if (safePageUrls.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No report pages</p>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.scrollerWrap}>
        <div ref={scrollerRef} className={styles.scroller} tabIndex={0} aria-label={`${title} report`}>
          {safePageUrls.map((src, index) => (
            <img
              key={src}
              ref={(el) => {
                pageRefs.current[index] = el
              }}
              className={styles.page}
              src={src}
              alt={`${title} report page ${index + 1} of ${safePageUrls.length}`}
              loading="eager"
              decoding={index === 0 ? 'sync' : 'async'}
              draggable={false}
              onLoad={schedulePageUpdate}
            />
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.pageCounter}>
          Page {currentPage} of {safePageUrls.length}
        </span>
        {safePdf ? (
          <a className={styles.downloadBtn} href={safePdf} download target="_blank" rel="noopener noreferrer">
            {downloadLabel}
          </a>
        ) : null}
      </div>
    </div>
  )
}
