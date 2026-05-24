import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import lanternOff from './assets/Lantern Off.png'
import lanternOn from './assets/Lantern On.png'
import lanternPlaceSfx from './assets/Lantern Placing (Nr. 1 _ Minecraft Sound) - Sound Effect for editing.mp3'
import { AboutPage } from './components/about/AboutPage'
import { ProjectsGame, type ShowcaseProject } from './components/ProjectsGame/ProjectsGame'
import type { PageId } from './types'
import { useTheme } from './useTheme'

const PhotographyPage = lazy(() => import('./components/PhotographyPage'))

const NAV: { id: PageId; label: string }[] = [
  { id: 'about', label: 'about' },
  { id: 'projects', label: 'projects' },
  { id: 'photography', label: 'photography' },
]

const PAGE_STORAGE_KEY = 'zain-last-page-v1'

function readStoredPage(): PageId {
  try {
    const stored = sessionStorage.getItem(PAGE_STORAGE_KEY)
    if (stored === 'about' || stored === 'projects' || stored === 'photography') {
      return stored
    }
  } catch {
    /* private mode */
  }
  return 'about'
}

function persistPage(page: PageId) {
  try {
    sessionStorage.setItem(PAGE_STORAGE_KEY, page)
  } catch {
    /* ignore */
  }
}

const PROJECTS: ShowcaseProject[] = [
  {
    title: 'Photon',
    description:
      'Find your photos, not filenames. No folders, no dates — just describe it the way you remember it.',
    tags: ['swift', 'macos', 'ai'],
    route: '/photon',
    github: 'https://github.com/zainchalisa',
    live: 'https://zainchalisa.com/photon',
  },
  {
    title: 'SYNC',
    description:
      'Something you built that solves a real problem or just scratches your own itch.',
    tags: ['python', 'ai'],
    route: '/sync-app',
    github: 'https://github.com/',
    live: 'https://github.com/',
  },
  {
    title: 'RU Cafe',
    description: 'That weird thing you built at 2am that somehow actually works.',
    tags: ['typescript'],
    route: '/rutgers-cafe',
    github: 'https://github.com/',
    live: 'https://github.com/',
  },
  {
    title: 'Face Neural Networks',
    description:
      'Built this when you were making videos. Maybe others can use it too.',
    tags: ['api', 'automation'],
    route: '/face-digit-neural-nets',
    github: 'https://github.com/',
    live: 'https://github.com/',
  },
  {
    title: 'Trip Dog',
    description: 'Small tools and pages you ship when inspiration hits.',
    tags: ['next.js', 'design'],
    route: '/super-secret-project',
    github: 'https://github.com/',
    live: 'https://github.com/',
  },
]

function App() {
  const [page, setPageState] = useState<PageId>(readStoredPage)
  const { theme, toggleTheme } = useTheme()
  const lanternSoundRef = useRef<HTMLAudioElement | null>(null)

  const setPage = useCallback((next: PageId) => {
    setPageState(next)
    persistPage(next)
  }, [])

  useEffect(() => {
    const el = new Audio(lanternPlaceSfx)
    el.preload = 'auto'
    lanternSoundRef.current = el
    return () => {
      lanternSoundRef.current = null
    }
  }, [])

  const onLanternToggle = () => {
    const el = lanternSoundRef.current
    if (el) {
      el.currentTime = 0
      void el.play().catch(() => {})
    }
    toggleTheme()
  }

  return (
    <div className={`app${page === 'about' ? ' app--about' : ''}`}>
      <header className="nav-shell">
        <div className="nav-shell-inner">
          <nav className="nav" aria-label="Primary">
            <span className="nav-logo">zain chalisa.</span>
            <div className="nav-links">
              {NAV.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`nav-link${page === id ? ' active' : ''}`}
                  onMouseDown={(e) => {
                    if (e.button === 0) e.preventDefault()
                  }}
                  onClick={() => setPage(id)}
                  aria-current={page === id ? 'page' : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`theme-toggle${theme === 'dark' ? ' theme-toggle--lit' : ''}`}
              onClick={onLanternToggle}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              <img
                className="theme-toggle-lantern"
                src={theme === 'dark' ? lanternOn : lanternOff}
                alt=""
                width={42}
                height={42}
                decoding="async"
              />
            </button>
          </nav>
        </div>
      </header>

      {page === 'about' ? (
        <AboutPage onNavigate={setPage} theme={theme} />
      ) : (
        <div
          className={`site${page === 'projects' ? ' site--projects-full' : ''}${
            page === 'photography' ? ' site--photography-full' : ''
          }`}
        >
          <h2 className="sr-only">
            Zain&apos;s personal website — about, projects, and photography
          </h2>

          <main className="site-main">
            <div
              id="projects"
              className={`page section section--projects${page === 'projects' ? ' active' : ''}`}
              hidden={page !== 'projects'}
            >
              <ProjectsGame projects={PROJECTS} theme={theme} active={page === 'projects'} />
            </div>

            <div
              id="photography"
              className={`page section section--photography${page === 'photography' ? ' active' : ''}`}
              hidden={page !== 'photography'}
            >
              <Suspense fallback={null}>
                <div className="photography-shell">
                  <PhotographyPage active={page === 'photography'} />
                </div>
              </Suspense>
            </div>
          </main>
        </div>
      )}
    </div>
  )
}

export default App
