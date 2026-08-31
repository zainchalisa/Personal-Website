import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-sans/400.css'
import '@fontsource/geist-sans/500.css'
import '@fontsource/geist-sans/600.css'
import '@/styles/index.css'
import App from './App'

const PhotonPage = lazy(() => import('@/features/photon'))

function normalizePath(pathname: string) {
  const path = pathname.replace(/\/+$/, '') || '/'
  return path.toLowerCase()
}

const path = normalizePath(window.location.pathname)
const isPhoton = path === '/photon'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPhoton ? (
      <Suspense fallback={null}>
        <PhotonPage />
      </Suspense>
    ) : (
      <App />
    )}
    <Analytics />
  </StrictMode>,
)
