/**
 * EduConta SV · Preloader Fractal Glass Engine
 * Motor ultra-optimizado con aceleración WebGL y Fallback CSS sin bloqueo de hilo principal.
 * Diseñado para transiciones instantáneas y cero retraso de renderizado.
 */
(() => {
    const pre = document.getElementById('global-preloader');
    if (!pre) return;

    // Sincronizar el logotipo del preloader: gráfica arriba en loop continuo y texto abajo estático en posición exacta
    try {
        const lc = pre.querySelector('.loader-container');
        if (lc && !lc.querySelector('.logo-wrap')) {
            const loadingText = lc.querySelector('.loading-text');
            const ltHTML = loadingText ? loadingText.outerHTML : '<div class="loading-text">Cargando entorno<div class="dots"><span>.</span><span>.</span><span>.</span></div></div>';
            lc.innerHTML = `
                <div class="logo-wrap glow">
                    <!-- Parte 1: Gráfica de Barras (Arriba en loop) -->
                    <svg class="icon-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <filter id="glowGPre" x="-400%" y="-100%" width="900%" height="300%" color-interpolation-filters="sRGB">
                                <feDropShadow class="fx" dx="0" dy="0" stdDeviation="1" style="flood-color:var(--gc)" result="a"/>
                                <feDropShadow class="fx" in="a" dx="0" dy="0" stdDeviation="3" style="flood-color:var(--gc)"/>
                            </filter>
                        </defs>
                        <rect class="bar bar-1" x="28.5" y="55" width="11" height="16" rx="1" fill="var(--b1)"/>
                        <rect class="bar bar-2" x="44.5" y="42" width="11" height="29" rx="1" fill="var(--b2)"/>
                        <g class="glow-g"><rect class="bar bar-3" x="60.5" y="27" width="11" height="44" rx="1" fill="var(--celeste-sv)"/></g>
                        <rect class="base-line" x="20" y="70" width="60" height="5" rx="1" fill="var(--base)"/>
                    </svg>

                    <!-- Parte 2: Texto EduConta SV (Abajo, posición exacta, sin animación) -->
                    <svg class="text-svg" viewBox="0 0 472 100" xmlns="http://www.w3.org/2000/svg">
                        <g font-family="'Plus Jakarta Sans', sans-serif" font-size="78">
                            <text x="0" y="75" font-weight="800" fill="var(--azul-corporativo)">E</text>
                            <text x="44.44" y="75" font-weight="800" fill="var(--azul-corporativo)">d</text>
                            <text x="95.44" y="75" font-weight="800" fill="var(--azul-corporativo)">u</text>
                            <text x="140.66" y="75" font-weight="300" fill="var(--azul-corporativo)">C</text>
                            <text x="200.39" y="75" font-weight="300" fill="var(--azul-corporativo)">o</text>
                            <text x="250.29" y="75" font-weight="300" fill="var(--azul-corporativo)">n</text>
                            <text x="293.41" y="75" font-weight="300" fill="var(--azul-corporativo)">t</text>
                            <text x="321.86" y="75" font-weight="300" fill="var(--azul-corporativo)">a</text>
                            <g class="glow-g">
                                <text x="365.05" y="75" font-weight="800" fill="var(--celeste-sv)">S</text>
                                <text x="414.02" y="75" font-weight="800" fill="var(--celeste-sv)">V</text>
                            </g>
                        </g>
                    </svg>
                </div>
            ` + ltHTML;
        }
    } catch (e) {}

    const TAU = Math.PI * 2;
    const r = (a, b) => a + Math.random() * (b - a);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Paleta estática de alta velocidad: CERO llamadas a getComputedStyle (evita forced synchronous reflow)
    const THEME_ACCENTS = {
        'theme-sky':     { l: [14, 165, 233],  d: [56, 189, 248] },
        'theme-amber':   { l: [245, 158, 11],  d: [251, 191, 36] },
        'theme-indigo':  { l: [99, 102, 241],  d: [129, 140, 248] },
        'theme-emerald': { l: [16, 185, 129],  d: [52, 211, 153] },
        'theme-purple':  { l: [168, 85, 247],  d: [192, 132, 252] }
    };

    const orbs = [...pre.querySelectorAll('.vol-blob')].map(el => ({
        el,
        ax: r(14, 26), ay: r(10, 18), fx: r(.06, .13), fy: r(.05, .11),
        px: r(0, TAU), py: r(0, TAU), fs: r(.04, .09), ps: r(0, TAU),
        fr: r(.02, .05), pr: r(0, TAU), pb: r(0, TAU)
    }));

    const orbit = (o, t) => ({
        x:  Math.sin(t * o.fx * TAU + o.px) * o.ax + Math.sin(t * o.fx * 2.7 * TAU + o.py) * o.ax * .35,
        y:  Math.cos(t * o.fy * TAU + o.py) * o.ay + Math.sin(t * o.fy * 2.3 * TAU + o.px) * o.ay * .35,
        sc: 1 + Math.sin(t * o.fs * TAU + o.ps) * .22,
        rot: Math.sin(t * o.fr * TAU + o.pr) * 30
    });

    const VS = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }';
    const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes; uniform float uScale, uFrame, uRest, uBand;
uniform vec4 uA[5]; uniform vec4 uB[5]; uniform vec3 uCol[5];
uniform vec3 uBg0, uBg1, uBg2, uHi, uLo, uVeil, uSheenC;
uniform vec4 uK;
uniform float uSheenX;
vec2 S;
float hash(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(.06711056, .00583715)))); }
float diagM(float t){
  if (t < .28) return mix(1., .1, t / .28);
  if (t < .40) return mix(.1, 0., (t - .28) / .12);
  if (t < .62) return mix(0., .8, (t - .40) / .22);
  if (t < .78) return mix(.8, 1., (t - .62) / .16);
  return mix(1., .2, (t - .78) / .22);
}
float vertM(float t){
  if (t < .28) return mix(.1, 1., t / .28);
  if (t < .58) return mix(1., .15, (t - .28) / .30);
  if (t < .84) return mix(.15, 1., (t - .58) / .26);
  return mix(1., 0., (t - .84) / .16);
}
vec3 bgAt(vec2 p){
  vec2 dir = vec2(.2588, .9659);
  float L = abs(S.x * dir.x) + abs(S.y * dir.y);
  float t = clamp(dot(p - S * .5, dir) / L + .5, 0., 1.);
  return t < .45 ? mix(uBg0, uBg1, t / .45) : mix(uBg1, uBg2, (t - .45) / .55);
}
vec3 field(vec2 p){
  vec3 c = bgAt(p);
  for (int i = 0; i < 5; i++){
    vec2 d = p - uA[i].xy;
    d = vec2(uB[i].x * d.x + uB[i].y * d.y, -uB[i].y * d.x + uB[i].x * d.y) / uA[i].zw;
    c = mix(c, uCol[i], exp(-2.2 * dot(d, d)) * uB[i].z);
  }
  float s = max(0., 1. - abs(p.x / S.x - uSheenX) / .4) * uK.w;
  return mix(c, uSheenC, s);
}
void main(){
  vec2 fc = gl_FragCoord.xy;
  S = uRes / uScale;
  vec2 p = vec2(fc.x, uRes.y - fc.y) / uScale;
  float rw = 34.;
  float idx = floor(p.x / rw), u = p.x / rw - idx;
  float h = hash(idx), h2 = hash(idx + 31.7);
  vec2 pr = vec2((idx + .5) * rw + (h - .5) * rw * 5. + (u - .5) * rw * .5, p.y);
  vec3 plain = field(p);
  vec3 refr = mix(bgAt(p), field(pr), 1. + (h2 - .5) * .6);
  float tD = clamp(dot(p - S * .5, vec2(.9659, .2588)) / (abs(S.x * .9659) + abs(S.y * .2588)) + .5, 0., 1.);
  float m = diagM(tD) * vertM(p.y / S.y) * (.25 + .75 * abs(2. * u - 1.));
  float band = max(0., 1. - abs(p.x / S.x - uBand) / .51);
  float amt = m * (uRest + (1. - uRest) * band);
  vec3 col = mix(plain, refr, clamp(amt * 1.2, 0., 1.));
  float hiP = max(1. - smoothstep(0., .147, u), smoothstep(.91, 1., u));
  float loP = smoothstep(.588, .912, u) * (1. - smoothstep(.912, 1., u));
  col = mix(col, uHi, hiP * uK.x * amt);
  col = mix(col, uLo, loP * uK.y * amt);
  col = mix(col, uVeil, uK.z * max(0., 1. - length((p / S - .5) / vec2(.45, .40))));
  float n = ign(fc + uFrame * vec2(5.588238, 3.1)) + ign(fc.yx * 1.37 + vec2(17.3, uFrame * 4.2)) - 1.;
  gl_FragColor = vec4(clamp(col + n / 255., 0., 1.), 1.);
}`;

    const startGL = () => {
        const cv = document.getElementById('volGL');
        const gl = cv && cv.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
        if (!gl) return false;

        try {
            const sh = (type, src) => {
                const o = gl.createShader(type);
                gl.shaderSource(o, src);
                gl.compileShader(o);
                if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o));
                return o;
            };
            const prog = gl.createProgram();
            gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
            gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
            gl.useProgram(prog);
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

            const loc = gl.getAttribLocation(prog, 'a');
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

            const U = n => gl.getUniformLocation(prog, n);
            const u = {
                res: U('uRes'), scale: U('uScale'), frame: U('uFrame'), rest: U('uRest'), band: U('uBand'),
                A: U('uA'), B: U('uB'), col: U('uCol'), bg0: U('uBg0'), bg1: U('uBg1'), bg2: U('uBg2'),
                hi: U('uHi'), lo: U('uLo'), veil: U('uVeil'), sheenC: U('uSheenC'), k: U('uK'), sheenX: U('uSheenX')
            };

            const rgb = (r, g, b) => [r / 255, g / 255, b / 255];
            let P;

            let lastThemeKey = '';
            const palette = () => {
                const dark = document.documentElement.dataset.theme === 'dark' || document.documentElement.classList.contains('dark');
                // Detección directa por clase O(1) SIN reflow
                const mTheme = pre.className.match(/theme-(sky|amber|indigo|emerald|purple)/);
                const themeKey = mTheme ? mTheme[0] : 'theme-sky';
                const stateKey = themeKey + (dark ? '-d' : '-l');
                if (stateKey === lastThemeKey && P) return;
                lastThemeKey = stateKey;

                const def = THEME_ACCENTS[themeKey] || THEME_ACCENTS['theme-sky'];
                const raw = dark ? def.d : def.l;
                const acc = rgb(raw[0], raw[1], raw[2]);
                const mixto = dark ? rgb(15, 23, 34) : [1, 1, 1];

                P = {
                    acc,
                    bg: dark ? [rgb(22, 33, 47), rgb(15, 23, 34), rgb(11, 18, 27)] : [rgb(246, 248, 251), rgb(246, 248, 251), rgb(246, 248, 251)],
                    cols: [.88, .68, .78, .60, .82].map(k => acc.map((v, i) => v * k + mixto[i] * (1 - k))),
                    hi: dark ? acc : [1, 1, 1],
                    lo: dark ? [0, 0, 0] : rgb(15, 23, 42),
                    veil: dark ? rgb(15, 23, 34) : rgb(246, 248, 251),
                    sheen: dark ? acc : [1, 1, 1],
                    k: dark ? [.22, .36, .55, .09] : [.54, .084, .7, .35]
                };
            };
            palette();

            let sc = 1;
            const resize = () => {
                // Usar window.innerWidth/Height evita forzar reflow del contenedor
                const w = window.innerWidth || 800;
                const h = window.innerHeight || 600;
                sc = Math.max(.5, Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(1.6e6 / (w * h))));
                cv.width = Math.round(w * sc);
                cv.height = Math.round(h * sc);
                gl.viewport(0, 0, cv.width, cv.height);
            };
            resize();

            const SZ = [[.35, .45], [.325, .425], [.375, .30], [.275, .375], [.30, .35]];
            const DUR = [9, 11, 13, 10, 12];
            const A = new Float32Array(20), B = new Float32Array(20), C = new Float32Array(15);
            let frame = 0;

            const draw = (t, still) => {
                const W = cv.width / sc, H = cv.height / sc, V = Math.max(W, H);
                const base = [
                    [.10 * V, .15 * V],
                    [W - .105 * V, .225 * V],
                    [.15 * W + .375 * V, H],
                    [.35 * W + .275 * V, .125 * V],
                    [.95 * W - .30 * V, H - .07 * V]
                ];
                for (let i = 0; i < 5; i++) {
                    const ob = orbs[i];
                    const o = orbit(ob, t);
                    const rad = o.rot * Math.PI / 180;
                    A.set([base[i][0] + o.x / 100 * W, base[i][1] + o.y / 100 * H, SZ[i][0] * V * o.sc, SZ[i][1] * V * o.sc], i * 4);
                    B.set([Math.cos(rad), Math.sin(rad), .12 + .18 * (.5 - .5 * Math.cos(Math.PI * t / DUR[i] + ob.pb)), 0], i * 4);
                    C.set(P.cols[i], i * 3);
                }
                const ph = (t % 15) / 15, q = Math.min(ph / .72, 1);
                gl.uniform2f(u.res, cv.width, cv.height);
                gl.uniform1f(u.scale, sc);
                gl.uniform1f(u.frame, frame++ % 1024);
                gl.uniform1f(u.rest, .12);
                gl.uniform1f(u.band, still ? -1 : -.5 + 2 * q * q * (3 - 2 * q));
                gl.uniform4fv(u.A, A);
                gl.uniform4fv(u.B, B);
                gl.uniform3fv(u.col, C);
                gl.uniform3fv(u.bg0, P.bg[0]);
                gl.uniform3fv(u.bg1, P.bg[1]);
                gl.uniform3fv(u.bg2, P.bg[2]);
                gl.uniform3fv(u.hi, P.hi);
                gl.uniform3fv(u.lo, P.lo);
                gl.uniform3fv(u.veil, P.veil);
                gl.uniform3fv(u.sheenC, P.sheen);
                gl.uniform4fv(u.k, P.k);
                gl.uniform1f(u.sheenX, .5 + .7 * Math.sin(t * .06 * TAU + 1.1));
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            };

            // Renderizar frame 0 inmediatamente de forma síncrona
            draw(0, false);

            const redraw = () => { palette(); if (reduce) draw(8, true); };
            new MutationObserver(redraw).observe(pre, { attributes: true, attributeFilter: ['class'] });
            new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
            window.addEventListener('resize', () => { resize(); if (reduce) draw(8, true); }, { passive: true });
            cv.addEventListener('webglcontextlost', e => { e.preventDefault(); pre.classList.add('no-gl'); startFallback(); });

            if (reduce) { draw(8, true); return true; }

            const t0 = performance.now();
            let animId;
            const loop = now => {
                if (!pre.isConnected) {
                    cancelAnimationFrame(animId);
                    const ext = gl.getExtension('WEBGL_lose_context');
                    if (ext) ext.loseContext();
                    return;
                }
                if (!pre.classList.contains('is-hidden') && !pre.classList.contains('loaded')) {
                    draw((now - t0) / 1000, false);
                    animId = requestAnimationFrame(loop);
                }
            };
            animId = requestAnimationFrame(loop);
            return true;
        } catch (err) {
            console.warn('[Preloader] WebGL no soportado, activando fallback CSS:', err);
            pre.classList.add('no-gl');
            return false;
        }
    };

    const startFallback = () => {
        if (reduce) return;
        const t0 = performance.now();
        let animId;
        const tick = now => {
            if (!pre.isConnected || !pre.classList.contains('no-gl')) {
                cancelAnimationFrame(animId);
                return;
            }
            if (!pre.classList.contains('is-hidden') && !pre.classList.contains('loaded')) {
                const t = (now - t0) / 1000;
                for (const ob of orbs) {
                    const o = orbit(ob, t);
                    ob.el.style.transform = `translate3d(${o.x.toFixed(2)}vw, ${o.y.toFixed(2)}vh, 0) scale(${o.sc.toFixed(3)}) rotate(${o.rot.toFixed(1)}deg)`;
                }
                animId = requestAnimationFrame(tick);
            }
        };
        animId = requestAnimationFrame(tick);
    };

    if (!startGL()) startFallback();

    // Desvanecimiento ágil sin esperas forzadas
    const hide = () => {
        if (!pre || pre.dataset.closing) return;
        pre.dataset.closing = '1';
        pre.classList.add('is-hidden');
        pre.classList.add('loaded');
        setTimeout(() => {
            if (pre && pre.parentNode) pre.remove();
        }, 320);
    };

    // Auto-cierre si no es página compleja (las complejas son controladas por components.js / páginas)
    const path = (window.location.pathname || '').toLowerCase();
    const isComplex = window.pageControlsPreloader ||
                      path.includes('editor-') ||
                      path.includes('admin') ||
                      path.includes('educonvert');

    if (!isComplex) {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(hide, 100);
        } else {
            document.addEventListener('DOMContentLoaded', () => setTimeout(hide, 100), { once: true });
        }
    }
    // Watchdog de seguridad (máximo 3s bajo cualquier contingencia)
    setTimeout(hide, 3000);
})();
