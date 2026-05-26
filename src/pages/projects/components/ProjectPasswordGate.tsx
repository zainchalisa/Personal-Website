import { useId, useState } from 'react'
import { unlockTripdogProject } from '../tripdogClient'
import type { PortfolioProject } from '../projectTypes'
import styles from './ProjectPasswordGate.module.css'

type Props = {
  onUnlocked: (project: PortfolioProject) => void
}

export function ProjectPasswordGate({ onUnlocked }: Props) {
  const inputId = useId()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      const unlocked = await unlockTripdogProject(password)
      onUnlocked(unlocked)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to unlock project.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.gate}>
      <p className={styles.lead}>
        <span className={styles.lock} aria-hidden>
          🔒
        </span>
        If you want to know more, please contact me :D
      </p>
      <form className={styles.form} onSubmit={onSubmit}>
        <label className={styles.label} htmlFor={inputId}>
          Password
        </label>
        <input
          id={inputId}
          className={styles.input}
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={256}
          disabled={submitting}
          autoFocus
        />
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className={styles.submit} disabled={submitting || !password.trim()}>
          {submitting ? 'Unlocking…' : 'Unlock project'}
        </button>
      </form>
    </div>
  )
}
