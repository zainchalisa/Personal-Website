type TerminalMarkProps = {
  className?: string
  tone?: 'light' | 'muted'
}

/** macOS Terminal app mark — chevron prompt and block cursor */
export function TerminalMark({ className, tone = 'muted' }: TerminalMarkProps) {
  const fg = tone === 'light' ? '#ffffff' : 'currentColor'

  return (
    <svg
      className={className}
      viewBox="0 0 52 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M10 8 L22 18 L10 28"
        stroke={fg}
        strokeWidth="3.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="27" y="25" width="15" height="4" rx="1" fill={fg} />
    </svg>
  )
}
