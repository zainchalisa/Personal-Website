/** True for iPhone, iPad, and iPod — including iPadOS 13+ (reports as MacIntel). */
export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return true

  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

/** True for Android phones and tablets. */
export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

/** True for iOS and Android phones/tablets — regardless of viewport width. */
export function isMobileDevice(): boolean {
  return isIosDevice() || isAndroidDevice()
}
