/*!
 * 液体玻璃 / Liquid glass
 * Shader adapted from LeiBox "blue-fluted-glass" (vanilla package).
 * Design reference: sasha birukoff — independent procedural reconstruction by LeiBox.
 * Modified for this site: no logo, no pause button, palette uniforms, page integration.
 */
(function () {
  'use strict';

  var VERT = [
    'attribute vec2 position;',
    'void main(){ gl_Position = vec4(position, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform vec2 resolution;',
    'uniform float time;',
    'uniform vec3 c0;',
    'uniform vec3 c1;',
    'uniform vec3 c2;',
    'uniform vec3 c3;',
    'uniform vec3 c4;',
    'float blob(vec2 p, vec2 center, vec2 radius, float angle){',
    '  p -= center;',
    '  float c = cos(angle), s = sin(angle);',
    '  p = mat2(c, -s, s, c) * p / radius;',
    '  return exp(-dot(p, p));',
    '}',
    'vec3 fluid(vec2 p, float t){',
    '  float s = sin(t), c = cos(t);',
    '  p.x += .025 * sin(p.y * 7.0 + t * 2.0);',
    '  float trunk = blob(p, vec2(.52 + .15 * s - .07 * sin(t * 2.0), .76), vec2(.235, .46), -.12 - .52 * s);',
    '  float crown = blob(p, vec2(.77 - .55 * s, .20 - .10 * sin(t * 2.0)), vec2(.235, .23), -.50 + .45 * s);',
    '  float baseY = 1.045 - .17 * p.x + .075 * sin(p.x * 5.0 + t * 2.0);',
    '  float base = exp(-pow((p.y - baseY) / .092, 2.0));',
    '  float hole = blob(p, vec2(.85 - .55 * s, .59 - .13 * s), vec2(.19 + .025 * c, .32), .1 + .5 * s);',
    '  float density = (trunk + .56 * crown + .90 * base) * (1.0 - .78 * hole);',
    '  vec3 color = mix(c0, c1, smoothstep(.015, .20, density));',
    '  color = mix(color, c2, smoothstep(.16, .49, density));',
    '  color = mix(color, c3, smoothstep(.40, .73, density));',
    '  color = mix(color, c4, smoothstep(.62, .93, density));',
    '  return color;',
    '}',
    'void main(){',
    '  vec2 uv = vec2(gl_FragCoord.x / resolution.x, 1.0 - gl_FragCoord.y / resolution.y);',
    '  float rib = fract(uv.x * 71.0) - .5;',
    '  vec2 refracted = uv + vec2(rib * .018, (rib * rib - .0833) * .034);',
    '  float t = time * 6.28318530718 / 28.0;',
    '  vec3 color = fluid(refracted, t) * .40;',
    '  color += fluid(refracted + vec2(0., .025), t) * .24;',
    '  color += fluid(refracted - vec2(0., .025), t) * .24;',
    '  color += fluid(refracted + vec2(0., .055), t) * .06;',
    '  color += fluid(refracted - vec2(0., .055), t) * .06;',
    '  float edge = pow(abs(rib) * 2.0, 10.0);',
    '  float blue = (1.0 - color.r) * smoothstep(.02, .18, color.b - color.r);',
    '  color += vec3(.018, .025, .03) * (rib * .65 + edge * .24) * blue;',
    '  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  var PALETTES = {
    light: [
      [0.055, 0.155, 0.34],
      [0.10, 0.42, 0.70],
      [0.10, 0.62, 0.80],
      [0.02, 0.10, 0.24],
      [0.004, 0.022, 0.07]
    ],
    dark: [
      [0.045, 0.13, 0.29],
      [0.08, 0.36, 0.62],
      [0.06, 0.56, 0.72],
      [0.018, 0.085, 0.21],
      [0.003, 0.018, 0.06]
    ]
  };

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function mount(canvas, host) {
    var opts = { alpha: false, antialias: false, depth: false, preserveDrawingBuffer: true, powerPreference: 'low-power' };
    var gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
    if (!gl) {
      host.classList.add('no-webgl');
      return null;
    }

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      host.classList.add('no-webgl');
      return null;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      host.classList.add('no-webgl');
      return null;
    }
    gl.useProgram(prog);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var u = {
      resolution: gl.getUniformLocation(prog, 'resolution'),
      time: gl.getUniformLocation(prog, 'time'),
      colors: [0, 1, 2, 3, 4].map(function (i) { return gl.getUniformLocation(prog, 'c' + i); })
    };

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    var raf = 0;
    var last = 0;
    var time = 4;
    var visible = false;
    var destroyed = false;

    function colors() {
      var p = PALETTES[theme] || PALETTES.light;
      for (var i = 0; i < 5; i++) gl.uniform3fv(u.colors[i], p[i]);
    }

    function resize() {
      if (!gl || destroyed) return;
      var rect = host.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = Math.max(1, Math.round(rect.width * dpr));
      var h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(u.resolution, w, h);
      }
      draw();
    }

    function draw() {
      if (!gl || destroyed) return;
      gl.uniform1f(u.time, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function tick(now) {
      raf = 0;
      if (!visible || document.hidden || destroyed) return;
      var dt = last ? Math.min(64, now - last) : 16;
      last = now;
      if (!reduced.matches) time += dt / 1000;
      draw();
      raf = requestAnimationFrame(tick);
    }

    function start() {
      if (raf || !visible || reduced.matches) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    }

    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (visible) start();
    });
    reduced.addEventListener('change', function () {
      stop();
      if (visible && !reduced.matches) start();
      draw();
    });

    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }, { rootMargin: '160px' });
      io.observe(host);
    } else {
      visible = true;
    }

    colors();
    resize();

    var api = {
      setTheme: function (next) {
        theme = next === 'dark' ? 'dark' : 'light';
        colors();
        draw();
      },
      refresh: resize,
      destroy: function () {
        destroyed = true;
        stop();
        gl.getExtension('WEBGL_lose_context') && gl.getExtension('WEBGL_lose_context').loseContext();
      }
    };

    if (visible) start();
    return api;
  }

  function boot() {
    var host = document.querySelector('.live');
    var canvas = document.getElementById('liquidGlass');
    if (!host || !canvas) return;
    var api = mount(canvas, host);
    if (!api) return;
    window.__liquidGlass = api;
    window.addEventListener('pj:theme', function (e) {
      api.setTheme(e.detail && e.detail.theme);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
