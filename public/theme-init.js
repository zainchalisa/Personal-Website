(function () {
  try {
    var d = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    document.documentElement.dataset.theme = d
    document.documentElement.style.colorScheme = d
  } catch (e) {}
})()
