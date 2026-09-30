// Fullscreen image viewer for project galleries.
// Click a gallery image to open it; arrows / swipe to move, Esc or backdrop click to close.
(function () {
  var figures = Array.prototype.slice.call(document.querySelectorAll('.project-gallery figure'));
  if (!figures.length) return;

  var box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Image viewer');
  box.innerHTML =
    '<button class="lb-close" aria-label="Close">&times;</button>' +
    '<button class="lb-prev" aria-label="Previous image">&#8249;</button>' +
    '<img alt="">' +
    '<div class="lb-caption"><span class="lb-text"></span><span class="lb-count"></span></div>' +
    '<button class="lb-next" aria-label="Next image">&#8250;</button>';
  document.body.appendChild(box);

  var img = box.querySelector('img');
  var text = box.querySelector('.lb-text');
  var count = box.querySelector('.lb-count');
  var prev = box.querySelector('.lb-prev');
  var next = box.querySelector('.lb-next');
  var closeBtn = box.querySelector('.lb-close');
  var current = 0;
  var lastFocus = null;

  if (figures.length < 2) {
    prev.hidden = true;
    next.hidden = true;
  }

  function show(i) {
    current = (i + figures.length) % figures.length;
    var fig = figures[current];
    var src = fig.querySelector('img');
    var cap = fig.querySelector('figcaption');
    img.src = src.getAttribute('src');
    img.alt = src.alt;
    text.textContent = cap ? cap.textContent : src.alt;
    count.textContent = figures.length > 1 ? (current + 1) + ' / ' + figures.length : '';
  }

  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    box.classList.add('open');
    document.body.classList.add('lb-lock');
    closeBtn.focus();
  }

  function close() {
    box.classList.remove('open');
    document.body.classList.remove('lb-lock');
    if (lastFocus) lastFocus.focus();
  }

  figures.forEach(function (fig, i) {
    fig.tabIndex = 0;
    fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', 'View image full screen: ' + fig.querySelector('img').alt);
    fig.addEventListener('click', function () { open(i); });
    fig.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(i);
      }
    });
  });

  prev.addEventListener('click', function (e) { e.stopPropagation(); show(current - 1); });
  next.addEventListener('click', function (e) { e.stopPropagation(); show(current + 1); });
  closeBtn.addEventListener('click', close);
  box.addEventListener('click', function (e) {
    if (e.target === box) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
    else if (e.key === 'Tab') {
      // Keep focus inside the viewer
      var focusable = [closeBtn, prev, next].filter(function (b) { return !b.hidden; });
      var idx = focusable.indexOf(document.activeElement);
      e.preventDefault();
      var step = e.shiftKey ? -1 : 1;
      focusable[(idx + step + focusable.length) % focusable.length].focus();
    }
  });

  // Swipe between images on touch screens
  var startX = null;
  box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50 && figures.length > 1) show(current + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();
