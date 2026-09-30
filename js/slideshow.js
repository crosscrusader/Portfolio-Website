// Home page hero slideshow: crossfades between renders every few seconds.
// Pauses while the tab is hidden and when the visitor prefers reduced motion.
(function () {
  var show = document.querySelector('.showcase');
  if (!show) return;

  var slides = Array.prototype.slice.call(show.querySelectorAll('.slide'));
  var dots = Array.prototype.slice.call(show.querySelectorAll('.slide-dots button'));
  var label = show.querySelector('.slide-label');
  var labelNum = label && label.querySelector('span');
  var labelText = label && label.querySelector('.slide-name');
  var DELAY = 5500;
  var current = 0;
  var timer = null;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function go(i) {
    slides[current].classList.remove('is-active');
    dots[current].removeAttribute('aria-current');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dots[current].setAttribute('aria-current', 'true');
    if (label) {
      label.href = slides[current].getAttribute('data-href');
      labelNum.textContent = pad(current + 1) + ' / ' + pad(slides.length);
      labelText.textContent = slides[current].getAttribute('data-title');
    }
  }

  function start() {
    if (reduceMotion || timer || slides.length < 2) return;
    timer = setInterval(function () { go(current + 1); }, DELAY);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      stop();
      go(i);
      start();
    });
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else start();
  });

  go(0);
  start();
})();
