import { IconBoltFilled } from '@tabler/icons-react'
import { useDeviceBattery } from '@/hooks/useDeviceBattery'
import styles from './DeviceBatteryIndicator.module.css'

function formatBatteryLabel(
  level: number | null,
  charging: boolean | null,
  lowPowerMode: boolean | null,
) {
  const parts: string[] = ['Battery']

  if (level !== null) {
    parts.push(`${Math.round(level * 100)} percent`)
  } else {
    parts.push('level unknown')
  }

  if (charging) parts.push('charging')
  if (lowPowerMode) parts.push('low power mode')

  return parts.join(', ')
}

type DeviceBatteryIndicatorProps = {
  className?: string
}

export function DeviceBatteryIndicator({ className }: DeviceBatteryIndicatorProps) {
  const { supported, level, charging, lowPowerMode } = useDeviceBattery()

  if (!supported && level === null && lowPowerMode !== true) {
    return null
  }

  const levelPercent =
    level !== null
      ? Math.max(4, Math.min(100, Math.round(level * 100)))
      : lowPowerMode
        ? 100
        : null
  const isLow = level !== null && level <= 0.2 && !charging
  const showBolt = charging === true

  const batteryClassName = [
    styles.battery,
    charging ? styles.batteryCharging : '',
    isLow ? styles.batteryLow : '',
    lowPowerMode ? styles.batteryLowPower : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={batteryClassName}
      role="img"
      aria-label={formatBatteryLabel(level, charging, lowPowerMode)}
    >
      <div className={styles.batteryBody}>
        {levelPercent !== null ? (
          <div
            className={styles.batteryLevel}
            style={{ width: `${levelPercent}%` }}
          />
        ) : (
          <div className={`${styles.batteryLevel} ${styles.batteryLevelUnknown}`} />
        )}
        {showBolt ? (
          <IconBoltFilled className={styles.batteryBolt} aria-hidden />
        ) : null}
      </div>
      <div className={styles.batteryCap} />
    </div>
  )
}
