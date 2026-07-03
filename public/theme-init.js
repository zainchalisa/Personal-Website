(function () {
  try {
    var d = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    document.documentElement.dataset.theme = d
    document.documentElement.style.colorScheme = d
    var meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', d === 'dark' ? '#1a3a5c' : '#c7d4f0')
    }
  } catch (e) {}
})()
