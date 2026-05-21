import { useEffect, useState } from 'react'
import styles from './PhotonPage.module.css'

const SEARCH_DEMOS = [
  { query: 'Zain in 2005', count: 4 },
  { query: 'that sunset by the Golden Gate Bridge', count: 6 },
  { query: "mom's birthday", count: 1 },
  { query: 'snowboarding in Vermont', count: 5 },
  { query: 'Arwa\'s wedding photos on the dance floor', count: 3 },
] as const

const THUMB_GRADIENTS = [
  'linear-gradient(145deg, #2e2a24 0%, #3a342c 100%)',
  'linear-gradient(145deg, #3a4a5c 0%, #2a3540 100%)',
  'linear-gradient(145deg, #4a3d32 0%, #2e2620 100%)',
  'linear-gradient(145deg, #354035 0%, #242a24 100%)',
  'linear-gradient(145deg, #4a3a4a 0%, #2e242e 100%)',
  'linear-gradient(145deg, #3a4a4a 0%, #242e2e 100%)',
] as const

const LONGEST_QUERY = SEARCH_DEMOS.map((d) => d.query).reduce(
  (longest, query) => (query.length > longest.length ? query : longest),
  SEARCH_DEMOS[0].query,
)

const TYPE_MS = 58
const BACKSPACE_MS = 40
const HOLD_MS = 4200
const FADE_MS = 450
const RESULTS_DELAY_MS = 500

export default function PhotonPreviewDemo() {
  const [typed, setTyped] = useState('')
  const [resultCount, setResultCount] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [fading, setFading] = useState(false)
  const [isBackspacing, setIsBackspacing] = useState(false)
  const [resultsGeneration, setResultsGeneration] = useState(0)

  useEffect(() => {
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const schedule = (fn: () => void, ms: number) => {
      timers.push(
        setTimeout(() => {
          if (!cancelled) fn()
        }, ms),
      )
    }

    const typeQuery = (query: string, onComplete: () => void) => {
      let char = 0
      const typeNext = () => {
        if (cancelled) return
        if (char <= query.length) {
          setTyped(query.slice(0, char))
          char += 1
          schedule(typeNext, char === 1 ? 600 : TYPE_MS)
        } else {
          onComplete()
        }
      }
      typeNext()
    }

    const backspaceQuery = (query: string, onComplete: () => void) => {
      setIsBackspacing(true)
      let len = query.length
      const backspaceNext = () => {
        if (cancelled) return
        if (len > 0) {
          len -= 1
          setTyped(query.slice(0, len))
          schedule(backspaceNext, BACKSPACE_MS)
        } else {
          setIsBackspacing(false)
          onComplete()
        }
      }
      backspaceNext()
    }

    const runDemo = (demoIndex: number) => {
      const demo = SEARCH_DEMOS[demoIndex]
      setFading(false)

      typeQuery(demo.query, () => {
        schedule(() => {
          setResultCount(demo.count)
          setResultsGeneration((g) => g + 1)
          setShowResults(true)
        }, RESULTS_DELAY_MS)

        schedule(() => {
          backspaceQuery(demo.query, () => {
            setFading(true)
            schedule(() => {
              setShowResults(false)
              setResultCount(0)
              setFading(false)
              runDemo((demoIndex + 1) % SEARCH_DEMOS.length)
            }, FADE_MS)
          })
        }, RESULTS_DELAY_MS + HOLD_MS)
      })
    }

    runDemo(0)

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [])

  const showClear = showResults
  const showSend = !showResults

  return (
    <div className={styles.preview} aria-hidden="true">
      <div className={styles.previewChrome}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
      <div className={styles.previewBody}>
        <div className={styles.searchBar}>
          <svg
            className={styles.searchIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20 16.5 16.5" />
          </svg>
          <span className={styles.searchField}>
            <span className={styles.searchMeasure} aria-hidden="true">
              {LONGEST_QUERY}
            </span>
            <span className={styles.searchText}>
              {typed}
              {(!showResults || isBackspacing) && (
                <span className={styles.searchCursor} aria-hidden="true">
                  |
                </span>
              )}
            </span>
          </span>
          <span className={styles.searchActionSlot}>
            {showClear && (
              <span className={styles.searchBtnClear} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle
                    cx="12"
                    cy="12"
                    r="9.5"
                    fill="#3a3834"
                    stroke="rgba(255, 255, 255, 0.14)"
                    strokeWidth="1"
                  />
                  <path
                    d="M9.25 9.25l5.5 5.5M14.75 9.25l-5.5 5.5"
                    stroke="#c8c4bc"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            )}
            {showSend && (
              <span className={styles.searchBtnSend} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill="currentColor" />
                  <path
                    d="M12 16V8M12 8l-3.5 3.5M12 8l3.5 3.5"
                    stroke="#f0ead6"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
          </span>
        </div>
        <div
          className={`${styles.gridWrap} ${showResults ? styles.gridWrapVisible : ''} ${fading ? styles.gridWrapFading : ''}`}
        >
          <div className={styles.grid}>
            {Array.from({ length: 6 }, (_, i) => {
              const visible = showResults && i < resultCount
              return (
                <span
                  key={visible ? `r${resultsGeneration}-${i}` : `slot-${i}`}
                  className={`${styles.thumb} ${visible ? styles.thumbEnter : styles.thumbHidden}`}
                  style={{
                    background: THUMB_GRADIENTS[i % THUMB_GRADIENTS.length],
                    animationDelay: visible ? `${i * 60}ms` : undefined,
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
