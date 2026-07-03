import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolveSocialRedirect } from './src/shared/config/socialLinks'

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
  plugins: [react(), tailwindcss(), socialRedirectDevPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
