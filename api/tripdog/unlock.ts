import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleTripdogUnlock } from '../_lib/tripdog.js'

const FORWARDED_HEADERS = [
  'content-type',
  'cache-control',
  'retry-after',
  'set-cookie',
] as const

function tripdogEnvFromProcess() {
  return {
    TRIPDOG_UNLOCK_PASSWORD: process.env.TRIPDOG_UNLOCK_PASSWORD,
    TRIPDOG_PASSWORD: process.env.TRIPDOG_PASSWORD,
    TRIPDOG_PROJECT_JSON: process.env.TRIPDOG_PROJECT_JSON,
  }
}

function requestBodyString(req: VercelRequest): string {
  if (typeof req.body === 'string') return req.body
  if (req.body !== undefined && req.body !== null) return JSON.stringify(req.body)
  return ''
}

function applyResponseHeaders(res: VercelResponse, response: Response): void {
  for (const name of FORWARDED_HEADERS) {
    const value = response.headers.get(name)
    if (value) res.setHeader(name, value)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store')

  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      res.status(405).json({ success: false, error: 'Method not allowed' })
      return
    }

    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'
    const host = req.headers.host ?? 'localhost'
    const path = req.url?.split('?')[0] ?? '/api/tripdog/unlock'
    const url = `${protocol}://${host}${path}`

    const request = new Request(url, {
      method: 'POST',
      headers: {
        'content-type': String(req.headers['content-type'] ?? 'application/json'),
        'x-requested-with': String(req.headers['x-requested-with'] ?? ''),
        'x-forwarded-for': String(req.headers['x-forwarded-for'] ?? ''),
        'x-real-ip': String(req.headers['x-real-ip'] ?? ''),
        'cf-connecting-ip': String(req.headers['cf-connecting-ip'] ?? ''),
      },
      body: requestBodyString(req),
    })

    const response = await handleTripdogUnlock(request, tripdogEnvFromProcess())
    const payload: unknown = await response.json()

    applyResponseHeaders(res, response)
    res.status(response.status).json(payload)
  } catch (error) {
    console.error('[api/tripdog/unlock]', error)
    res.status(500).json({
      success: false,
      error: 'Unable to process unlock request.',
    })
  }
}
