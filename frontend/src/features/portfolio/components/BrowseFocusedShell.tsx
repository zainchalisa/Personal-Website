import type { ReactNode } from 'react'
import shellStyles from './AboutBrowseFocused.module.css'

type BrowseFocusedShellProps = {
  isBrowse: boolean
  browse: ReactNode
  focused: ReactNode | null
  variant?: 'desktop' | 'mobile'
}

export function BrowseFocusedShell({
  isBrowse,
  browse,
  focused,
  variant = 'desktop',
}: BrowseFocusedShellProps) {
  return (
    <div
      className={`${shellStyles.tabShell}${variant === 'mobile' ? ` ${shellStyles.tabShellMobile}` : ''}`}
    >
      <div className={shellStyles.tabCanvas}>
        <div
          className={`${shellStyles.tabView}${isBrowse ? ` ${shellStyles.tabViewVisible}` : ''}`}
          aria-hidden={!isBrowse}
        >
          {browse}
        </div>
        <div
          className={`${shellStyles.tabView}${!isBrowse ? ` ${shellStyles.tabViewVisible}` : ''}`}
          aria-hidden={isBrowse}
        >
          {focused}
        </div>
      </div>
    </div>
  )
}
