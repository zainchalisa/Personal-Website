import './photography.css'
import { type ReactNode } from 'react'
import PhotographyPinboard from './components/PhotographyPinboard'
import { useTheme } from '../../hooks/useTheme'

export type PhotographyPageProps = {
  navSlot?: ReactNode
  active?: boolean
}

export default function PhotographyPage({ navSlot, active = true }: PhotographyPageProps) {
  const { theme } = useTheme()

  return (
    <div className="photography-page" data-theme={theme}>
      {navSlot ? <div className="relative z-30 shrink-0">{navSlot}</div> : null}

      <div className="photography-stage relative min-h-0 flex-1">
        <PhotographyPinboard active={active} theme={theme} />
      </div>
    </div>
  )
}
