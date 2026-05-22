import { useEffect, useState } from 'react'
import babyImg5964 from '../../assets/photon/baby_photos/web/IMG_5964.jpg'
import babyImg8908 from '../../assets/photon/baby_photos/web/IMG_8908.jpg'
import babyImg8909 from '../../assets/photon/baby_photos/web/IMG_8909.jpg'
import babyImg8911 from '../../assets/photon/baby_photos/web/IMG_8911.jpg'
import englandImg0294 from '../../assets/photon/family trip to england/web/IMG_0294.jpg'
import englandImg1607 from '../../assets/photon/family trip to england/web/IMG_1607.jpg'
import englandImg8942 from '../../assets/photon/family trip to england/web/IMG_8942.jpg'
import englandImg8080 from '../../assets/photon/family trip to england/web/IMG_8080.jpg'
import englandImg8860 from '../../assets/photon/family trip to england/web/IMG_8860.jpg'
import sunsetImg7180 from '../../assets/photon/california sunsets/web/IMG_7180.jpg'
import sunsetImg7293 from '../../assets/photon/california sunsets/web/IMG_7293.jpg'
import sunsetImg7560 from '../../assets/photon/california sunsets/web/IMG_7560.jpg'
import sunsetImg8470 from '../../assets/photon/california sunsets/web/IMG_8470-2.jpg'
import sunsetImg8525 from '../../assets/photon/california sunsets/web/IMG_8525-Enhanced-NR.jpg'
import momDadImg8840 from '../../assets/photon/mom&dad/web/IMG_8840_crop.jpg'
import redwoodImg6664 from '../../assets/photon/redwood forest/web/IMG_6664.jpg'
import redwoodImg6698 from '../../assets/photon/redwood forest/web/IMG_6698.jpg'
import redwoodImg6712 from '../../assets/photon/redwood forest/web/IMG_6712.jpg'
import redwoodImg6731 from '../../assets/photon/redwood forest/web/IMG_6731-2.jpg'
import styles from './PhotonPage.module.css'

const BABY_PHOTOS_IMAGES = [
  babyImg8909,
  babyImg8908,
  babyImg8911,
  babyImg5964,
] as const

const ENGLAND_TRIP_IMAGES = [
  englandImg8080,
  englandImg0294,
  englandImg1607,
  englandImg8942,
  englandImg8860,
] as const

const CALIFORNIA_SUNSET_IMAGES = [
  sunsetImg7560,
  sunsetImg7180,
  sunsetImg7293,
  sunsetImg8470,
  sunsetImg8525,
] as const

const MOM_DAD_IMAGES = [momDadImg8840] as const

const REDWOOD_FOREST_IMAGES = [
  redwoodImg6698,
  redwoodImg6712,
  redwoodImg6664,
  redwoodImg6731,
] as const

const DEMO_IMAGES_TO_PRELOAD = [
  ...REDWOOD_FOREST_IMAGES,
  ...MOM_DAD_IMAGES,
  ...CALIFORNIA_SUNSET_IMAGES,
  ...ENGLAND_TRIP_IMAGES,
  ...BABY_PHOTOS_IMAGES,
] as const

type SearchDemo = {
  query: string
  count: number
  images?: readonly string[]
  imagePositions?: readonly string[]
}

const SEARCH_DEMOS: SearchDemo[] = [
  {
    query: "that chaotic family trip to england and scotland",
    count: ENGLAND_TRIP_IMAGES.length,
    images: ENGLAND_TRIP_IMAGES,
  },
  {
    query: 'drive through the redwood forest in california',
    count: REDWOOD_FOREST_IMAGES.length,
    images: REDWOOD_FOREST_IMAGES,
  },
  {
    query: 'cute photo of mom and dad in 2008 at barbeque',
    count: MOM_DAD_IMAGES.length,
    images: MOM_DAD_IMAGES,
  },
  {
    query: 'every sunset we pulled over for on the california road trip in 2025',
    count: CALIFORNIA_SUNSET_IMAGES.length,
    images: CALIFORNIA_SUNSET_IMAGES,
  },
  {
    query: 'zain and arwa sitting next to each other when they were little',
    count: BABY_PHOTOS_IMAGES.length,
    images: BABY_PHOTOS_IMAGES,
  },
]

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

function preloadImages(urls: readonly string[]): Promise<void> {
  return Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = src
        }),
    ),
  ).then(() => undefined)
}

export default function PhotonPreviewDemo() {
  const [typed, setTyped] = useState('')
  const [resultCount, setResultCount] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [fading, setFading] = useState(false)
  const [isBackspacing, setIsBackspacing] = useState(false)
  const [resultsGeneration, setResultsGeneration] = useState(0)
  const [activeDemoIndex, setActiveDemoIndex] = useState(0)

  useEffect(() => {
    DEMO_IMAGES_TO_PRELOAD.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [])

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

      demo.images?.forEach((src) => {
        const img = new Image()
        img.src = src
      })

      typeQuery(demo.query, () => {
        schedule(() => {
          const revealResults = () => {
            setActiveDemoIndex(demoIndex)
            setResultCount(demo.count)
            setResultsGeneration((g) => g + 1)
            setShowResults(true)

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
            }, HOLD_MS)
          }

          if (demo.images?.length) {
            void preloadImages(demo.images).then(() => {
              if (!cancelled) revealResults()
            })
          } else {
            revealResults()
          }
        }, RESULTS_DELAY_MS)
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
              const demo = SEARCH_DEMOS[activeDemoIndex]
              const photoSrc = visible ? demo.images?.[i] : undefined
              const key = visible ? `r${resultsGeneration}-${i}` : `slot-${i}`

              if (photoSrc && visible) {
                return (
                  <img
                    key={key}
                    src={photoSrc}
                    alt=""
                    draggable={false}
                    decoding="async"
                    className={`${styles.thumb} ${styles.thumbPhoto} ${styles.thumbEnter}`}
                    style={{
                      animationDelay: `${i * 60}ms`,
                      ...(demo.imagePositions?.[i]
                        ? { objectPosition: demo.imagePositions[i] }
                        : {}),
                    }}
                  />
                )
              }

              return (
                <span
                  key={key}
                  className={`${styles.thumb} ${visible ? styles.thumbEnter : styles.thumbHidden}`}
                  style={{
                    background:
                      THUMB_GRADIENTS[i % THUMB_GRADIENTS.length],
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
