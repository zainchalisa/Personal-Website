import { useEffect, useState } from 'react'

export type DeviceBatteryStatus = {
  /** Whether the Battery Status API is available and returning data. */
  supported: boolean
  /** 0–1 charge level, or null when unknown. */
  level: number | null
  /** True when plugged in / charging; null when unknown. */
  charging: boolean | null
  /** Best-effort low power / energy saver signal; null when unknown. */
  lowPowerMode: boolean | null
}

const INITIAL: DeviceBatteryStatus = {
  supported: false,
  level: null,
  charging: null,
  lowPowerMode: null,
}

function readLowPowerMediaQuery() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(update: slow)').matches
}

/** Heuristic for iOS Low Power Mode / desktop Energy Saver when Battery API is absent. */
function probeLowPowerMode(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }

    if (readLowPowerMediaQuery()) {
      resolve(true)
      return
    }

    const intervalMs = 100
    const sampleCount = 6
    let ticks = 0
    const startedAt = performance.now()

    const id = window.setInterval(() => {
      ticks += 1
      if (ticks < sampleCount) return

      window.clearInterval(id)
      const elapsed = performance.now() - startedAt
      const expected = intervalMs * sampleCount
      resolve(elapsed > expected * 1.3)
    }, intervalMs)
  })
}

function syncFromBatteryManager(
  battery: BatteryManager,
  lowPowerMode: boolean | null,
): DeviceBatteryStatus {
  return {
    supported: true,
    level: battery.level,
    charging: battery.charging,
    lowPowerMode,
  }
}

export function useDeviceBattery(): DeviceBatteryStatus {
  const [status, setStatus] = useState<DeviceBatteryStatus>(INITIAL)

  useEffect(() => {
    let cancelled = false
    let battery: BatteryManager | null = null
    const slowMq = window.matchMedia('(update: slow)')

    const applyLowPower = (lowPowerMode: boolean) => {
      if (cancelled) return
      setStatus((current) => ({ ...current, lowPowerMode }))
    }

    const onSlowMqChange = () => {
      applyLowPower(readLowPowerMediaQuery())
    }

    const onBatteryChange = () => {
      if (!battery || cancelled) return
      setStatus(syncFromBatteryManager(battery, readLowPowerMediaQuery()))
    }

    slowMq.addEventListener('change', onSlowMqChange)

    void probeLowPowerMode().then((lowPowerMode) => {
      if (cancelled) return
      applyLowPower(lowPowerMode)
    })

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      void probeLowPowerMode().then((lowPowerMode) => {
        if (cancelled) return
        applyLowPower(lowPowerMode)
      })
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    if (typeof navigator.getBattery !== 'function') {
      return () => {
        cancelled = true
        slowMq.removeEventListener('change', onSlowMqChange)
        document.removeEventListener('visibilitychange', onVisibilityChange)
      }
    }

    void navigator
      .getBattery()
      .then((manager) => {
        if (cancelled) return

        battery = manager
        setStatus(syncFromBatteryManager(manager, readLowPowerMediaQuery()))

        manager.addEventListener('levelchange', onBatteryChange)
        manager.addEventListener('chargingchange', onBatteryChange)
      })
      .catch(() => {
        if (cancelled) return
        setStatus((current) => ({ ...current, supported: false }))
      })

    return () => {
      cancelled = true
      slowMq.removeEventListener('change', onSlowMqChange)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (battery) {
        battery.removeEventListener('levelchange', onBatteryChange)
        battery.removeEventListener('chargingchange', onBatteryChange)
      }
    }
  }, [])

  return status
}
