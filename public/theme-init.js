(function () {
  try {
    var k = 'theme'
    var t = localStorage.getItem(k)
    var d =
      t === 'light' || t === 'dark'
        ? t
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
    document.documentElement.dataset.theme = d
    document.documentElement.style.colorScheme = d
  } catch (e) {}
})()
