/* Watchlist splash v2 — shared runtime for options 04–06. No dependencies.
   WLSplash.start(root, {onDone, reduced, keep}) — root is the .wl-splash element.
   - Clones the scene <template class="wl-scene-src"> into dark, spotlight and glint layers. The letters sit in the scene, invisible in the dark.
   - After the beam passes a letter, the logo copy of that letter fades up and stays lit (timing from --sweep-delay / --sweep-dur).
   - Hides [data-wl-banner-title] until the flying logo lands on it, then removes the splash.
   - No skip: the splash always plays in full (about 5s). */
(function () {
  var HOLD_MS = 2000, CIRC = 201;
  function start(root, opts) {
    opts = opts || {};
    var reduced = opts.reduced != null ? opts.reduced : matchMedia('(prefers-reduced-motion: reduce)').matches;
    var scene = root.querySelector('.wl-splash__scene');
    var src = root.querySelector('template.wl-scene-src');
    var vignette = scene.querySelector('.wl-splash__vignette');
    ['dim', 'spot', 'glint'].forEach(function (k) {
      var l = document.createElement('div');
      l.className = 'wl-layer wl-layer--' + k;
      l.appendChild(src.content.cloneNode(true));
      scene.insertBefore(l, vignette);
    });
    if (reduced) root.classList.add('wl-splash--reduced');
    var title = document.querySelector('[data-wl-banner-title]');
    if (title) title.style.visibility = 'hidden';
    var logo = root.querySelector('.wl-logo');
    var fly = root.querySelector('.wl-logo__fly');
    var done = false;

    function finish() {
      if (done) return; done = true;
      if (title) title.style.visibility = '';
      if (!opts.keep) root.remove();
      if (opts.onDone) opts.onDone();
    }

    (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
      if (done) return;
      var r = root.getBoundingClientRect();
      var cs = getComputedStyle(root);
      var sd = parseFloat(cs.getPropertyValue('--sweep-delay')) || 0.4;
      var sdur = parseFloat(cs.getPropertyValue('--sweep-dur')) || 2.4;
      var wr = fly.querySelector('.wl-word').getBoundingClientRect();
      root.style.setProperty('--ex', (wr.left + wr.width / 2 - r.left) + 'px');
      root.style.setProperty('--ey', (wr.top + wr.height / 2 - r.top) + 'px');
      // Beam centre travels from -15% to 115% of the width; a letter's afterglow starts once the centre has passed it.
      [].forEach.call(fly.querySelectorAll('.wl-word > span'), function (sp) {
        var b = sp.getBoundingClientRect();
        var x = (b.right - r.left) / r.width;
        sp.style.animationDelay = (sd + sdur * (x + 0.15) / 1.3).toFixed(3) + 's';
      });
      var anim;
      var dx, dy, s, ok = false;
      if (!reduced && title) {
        var f = fly.getBoundingClientRect(), t = title.getBoundingClientRect();
        var word = fly.querySelector('.wl-word');
        s = parseFloat(getComputedStyle(title).fontSize) / parseFloat(getComputedStyle(word).fontSize);
        dx = (t.left + t.width / 2) - (f.left + f.width / 2);
        dy = (t.top + t.height / 2) - (f.top + f.height / 2);
        ok = isFinite(dx) && isFinite(dy) && isFinite(s) && s > 0 && t.width > 0;
      }
      if (!ok) {
        anim = logo.animate([{ opacity: 1 }, { opacity: 0 }], { delay: reduced ? 1200 : 4450, duration: 400, fill: 'forwards' });
      } else {
        anim = fly.animate([{ transform: 'none' }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')' }],
          { delay: 4450, duration: 600, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'forwards' });
      }
      // Scrubbing previews pause everything; elapsed time is aligned with the CSS animations.
      anim.currentTime = (document.timeline.currentTime - startedAt);
      anim.finished.then(finish, function () {});
      // Safety net: never leave the banner title hidden.
      setTimeout(finish, (reduced ? 1600 : 5100) + 1500);
    });
    var startedAt = document.timeline.currentTime;

    return { finish: finish };
  }
  window.WLSplash = { start: start };
})();
