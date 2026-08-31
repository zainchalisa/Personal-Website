(function () {
  try {
    var ua = navigator.userAgent
    var ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    var android = /Android/i.test(ua)
    var d = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    document.documentElement.dataset.theme = d
    document.documentElement.style.colorScheme = d
    if (ios || android) {
      document.documentElement.dataset.layout = 'ios'
    } else {
      document.documentElement.dataset.layout = 'mac'
    }
    var meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', d === 'dark' ? '#1c3356' : '#cfcce8')
    }
  } catch (e) {}
})()
