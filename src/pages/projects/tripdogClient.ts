import type { PortfolioProject } from './projectTypes'

type UnlockResponse = {
  project?: PortfolioProject
  error?: string
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

  const data = (await res.json()) as UnlockResponse
  if (!res.ok) {
    const message =
      res.status === 429
        ? 'Too many attempts. Try again in a few minutes.'
        : (data.error ?? 'Unable to unlock project.')
    throw new Error(message)
  }
  if (!data.project) {
    throw new Error('Unlock succeeded but project payload was missing.')
  }
  return data.project
}
