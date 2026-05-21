import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import lanternOff from './assets/Lantern Off.png'
import lanternOn from './assets/Lantern On.png'
import lanternPlaceSfx from './assets/Lantern Placing (Nr. 1 _ Minecraft Sound) - Sound Effect for editing.mp3'
import zainPortrait from './assets/zain_transparent_background.png'
import { ProjectsGame, type ShowcaseProject } from './components/ProjectsGame/ProjectsGame'
import type { PageId } from './types'
import { useTheme } from './useTheme'

const PhotographyPage = lazy(() => import('./components/PhotographyPage'))
const NAV: { id: PageId; label: string }[] = [
  { id: 'about', label: 'about' },
  { id: 'projects', label: 'projects' },
  { id: 'photography', label: 'photography' },
]

const ABOUT_LINKS = [
  { label: 'github', href: 'https://github.com/zainchalisa' },
  { label: 'linkedin', href: 'https://www.linkedin.com/in/zainchalisa' },
  { label: 'email', href: 'mailto:hello@zainchalisa.com' },
] as const

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
  const [page, setPage] = useState<PageId>('about')
  const { theme, toggleTheme } = useTheme()
  const lanternSoundRef = useRef<HTMLAudioElement | null>(null)

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
    <div className="app">
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
              <span className="theme-toggle-stack" aria-hidden="true">
                <span className="theme-toggle-glow-layer">
                  <span className="theme-toggle-glow theme-toggle-glow--soft" />
                  <span className="theme-toggle-glow" />
                </span>
                <img
                  className="theme-toggle-lantern"
                  src={theme === 'dark' ? lanternOn : lanternOff}
                  alt=""
                  width={42}
                  height={42}
                  decoding="async"
                />
              </span>
            </button>
          </nav>
        </div>
      </header>

      <div
        className={`site${page === 'about' ? ' site--about-screen' : ''}${
          page === 'projects' ? ' site--projects-full' : ''
        }${page === 'photography' ? ' site--photography-full' : ''}`}
      >
        <h2 className="sr-only">
          Zain&apos;s personal website — about, projects, and photography
        </h2>

      <main
        className={`site-main${page === 'about' ? ' site-main--center-about' : ''}`}
      >
        <div
          id="about"
          className={`page about-section${page === 'about' ? ' active' : ''}`}
          hidden={page !== 'about'}
        >
          <div className="about-layout">
            <div className="about-text">
              <p>
                hi, my name is <span className="highlight">zain!</span>
              </p>
              <p>
              i’ve been making stuff since i was 14 years old. 
              from running my own landscaping business, to creating viral videos on tiktok, 
              to reselling random stuff online, i’ve tried, or at least thought about trying, 
              everything under the sun.
              </p>
              <p>
                i learned how to code 4 years ago, and now i’m a{' '}
                <span className="highlight">software engineer in nyc.</span>
              </p>
              <p>
              right now, i’m building things that are cool to me and maybe… 
              will be cool to the world too!
              </p>
              <p>take a look around, you might find something you like :p</p>
              <nav className="about-links" aria-label="Contact">
                {ABOUT_LINKS.map((link, i) => (
                  <span key={link.label} className="about-links-item">
                    {i > 0 && (
                      <span className="about-links-sep" aria-hidden="true">
                        ·
                      </span>
                    )}
                    <a
                      className="about-link"
                      href={link.href}
                      {...(link.label === 'email'
                        ? {}
                        : { target: '_blank', rel: 'noreferrer' })}
                    >
                      {link.label}
                    </a>
                  </span>
                ))}
              </nav>
            </div>
            <div className="about-visual">
              <img
                className="about-photo"
                src={zainPortrait}
                alt="Zain"
                width={640}
                height={960}
                decoding="async"
              />
            </div>
          </div>
        </div>

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
    </div>
  )
}

export default App
