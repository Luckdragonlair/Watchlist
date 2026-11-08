// Presentation only: app/auth/IndexedDB startup runs independently underneath.
(function () {
  var root = document.querySelector('.wl-splash');
  var title = document.querySelector('[data-wl-banner-title]');
  if (!root) return;
  function cleanup() { root.remove(); if (title) title.style.visibility = ''; }
  // Independent of font promises/runtime success: never leave an overlay stranded.
  var watchdog = setTimeout(cleanup, 7000);
  try {
    if (matchMedia('(forced-colors: active)').matches) { clearTimeout(watchdog); cleanup(); return; }
    window.WLSplash.start(root, {onDone: function () { clearTimeout(watchdog); cleanup(); }});
  } catch (_) { clearTimeout(watchdog); cleanup(); }
})();
