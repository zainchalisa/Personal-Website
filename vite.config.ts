import type { IncomingMessage, ServerResponse } from 'node:http'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { handleTripdogUnlock } from './functions/_lib/tripdog'

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function writeWebResponse(res: ServerResponse, response: Response) {
  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  const body = Buffer.from(await response.arrayBuffer())
  res.end(body)
}

function tripdogApiDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'tripdog-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url?.split('?')[0]
        if (!pathname?.startsWith('/api/tripdog/')) {
          next()
          return
        }

        try {
          const host = req.headers.host ?? 'localhost'
          const url = new URL(req.url ?? '/', `http://${host}`)
          const tripdogEnv = {
            TRIPDOG_UNLOCK_PASSWORD: env.TRIPDOG_UNLOCK_PASSWORD,
            TRIPDOG_PASSWORD: env.TRIPDOG_PASSWORD,
            TRIPDOG_PROJECT_JSON: env.TRIPDOG_PROJECT_JSON,
          }

          if (pathname === '/api/tripdog/unlock' && req.method === 'POST') {
            const body = await readRequestBody(req)
            const request = new Request(url.toString(), {
              method: 'POST',
              headers: req.headers as HeadersInit,
              body,
            })
            await writeWebResponse(res, await handleTripdogUnlock(request, tripdogEnv))
            return
          }

          res.statusCode = 404
          res.end('Not Found')
        } catch (error) {
          console.error('[tripdog-api-dev]', error)
          res.statusCode = 500
          res.end('Internal Server Error')
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), tripdogApiDevPlugin(env)],
  }
})
