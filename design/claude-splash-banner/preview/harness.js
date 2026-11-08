// Preview-only controls: replay, frame size, reduced motion, hold final frame. Not for integration.
(function () {
  var q = new URLSearchParams(location.search);
  var frame = document.getElementById('frame');
  var mount = document.getElementById('mount');
  var tpl = document.getElementById('splash-tpl');
  var app = frame.querySelector('.pv-app');
  var reduced = q.get('reduced') === '1';
  if (q.get('embed')) document.body.classList.add('pv-embed');
  if (q.get('hold') === '1') frame.classList.add('pv-hold');

  var embedded = !!q.get('embed');
  function play() {
    mount.innerHTML = '';
    // Phone frame: render a real 412px iframe so vw units resolve to the phone width.
    if (!embedded && frame.dataset.frame === 'phone') {
      var f = document.createElement('iframe');
      f.src = location.pathname.split('/').pop() + '?embed=phone' + (reduced ? '&reduced=1' : '') + (frame.classList.contains('pv-hold') ? '&hold=1' : '');
      f.title = 'Phone preview'; f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;z-index:2';
      mount.appendChild(f);
      return;
    }
    var node = tpl.content.firstElementChild.cloneNode(true);
    if (reduced) node.classList.add('wl-splash--reduced');
    node.addEventListener('pointerdown', function () { node.classList.add('wl-splash--dismiss'); });
    mount.appendChild(node);
  }
  function setFrame(f) {
    frame.dataset.frame = f;
    app.src = f === 'phone' ? '../preview/app-phone.png' : '../preview/app-desktop.png';
    document.querySelectorAll('[data-set-frame]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setFrame === f)); });
    play();
  }
  document.querySelectorAll('[data-set-frame]').forEach(function (b) { b.onclick = function () { setFrame(b.dataset.setFrame); }; });
  var r = document.getElementById('pv-replay'); if (r) r.onclick = play;
  var rm = document.getElementById('pv-reduced'); if (rm) { rm.checked = reduced; rm.onchange = function () { reduced = rm.checked; play(); }; }
  var h = document.getElementById('pv-hold'); if (h) { h.checked = frame.classList.contains('pv-hold'); h.onchange = function () { frame.classList.toggle('pv-hold', h.checked); play(); }; }
  document.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('.pv-bar')) return;
    var s = mount.firstElementChild; if (s) s.classList.add('wl-splash--dismiss');
  });
  setFrame(q.get('frame') || q.get('embed') || 'desktop');
})();
