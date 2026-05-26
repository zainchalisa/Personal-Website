import './photography.css'
import PhotographyPinboard from './components/PhotographyPinboard'
import { PhotographyThemeTransition } from './components/PhotographyThemeTransition'
import { useTheme } from '../../hooks/useTheme'

type PhotographyPageProps = {
  active?: boolean
}

export default function PhotographyPage({ active = true }: PhotographyPageProps) {
  const { theme } = useTheme()

  return (
    <div className="photography-page" data-theme={theme}>
      <div className="photography-stage relative min-h-0 flex-1">
        <PhotographyPinboard active={active} theme={theme} />
        <PhotographyThemeTransition active={active} />
      </div>
    </div>
  )
}
