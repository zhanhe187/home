/*!
 * 液态卡片 / Liquid cards
 * Shader adapted from LeiBox "shader-flood" (vanilla package).
 * Design reference: Ashish Gogula / Planes — independent reconstruction by LeiBox.
 * Modified for this static site: per-card canvas, glass cards, no pinned state.
 */
(function () {
  'use strict';

  var VERT = [
    'attribute vec2 position;',
    'varying vec2 uv;',
    'void main(){ uv = position * .5 + .5; gl_Position = vec4(position, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    '#extension GL_OES_standard_derivatives : enable',
    'precision highp float;',
    'varying vec2 uv;',
    'uniform vec2 uSize;',
    'uniform vec2 uOrigin;',
    'uniform float uProgress;',
    'uniform float uTime;',
    'uniform float uSeed;',
    'uniform float uRadius;',
    'uniform vec3 uLow;',
    'uniform vec3 uMid;',
    'uniform vec3 uHigh;',
    'float hash(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hash(i), hash(i + vec2(1.,0.)), f.x), mix(hash(i + vec2(0.,1.)), hash(i + 1.), f.x), f.y); }',
    'float fbm(vec2 p){ float n = 0., a = .533; mat2 m = mat2(.8,.6,-.6,.8); for(int i = 0; i < 4; i++){ n += a * noise(p); p = m * p * 2.03 + vec2(4.7,1.3); a *= .5; } return n; }',
    'void main(){',
    '  vec2 pixel = vec2(uv.x, 1.0 - uv.y) * uSize;',
    '  vec2 b = uSize * .5 - 1.0;',
    '  vec2 d = abs(pixel - uSize * .5) - b + uRadius;',
    '  float rounded = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - uRadius;',
    '  float radius = uProgress * 1.5 * length(uSize) * .70710678;',
    '  float circle = length(pixel - uOrigin * uSize) - radius;',
    '  float alpha = (1.0 - smoothstep(-.65, .65, rounded)) * (1.0 - smoothstep(-.65, .65, circle));',
    '  if (alpha < .001) discard;',
    '  vec2 p = (uv - .5) * vec2(uSize.x / uSize.y, 1.0) * 2.4 + vec2(uSeed * .173, uSeed * .097);',
    '  float t = uTime * .15;',
    '  vec2 q = vec2(fbm(p + vec2(t * .22, -t * .17)), fbm(p + vec2(5.2, 1.3) + vec2(-t * .18, t * .23))) - .5;',
    '  vec2 r = vec2(fbm(p + 3.3 * q + vec2(1.7, 9.2) + t * .13), fbm(p + 3.3 * q + vec2(8.3, 2.8) - t * .12)) - .5;',
    '  float field = fbm(p + 3.0 * r + 1.0 * q);',
    '  float f = smoothstep(.17, .77, field);',
    '  vec3 color = mix(uLow, uMid, smoothstep(.05, .57, f));',
    '  color = mix(color, uHigh, pow(smoothstep(.72, .99, f), 1.7) * .58);',
    '  float slope = length(vec2(dFdx(field), dFdy(field))) * uSize.y * .17;',
    '  float crease = (1.0 - smoothstep(.006, .034, abs(field - .43))) * .88;',
    '  crease += (1.0 - smoothstep(.003, .018, abs(field - .59))) * .24;',
    '  color = mix(color, uLow * .28, min(crease, .94));',
    '  color += uHigh * pow(max(0.0, 1.0 - slope * 2.0), 8.0) * .025;',
    '  color *= mix(.24, 1.12, smoothstep(-.08, 1.0, uv.y));',
    '  gl_FragColor = vec4(color, alpha);',
    '}'
  ].join('\n');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var cards = [];

  function hexToRgb(hex) {
    hex = String(hex || '').trim().replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var n = parseInt(hex, 16);
    if (!isFinite(n)) return [0.2, 0.4, 0.8];
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

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

  function LiquidCard(el, index) {
    this.el = el;
    this.canvas = el.querySelector('canvas');
    this.index = index;
    this.progress = 0;
    this.target = 0;
    this.time = index * 1.7;
    this.raf = 0;
    this.last = 0;
    this.started = false;
    this.gl = null;
    this.parts = String(el.dataset.colors || '').split(',').map(hexToRgb);
    if (this.parts.length < 3) this.parts = [[0.04, 0.16, 0.36], [0.23, 0.55, 1], [0.81, 0.89, 1]];
  }

  LiquidCard.prototype.init = function () {
    var canvas = this.canvas;
    if (!canvas) return;
    var opts = { alpha: true, antialias: false, premultipliedAlpha: false, depth: false, stencil: false, preserveDrawingBuffer: true, powerPreference: 'low-power' };
    var gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
    if (!gl) {
      this.el.classList.add('no-webgl');
      return;
    }
    gl.getExtension('OES_standard_derivatives');
    this.gl = gl;

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      this.el.classList.add('no-webgl');
      return;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      this.el.classList.add('no-webgl');
      return;
    }
    gl.useProgram(prog);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.u = {
      size: gl.getUniformLocation(prog, 'uSize'),
      origin: gl.getUniformLocation(prog, 'uOrigin'),
      progress: gl.getUniformLocation(prog, 'uProgress'),
      time: gl.getUniformLocation(prog, 'uTime'),
      seed: gl.getUniformLocation(prog, 'uSeed'),
      radius: gl.getUniformLocation(prog, 'uRadius'),
      low: gl.getUniformLocation(prog, 'uLow'),
      mid: gl.getUniformLocation(prog, 'uMid'),
      high: gl.getUniformLocation(prog, 'uHigh')
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.uniform3fv(this.u.low, this.parts[0]);
    gl.uniform3fv(this.u.mid, this.parts[1]);
    gl.uniform3fv(this.u.high, this.parts[2]);
    gl.uniform1f(this.u.seed, 1.6 + this.index * 2.3);
    gl.uniform2f(this.u.origin, 0.5, 0.55);

    this.resize = this.resize.bind(this);
    this.onEnter = this.onEnter.bind(this);
    this.onLeave = this.onLeave.bind(this);
    this.tick = this.tick.bind(this);

    if (window.ResizeObserver) {
      this.ro = new ResizeObserver(this.resize);
      this.ro.observe(this.el);
    } else {
      window.addEventListener('resize', this.resize);
    }

    var self = this;
    this.el.addEventListener('pointerenter', this.onEnter);
    this.el.addEventListener('pointerleave', this.onLeave);
    this.el.addEventListener('focusin', this.onEnter);
    this.el.addEventListener('focusout', this.onLeave);
    this.el.addEventListener('touchstart', function () { self.target = self.target ? 0 : 1; self.kick(); }, { passive: true });

    this.resize();
    this.draw(0);
  };

  LiquidCard.prototype.resize = function () {
    if (!this.gl) return;
    var rect = this.el.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width === w && this.canvas.height === h) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this.gl.viewport(0, 0, w, h);
    this.gl.uniform2f(this.u.size, w, h);
    var radius = Math.max(18, Math.min(30, rect.width * 0.075)) * dpr;
    this.gl.uniform1f(this.u.radius, radius);
    this.draw(this.time);
  };

  LiquidCard.prototype.onEnter = function () { this.target = 1; this.kick(); };
  LiquidCard.prototype.onLeave = function () { this.target = 0; this.kick(); };

  LiquidCard.prototype.kick = function () {
    if (this.raf) return;
    this.last = 0;
    this.raf = requestAnimationFrame(this.tick);
  };

  LiquidCard.prototype.tick = function (now) {
    this.raf = 0;
    var dt = this.last ? Math.min(64, now - this.last) : 16;
    this.last = now;
    var speed = reduced.matches ? 0 : dt / 1000;
    this.time += speed;
    this.progress += (this.target - this.progress) * (reduced.matches ? 1 : 0.11);
    if (Math.abs(this.target - this.progress) < 0.003) this.progress = this.target;
    this.draw(this.time);
    var active = this.progress > 0.34;
    if (active !== this.el.classList.contains('is-liquid')) {
      this.el.classList.toggle('is-liquid', active);
    }
    var settled = this.progress === this.target && this.target === 0;
    if (!settled) {
      this.raf = requestAnimationFrame(this.tick);
    }
  };

  LiquidCard.prototype.draw = function (time) {
    if (!this.gl) return;
    var gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(this.u.progress, this.progress);
    gl.uniform1f(this.u.time, time || 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  function boot() {
    var els = Array.prototype.slice.call(document.querySelectorAll('.lc'));
    if (!els.length) return;

    els.forEach(function (el, i) {
      var card = new LiquidCard(el, i);
      cards.push(card);
      if (!('IntersectionObserver' in window)) {
        card.init();
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !card.started) {
            card.started = true;
            card.init();
            io.disconnect();
          }
        });
      }, { rootMargin: '120px' });
      io.observe(el);
    });

    document.addEventListener('visibilitychange', function () {
      cards.forEach(function (card) {
        if (!card.gl) return;
        if (document.hidden) {
          if (card.raf) { cancelAnimationFrame(card.raf); card.raf = 0; }
        } else if (card.progress !== card.target || card.progress > 0) {
          card.kick();
        }
      });
    });

    reduced.addEventListener('change', function () {
      cards.forEach(function (card) { if (card.gl) card.kick(); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
