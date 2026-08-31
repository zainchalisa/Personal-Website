import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolveSocialRedirect } from './src/config/socialLinks'
import {
  SITE_PUBLIC_DESCRIPTION,
  SITE_PUBLIC_TITLE,
  SITE_PUBLIC_URL,
} from './src/config/siteIdentity'

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
}

function sitePublicMetaPlugin(): Plugin {
  const replacements: Record<string, string> = {
    '%SITE_PUBLIC_TITLE%': escapeHtmlAttribute(SITE_PUBLIC_TITLE),
    '%SITE_PUBLIC_DESCRIPTION%': escapeHtmlAttribute(SITE_PUBLIC_DESCRIPTION),
    '%SITE_PUBLIC_URL%': escapeHtmlAttribute(SITE_PUBLIC_URL),
  }

  return {
    name: 'site-public-meta',
    transformIndexHtml(html) {
      let next = html
      for (const [token, value] of Object.entries(replacements)) {
        next = next.replaceAll(token, value)
      }
      return next
    },
  }
}

function socialRedirectDevPlugin(): Plugin {
  return {
    name: 'social-redirect-dev',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split('?')[0]
        if (!pathname) {
          next()
          return
        }

        const destination = resolveSocialRedirect(pathname)
        if (destination) {
          res.statusCode = 302
          res.setHeader('Location', destination)
          res.end()
          return
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), sitePublicMetaPlugin(), socialRedirectDevPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
