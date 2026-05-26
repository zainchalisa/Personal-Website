/** Server-only Trip Dog helpers — never import from src/ client code. */

import { clientKeyFromRequest, rateLimit } from './rateLimit'

const TRIPDOG_SLUG = 'super-secret-project'

const UNLOCK_RATE_LIMIT = { limit: 5, windowMs: 15 * 60_000 }
const MAX_PASSWORD_LEN = 256
const MAX_PROJECT_JSON_LEN = 32_768
const MAX_TITLE_LEN = 200
const MAX_PROJECT_TYPE_LEN = 80
const MAX_DESC_LEN = 8_000
const MAX_DOCUMENT_LABEL_LEN = 80
const MAX_TAGS = 32
const MAX_TAG_LEN = 64

const TRIPDOG_STATUSES = new Set<TripdogProjectPayload['status']>(['concept', 'built', 'research'])

const textEncoder = new TextEncoder()

function isAllowedHttpUrl(url: string | null | undefined): boolean {
  if (url == null || url === '') return true
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

function passwordsMatch(candidate: string, secret: string): boolean {
  const a = textEncoder.encode(candidate)
  const b = textEncoder.encode(secret)
  if (a.byteLength !== b.byteLength) {
    let acc = 0
    for (let i = 0; i < b.byteLength; i++) acc |= b[i]! ^ b[i]!
    void acc
    return false
  }
  let out = 0
  for (let i = 0; i < a.byteLength; i++) {
    out |= a[i]! ^ b[i]!
  }
  return out === 0
}

type TripdogProjectPayload = {
  slug: string
  title: string
  year: number
  projectType: string
  status: 'concept' | 'built' | 'research'
  tags: readonly string[]
  shortDescription: string
  coverImageUrl: string | null
  documentUrl: string | null
  documentLabel: string | null
  githubUrl: string | null
  liveSiteUrl: string | null
}

type TripdogEnv = {
  /** Preferred name on Vercel; TRIPDOG_PASSWORD kept for Cloudflare / local .env */
  TRIPDOG_UNLOCK_PASSWORD?: string
  TRIPDOG_PASSWORD?: string
  /** JSON string matching TripdogProjectPayload — set in Cloudflare / local .env only */
  TRIPDOG_PROJECT_JSON?: string
}

function unlockPassword(env: TripdogEnv): string | undefined {
  const secret = env.TRIPDOG_UNLOCK_PASSWORD?.trim() || env.TRIPDOG_PASSWORD?.trim()
  return secret || undefined
}

function sanitizeTripdogProject(parsed: TripdogProjectPayload): TripdogProjectPayload {
  return {
    slug: parsed.slug,
    title: parsed.title,
    year: parsed.year,
    projectType: parsed.projectType,
    status: parsed.status,
    tags: parsed.tags,
    shortDescription: parsed.shortDescription,
    coverImageUrl: parsed.coverImageUrl,
    documentUrl: parsed.documentUrl,
    documentLabel: parsed.documentLabel,
    githubUrl: parsed.githubUrl,
    liveSiteUrl: parsed.liveSiteUrl,
  }
}

function validateTripdogProject(parsed: TripdogProjectPayload): boolean {
  if (parsed.slug !== TRIPDOG_SLUG) return false
  if (typeof parsed.title !== 'string' || parsed.title.length === 0 || parsed.title.length > MAX_TITLE_LEN) {
    return false
  }
  if (
    typeof parsed.projectType !== 'string' ||
    parsed.projectType.length === 0 ||
    parsed.projectType.length > MAX_PROJECT_TYPE_LEN
  ) {
    return false
  }
  if (typeof parsed.year !== 'number' || !Number.isInteger(parsed.year) || parsed.year < 1970 || parsed.year > 2100) {
    return false
  }
  if (!TRIPDOG_STATUSES.has(parsed.status)) return false
  if (
    typeof parsed.shortDescription !== 'string' ||
    parsed.shortDescription.length === 0 ||
    parsed.shortDescription.length > MAX_DESC_LEN
  ) {
    return false
  }
  if (!Array.isArray(parsed.tags) || parsed.tags.length === 0 || parsed.tags.length > MAX_TAGS) {
    return false
  }
  if (!parsed.tags.every((t) => typeof t === 'string' && t.length > 0 && t.length <= MAX_TAG_LEN)) {
    return false
  }
  if (
    parsed.documentLabel != null &&
    (typeof parsed.documentLabel !== 'string' || parsed.documentLabel.length > MAX_DOCUMENT_LABEL_LEN)
  ) {
    return false
  }
  const urls = [parsed.coverImageUrl, parsed.documentUrl, parsed.githubUrl, parsed.liveSiteUrl]
  if (!urls.every(isAllowedHttpUrl)) return false
  return true
}

function loadTripdogProject(env: TripdogEnv): TripdogProjectPayload | null {
  const raw = env.TRIPDOG_PROJECT_JSON?.trim()
  if (!raw || raw.length > MAX_PROJECT_JSON_LEN) return null
  try {
    const parsed = JSON.parse(raw) as TripdogProjectPayload
    if (!validateTripdogProject(parsed)) return null
    return sanitizeTripdogProject(parsed)
  } catch {
    return null
  }
}

/** Clears any legacy session cookie from earlier builds. */
function legacySessionClearCookie(secure: boolean): string {
  const attrs = ['tripdog_access=', 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0']
  if (secure) attrs.push('Secure')
  return attrs.join('; ')
}

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Cache-Control', 'no-store')
  return new Response(JSON.stringify(data), { ...init, headers })
}

function tripdogNotConfigured(): Response {
  return json(
    { success: false, error: 'Unlock is not configured.' },
    { status: 500 },
  )
}

export async function handleTripdogUnlock(
  request: Request,
  env: TripdogEnv,
): Promise<Response> {
  if (request.headers.get('X-Requested-With') !== 'TripdogUnlock') {
    return json({ success: false, error: 'Invalid request.' }, { status: 400 })
  }

  const secret = unlockPassword(env)
  const project = loadTripdogProject(env)
  if (!secret || !project) {
    return tripdogNotConfigured()
  }

  let body: { password?: string }
  try {
    body = (await request.json()) as { password?: string }
  } catch {
    return json({ success: false, error: 'Invalid request.' }, { status: 400 })
  }

  const password = body.password?.trim() ?? ''
  if (!password || password.length > MAX_PASSWORD_LEN) {
    return json({ success: false, error: 'Invalid request.' }, { status: 400 })
  }

  if (!passwordsMatch(password, secret)) {
    const rl = rateLimit(`tripdog:${clientKeyFromRequest(request)}`, UNLOCK_RATE_LIMIT)
    if (!rl.ok) {
      return json(
        { success: false, error: 'Too many attempts. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSec) },
        },
      )
    }
    return json({ success: false, error: 'Incorrect password.' }, { status: 401 })
  }

  const secure = new URL(request.url).protocol === 'https:'

  return json(
    { success: true, project },
    {
      status: 200,
      headers: {
        'Set-Cookie': legacySessionClearCookie(secure),
      },
    },
  )
}
