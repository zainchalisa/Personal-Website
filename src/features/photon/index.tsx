import { useEffect, useState } from 'react'
import { assetUrl } from '@/shared/lib/assetUrl'

import PhotonPreviewDemo from './components/PhotonPreviewDemo'
import styles from './PhotonPage.module.css'

const SHOW_EMAIL_SIGNUP = false

export default function PhotonPage() {
  const [email, setEmail] = useState('')

  useEffect(() => {
    const prevTitle = document.title
    const prevDesc = document.querySelector('meta[name="description"]')?.getAttribute('content')
    const html = document.documentElement
    const body = document.body

    document.title = 'photon.'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) {
      meta.setAttribute(
        'content',
        'Describe any photo the way you remember it — Photon finds it in seconds. All local. Private. Free.',
      )
    }

    html.style.overflow = 'auto'
    html.style.maxHeight = 'none'
    body.style.overflow = 'auto'
    body.style.maxHeight = 'none'

    return () => {
      document.title = prevTitle
      if (meta && prevDesc) meta.setAttribute('content', prevDesc)
      html.style.overflow = ''
      html.style.maxHeight = ''
      body.style.overflow = ''
      body.style.maxHeight = ''
    }
  }, [])

  return (
    <div className={styles.page}>
      <div className={`${styles.inner} ${styles.innerHero}`}>
        <header className={styles.top}>
          <img
            className={styles.logo}
            src={assetUrl('/photon/logo-light.png')}
            alt=""
            width={56}
            height={56}
            decoding="async"
          />
          <a className={styles.wordmark} href="/">
            Photon
          </a>
        </header>

        <h1 className={styles.headline}>
          <span className={styles.headlineLine}>
            Your <span className={styles.headlineAccent}>memories,</span>
          </span>
          <span className={styles.headlineLine}>Instantly searchable.</span>
        </h1>
        <p className={styles.lead}>
        A moment. A face. A place. 
        <br/>
        Photon finds it in your library in seconds.
        </p>
        <div className={styles.ctaBlock}>
          {SHOW_EMAIL_SIGNUP ? (
            <form
              className={styles.ctaRow}
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                className={styles.emailInput}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                aria-label="Email address"
              />
              <button type="submit" className={styles.cta}>
                download for mac
              </button>
            </form>
          ) : (
            <div className={styles.comingSoon}>
              <span className={styles.comingSoonDot} aria-hidden="true" />
              <span className={styles.comingSoonLabel}>Coming soon</span>
              <span className={styles.comingSoonDate}>July 2026</span>
            </div>
          )}
          <p className={styles.disclaimer}>
            Your photos never leave your Mac. All local, private, & free.
          </p>
        </div>
      </div>

      <div className={styles.previewSection}>
        <PhotonPreviewDemo />
      </div>

      <div className={`${styles.inner} ${styles.innerFooter}`}>
        <footer className={styles.footer}>
          <a href="https://zainchalisa.com">Zain Chalisa</a>
        </footer>
      </div>
    </div>
  )
}
