/*!
 * 项目搭建动效 / Cursor build
 * Adapted from LeiBox "multi-cursor-builder": only the cursor, marquee and build
 * rhythm are kept; the original 850KB English demo is not bundled.
 */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var grid = document.querySelector('[data-build]');
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.lc'));
  if (!cards.length) return;

  var replay = document.querySelector('.build-replay');
  var COLORS = ['#7fc4ff', '#a78bfa', '#5fe0c0'];
  var overlay = null;
  var playing = false;
  var seen = false;

  function wait(ms) {
    return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
  }

  function makeCursor(color, label) {
    var el = document.createElement('div');
    el.className = 'cb-cursor';
    el.style.setProperty('--cb', color);
    el.innerHTML =
      '<svg viewBox="0 0 20 20" aria-hidden="true">' +
      '<path d="M3 2.4 16.4 9.6l-5.7 1.3-3.4 4.9L3 2.4Z" fill="' + color + '" stroke="#fff" stroke-width="1.1" stroke-linejoin="round"/>' +
      '</svg><b>' + label + '</b>';
    el.style.opacity = '0';
    return el;
  }

  function makeBox(box, color, final) {
    var el = document.createElement('div');
    el.className = 'cb-box' + (final ? ' cb-box--final' : '');
    el.style.setProperty('--cb', color);
    el.style.left = box.x + 'px';
    el.style.top = box.y + 'px';
    el.style.width = box.w + 'px';
    el.style.height = box.h + 'px';
    for (var i = 0; i < 4; i++) {
      var h = document.createElement('span');
      h.className = 'cb-h';
      el.appendChild(h);
    }
    return el;
  }

  function move(el, to, duration) {
    var from = el._pos || to;
    el._pos = to;
    var anim = el.animate(
      [
        { transform: 'translate3d(' + from.x + 'px,' + from.y + 'px,0)' },
        { transform: 'translate3d(' + to.x + 'px,' + to.y + 'px,0)' }
      ],
      { duration: duration, easing: 'cubic-bezier(.22,.8,.24,1)', fill: 'both' }
    );
    return anim.finished.catch(function () {}).then(function () {
      el.style.transform = 'translate3d(' + to.x + 'px,' + to.y + 'px,0)';
      anim.cancel();
    });
  }

  function fade(el, to, duration) {
    el.style.opacity = String(to);
    return el.animate(
      [{ opacity: to === 1 ? 0 : 1 }, { opacity: to }],
      { duration: duration, easing: 'ease-out', fill: 'both' }
    ).finished.catch(function () {});
  }

  function cardBox(card) {
    return {
      x: card.offsetLeft + 3,
      y: card.offsetTop + 3,
      w: card.offsetWidth - 6,
      h: card.offsetHeight - 6
    };
  }

  async function play() {
    if (playing) return;
    if (reduce.matches) return;
    playing = true;
    if (replay) {
      replay.classList.add('is-playing');
      replay.disabled = true;
    }

    try {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'cb';
        overlay.setAttribute('aria-hidden', 'true');
        grid.appendChild(overlay);
      }
      overlay.replaceChildren();
      cards.forEach(function (card) { card.classList.remove('is-built'); });
      grid.classList.add('is-pending');
      await wait(80);

      var boxes = cards.map(cardBox);
      var cursors = cards.map(function (card, i) {
        var box = boxes[i];
        var el = makeCursor(COLORS[i % COLORS.length], String(i + 1).padStart(2, '0'));
        overlay.appendChild(el);
        el._pos = { x: box.x + box.w - 42, y: box.y + 22 };
        el.style.transform = 'translate3d(' + el._pos.x + 'px,' + el._pos.y + 'px,0)';
        return el;
      });

      for (var i = 0; i < boxes.length; i++) {
        var box = boxes[i];
        var cursor = cursors[i];
        var color = COLORS[i % COLORS.length];

        fade(cursor, 1, 180);
        await move(cursor, { x: box.x + 10, y: box.y + 10 }, 300);

        var outline = makeBox(box, color, false);
        overlay.appendChild(outline);
        var draw = outline.animate(
          [
            { clipPath: 'inset(0 100% 0 0)' },
            { clipPath: 'inset(0 0 0 0)' }
          ],
          { duration: 280, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'both' }
        );

        cards[i].classList.add('is-built');
        await Promise.all([
          move(cursor, { x: box.x + box.w - 44, y: box.y + box.h - 30 }, 280),
          draw.finished.catch(function () {})
        ]);

        window.setTimeout(function (el) {
          el.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 280,
            delay: 180,
            fill: 'both',
            easing: 'ease-out'
          });
          window.setTimeout(function () { el.remove(); }, 520);
        }, 0, outline);

        fade(cursor, 0, 180);
        await wait(100);
      }

      var frame = {
        x: 8,
        y: 8,
        w: grid.clientWidth - 16,
        h: grid.clientHeight - 16
      };
      var final = makeBox(frame, COLORS[0], true);
      overlay.appendChild(final);
      final.animate(
        [
          { opacity: 0, clipPath: 'inset(0 0 0 100%)' },
          { opacity: 1, clipPath: 'inset(0 0 0 0)' }
        ],
        { duration: 360, easing: 'ease-out', fill: 'both' }
      );
      await wait(620);
      final.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 280,
        fill: 'both',
        easing: 'ease-out'
      });
      await wait(300);
    } finally {
      grid.classList.remove('is-pending');
      cards.forEach(function (card) { card.classList.add('is-built'); });
      if (overlay) overlay.replaceChildren();
      if (replay) {
        replay.classList.remove('is-playing');
        replay.disabled = false;
      }
      playing = false;
    }
  }

  if (reduce.matches) {
    if (replay) replay.hidden = true;
    return;
  }

  grid.classList.add('is-pending');

  if (replay) {
    replay.hidden = false;
    replay.addEventListener('click', function () { play(); });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (seen) return;
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        seen = true;
        io.disconnect();
        window.setTimeout(play, 200);
      }
    }, { threshold: 0.18 });
    io.observe(grid);
    window.setTimeout(function () {
      if (!playing && !grid.querySelector('.is-built')) {
        grid.classList.remove('is-pending');
        cards.forEach(function (card) { card.classList.add('is-built'); });
      }
    }, 8000);
  } else {
    cards.forEach(function (card) { card.classList.add('is-built'); });
  }
})();
