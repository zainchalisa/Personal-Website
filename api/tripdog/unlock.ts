import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleTripdogUnlock } from '../../functions/_lib/tripdog'

function tripdogEnvFromProcess(): {
  TRIPDOG_UNLOCK_PASSWORD?: string
  TRIPDOG_PASSWORD?: string
  TRIPDOG_PROJECT_JSON?: string
} {
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

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'application/json')
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
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  res.status(response.status).send(Buffer.from(await response.arrayBuffer()))
}
