import type { PortfolioProject } from './projectTypes'

type UnlockResponse = {
  success?: boolean
  project?: PortfolioProject
  error?: string
}

const GENERIC_ERROR = 'Unable to unlock this project right now. Please try again.'

async function parseUnlockJson(res: Response): Promise<UnlockResponse | null> {
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return null
  try {
    return (await res.json()) as UnlockResponse
  } catch {
    return null
  }
}

function messageForStatus(status: number, data: UnlockResponse | null): string {
  if (status === 401) return 'Incorrect password. Please try again.'
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.'
  if (data?.error) return data.error
  return GENERIC_ERROR
}

export async function unlockTripdogProject(password: string): Promise<PortfolioProject> {
  const res = await fetch('/api/tripdog/unlock', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'TripdogUnlock',
    },
    cache: 'no-store',
    body: JSON.stringify({ password }),
  })

  const data = await parseUnlockJson(res)

  if (!res.ok) {
    throw new Error(messageForStatus(res.status, data))
  }

  if (!data?.success || !data.project) {
    throw new Error(GENERIC_ERROR)
  }

  return data.project
}
