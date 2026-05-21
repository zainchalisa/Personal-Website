import { useEffect, useState } from 'react'
import photonLogo from '../../assets/photon-logo.png'

const PHOTON_FAVICON = '/photon-icon-128.png'
import PhotonPreviewDemo from './PhotonPreviewDemo'
import styles from './PhotonPage.module.css'

export default function PhotonPage() {
  const [email, setEmail] = useState('')

  useEffect(() => {
    const prevTitle = document.title
    const prevDesc = document.querySelector('meta[name="description"]')?.getAttribute('content')
    const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    const prevIconHref = iconLink?.getAttribute('href') ?? null
    const prevIconType = iconLink?.getAttribute('type') ?? null
    const html = document.documentElement
    const body = document.body

    if (iconLink) {
      iconLink.type = 'image/png'
      iconLink.setAttribute('sizes', '128x128')
      iconLink.href = PHOTON_FAVICON
    }

    document.title = 'photon — find your photos, not filenames'
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
      if (iconLink) {
        if (prevIconHref) iconLink.setAttribute('href', prevIconHref)
        else iconLink.removeAttribute('href')
        if (prevIconType) iconLink.setAttribute('type', prevIconType)
        else iconLink.setAttribute('type', 'image/svg+xml')
        iconLink.removeAttribute('sizes')
      }
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
          <img className={styles.logo} src={photonLogo} alt="" width={56} height={56} decoding="async" />
          <a className={styles.wordmark} href="/">
            Photon
          </a>
        </header>

        <h1 className={styles.headline}>
          find your photos,
          <br />
          not filenames.
        </h1>
        <p className={styles.lead}>
          No folders. No dates. No guessing.
          <br />
          Just describe it the way you remember it.
        </p>
        <div className={styles.ctaBlock}>
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
          <p className={styles.disclaimer}>
            Your photos never leave your Mac. No account, no cloud, free forever.
          </p>
        </div>
      </div>

      <div className={styles.previewSection}>
        <PhotonPreviewDemo />
      </div>

      <div className={`${styles.inner} ${styles.innerFooter}`}>
        <footer className={styles.footer}>
          <a href="https://zainchalisa.com">zainchalisa.com</a>
        </footer>
      </div>
    </div>
  )
}
