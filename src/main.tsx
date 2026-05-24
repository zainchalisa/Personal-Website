import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/geist-mono/400.css'
import '@fontsource/geist-sans/400.css'
import '@fontsource/geist-sans/500.css'
import '@fontsource/geist-sans/600.css'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './hooks/useTheme'

const PhotonPage = lazy(() => import('./pages/photon'))

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
      <ThemeProvider>
        <App />
      </ThemeProvider>
    )}
  </StrictMode>,
)
