/* Lightweight cursor-build overlay.
   Adapted from LeiBox "multi-cursor-builder" (https://leibox.pantoria.cn):
   the original is a full-page English demo; this keeps only the
   3-cursor + selection-box construction rhythm for this project index. */
(() => {
  const portal = document.querySelector("[data-portal]");
  if (!portal) return;

  const rows = Array.from(portal.querySelectorAll(".portal__row"));
  const replay = portal.querySelector(".portal__count");
  if (!rows.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const COLORS = ["#0a63f5", "#7b3fff", "#00a884"];
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let overlay = null;
  let playing = false;
  let seen = false;

  const arrow = `
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path d="M2.2 1.6 15.4 8.9 9.2 10.1 6.5 15.6Z"
        fill="currentColor" stroke="#fff" stroke-width="1.1" stroke-linejoin="round"/>
    </svg>`;

  function makeCursor(color, label) {
    const el = document.createElement("div");
    el.className = "cb-cursor";
    el.style.setProperty("--cb", color);
    el.innerHTML = arrow + `<b>${label}</b>`;
    el.firstElementChild.style.color = color;
    el._pos = { x: -40, y: -40 };
    el.style.transform = "translate3d(-40px,-40px,0)";
    return el;
  }

  function makeBox(rect, color, isFinal = false) {
    const el = document.createElement("div");
    el.className = "cb-box" + (isFinal ? " cb-box--final" : "");
    el.style.setProperty("--cb", color);
    el.style.left = `${rect.x}px`;
    el.style.top = `${rect.y}px`;
    el.style.width = `${rect.w}px`;
    el.style.height = `${rect.h}px`;
    if (!isFinal) {
      for (let i = 0; i < 4; i++) {
        el.appendChild(document.createElement("span")).className = "cb-h";
      }
    }
    return el;
  }

  function move(el, to, duration) {
    const from = el._pos || to;
    el._pos = to;
    const anim = el.animate(
      [
        { transform: `translate3d(${from.x}px,${from.y}px,0)` },
        { transform: `translate3d(${to.x}px,${to.y}px,0)` },
      ],
      {
        duration,
        easing: "cubic-bezier(.22,.8,.24,1)",
        fill: "both",
      }
    );
    return anim.finished
      .catch(() => {})
      .then(() => {
        el.style.transform = `translate3d(${to.x}px,${to.y}px,0)`;
        anim.cancel();
      });
  }

  function rowRect(row) {
    return {
      x: row.offsetLeft,
      y: row.offsetTop,
      w: row.offsetWidth,
      h: row.offsetHeight,
    };
  }

  async function play() {
    if (playing || reduce.matches || !rows.length) return;
    if (typeof Element.prototype.animate !== "function") return;
    playing = true;

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "cb";
      overlay.setAttribute("aria-hidden", "true");
      portal.appendChild(overlay);
    }
    overlay.replaceChildren();
    rows.forEach((row) => {
      row.getAnimations().forEach((a) => a.cancel());
      row.style.opacity = "";
      row.style.transform = "";
    });

    const cursors = rows.map((row, i) => {
      const color = COLORS[i % COLORS.length];
      const cursor = makeCursor(color, String(i + 1).padStart(2, "0"));
      overlay.appendChild(cursor);
      const start = {
        x: portal.clientWidth + 20 + i * 12,
        y: row.offsetTop + Math.min(row.offsetHeight * 0.55, 50),
      };
      cursor._pos = start;
      cursor.style.transform = `translate3d(${start.x}px,${start.y}px,0)`;
      return cursor;
    });

    for (let i = 0; i < rows.length; i++) {
      const box = rowRect(rows[i]);
      const color = COLORS[i % COLORS.length];

      await move(cursors[i], { x: box.x - 10, y: box.y - 12 }, 330);

      const outline = makeBox(box, color);
      overlay.appendChild(outline);
      const draw = outline.animate(
        [
          { clipPath: "inset(0 100% 0 0)" },
          { clipPath: "inset(0 0 0 0)" },
        ],
        { duration: 300, easing: "cubic-bezier(.65,0,.35,1)", fill: "both" }
      );

      rows[i].animate(
        [
          { opacity: 0.45, transform: "translateY(6px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 380, easing: "ease-out", fill: "both" }
      );

      await Promise.all([
        move(cursors[i], { x: box.x + box.w - 30, y: box.y - 12 }, 290),
        draw.finished.catch(() => {}),
      ]);

      window.setTimeout(() => {
        outline.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 320,
          delay: 240,
          fill: "both",
          easing: "ease-out",
        });
        window.setTimeout(() => outline.remove(), 620);
      }, 0);
      await wait(70);
    }

    const head = portal.querySelector(".portal__head");
    const last = rows[rows.length - 1];
    const frame = {
      x: 8,
      y: Math.max(4, head.offsetTop - 4),
      w: portal.clientWidth - 16,
      h: last.offsetTop + last.offsetHeight - head.offsetTop + 8,
    };
    const final = makeBox(frame, COLORS[0], true);
    overlay.appendChild(final);
    final.animate(
      [
        { opacity: 0, clipPath: "inset(0 0 0 100%)" },
        { opacity: 1, clipPath: "inset(0 0 0 0)" },
      ],
      { duration: 400, easing: "ease-out", fill: "both" }
    );
    await wait(760);
    final.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 360,
      fill: "both",
      easing: "ease-out",
    });

    await Promise.all(
      cursors.map((cursor) =>
        move(
          cursor,
          { x: portal.clientWidth + 30, y: portal.clientHeight + 30 },
          380
        )
      )
    );
    await wait(280);
    overlay.replaceChildren();
    playing = false;
  }

  if (replay) {
    replay.addEventListener("click", () => {
      if (!playing) play();
    });
  }

  if (reduce.matches) return;

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (seen) return;
        if (entries.some((entry) => entry.isIntersecting)) {
          seen = true;
          io.disconnect();
          window.setTimeout(play, 520);
        }
      },
      { threshold: 0.35 }
    );
    io.observe(portal);
  } else {
    window.setTimeout(play, 700);
  }
})();
