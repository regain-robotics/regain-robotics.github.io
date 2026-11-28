// Pure Scroll-Clock Architecture for Sticky 3-Act Protocol Stage, 5-Stage Data Pipeline & Open-Hairline Choreography.
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const subProgress = (p, start, end) => clamp((p - start) / Math.max(1e-5, end - start), 0, 1);

  function setPathDraw(pathEl, progress) {
    if (!pathEl || typeof pathEl.getTotalLength !== 'function') return;
    const len = pathEl.getTotalLength();
    if (!len) return;
    const p = clamp(progress, 0, 1);
    pathEl.style.strokeDasharray = `${len} ${len}`;
    pathEl.style.strokeDashoffset = `${(len * (1 - p)).toFixed(2)}`;
    pathEl.style.opacity = p <= 0.002 ? '0' : '1';
  }

  function placeCursorOnPath(pathEl, cursorEl, progress) {
    if (!pathEl || !cursorEl || typeof pathEl.getTotalLength !== 'function') return;
    const len = pathEl.getTotalLength();
    if (!len) return;
    const p = clamp(progress, 0, 1);
    const pt = pathEl.getPointAtLength(len * p);
    cursorEl.setAttribute('x', (pt.x - 3).toFixed(1));
    cursorEl.setAttribute('y', (pt.y - 3).toFixed(1));
    cursorEl.setAttribute('opacity', p > 0.01 && p < 0.995 ? '1' : '0');
  }

  function scrollTrackProgress(trackEl, viewportEl) {
    const rect = trackEl.getBoundingClientRect();
    const viewH = viewportEl.offsetHeight || innerHeight;
    const topOffset = 88;
    const span = Math.max(1, trackEl.offsetHeight - viewH);
    return clamp((topOffset - rect.top) / span, 0, 1);
  }

  // --- 1. Overview: Sticky 3-Act Evaluation Protocol Stage ---
  const protoTrack = document.getElementById('protocol-stage');
  let renderProtocol = () => {};

  if (protoTrack) {
    const viewport = protoTrack.querySelector('.proto-sticky-viewport');
    const spineFill = protoTrack.querySelector('.proto-spine-fill');
    const spineSteps = [...protoTrack.querySelectorAll('[data-spine-step]')];
    const actPairs = [...protoTrack.querySelectorAll('.proto-act-pair')];

    // Act 1 elements (x in [78..518] for d in [-15..+25], break //, D at 582)
    const t1ScanReadout = protoTrack.querySelector('[data-t1-scan-readout]');
    const t1Playhead = protoTrack.querySelector('[data-t1-playhead]');
    const t1ClipRect = protoTrack.querySelector('[data-t1-clip]');
    const t1CurveStroke = protoTrack.querySelector('[data-t1-curve-stroke]');
    const t1CurveFill = protoTrack.querySelector('[data-t1-curve-fill]');
    const t1CurveRail = protoTrack.querySelector('[data-t1-curve-rail]');
    const t1Items = [
      { x: 133, mark: protoTrack.querySelector('[data-t1-mark="a"]'),  drop: protoTrack.querySelector('[data-t1-drop="a"]'),  val: protoTrack.querySelector('[data-t1-val="a"]'),  baseOp: 0.65 },
      { x: 243, mark: protoTrack.querySelector('[data-t1-mark="gt"]'), drop: protoTrack.querySelector('[data-t1-drop="gt"]'), val: protoTrack.querySelector('[data-t1-val="gt"]'), baseOp: 0.72 },
      { x: 298, mark: protoTrack.querySelector('[data-t1-mark="b"]'),  drop: protoTrack.querySelector('[data-t1-drop="b"]'),  val: protoTrack.querySelector('[data-t1-val="b"]'),  baseOp: 0.75 },
      { x: 463, mark: protoTrack.querySelector('[data-t1-mark="c"]'),  drop: protoTrack.querySelector('[data-t1-drop="c"]'),  val: protoTrack.querySelector('[data-t1-val="c"]'),  baseOp: 0.65 },
      { x: 582, mark: protoTrack.querySelector('[data-t1-mark="d"]'),  drop: protoTrack.querySelector('[data-t1-drop="d"]'),  val: protoTrack.querySelector('[data-t1-val="d"]'),  baseOp: 0.55 }
    ];

    // Plot exact analytical Lorentzian curve w(d) = 1 / (1 + (d / 10)^2)
    const twaWeight = d => 1 / (1 + (d / 10) ** 2);
    const dToX = d => 78 + ((d + 15) / 40) * 440;
    const wToY = w => 364 - w * 116;
    if (t1CurveStroke && t1CurveFill) {
      const pts = [];
      for (let d = -15; d <= 25; d += 0.5) {
        pts.push(`${dToX(d).toFixed(1)},${wToY(twaWeight(d)).toFixed(1)}`);
      }
      const pathD = `M ${pts.join(' L ')}`;
      t1CurveStroke.setAttribute('d', pathD);
      if (t1CurveRail) t1CurveRail.setAttribute('d', pathD);
      t1CurveFill.setAttribute('d', `M 78,364 L ${pts.join(' L ')} L 518,364 Z`);
    }

    function drawAct1(p) {
      const scanX = lerp(78, 598, smooth(clamp(p, 0, 1)));
      if (t1Playhead) {
        t1Playhead.setAttribute('x1', scanX.toFixed(1));
        t1Playhead.setAttribute('x2', scanX.toFixed(1));
        t1Playhead.setAttribute('opacity', p > 0.01 && p < 0.99 ? '0.78' : '0.35');
      }
      if (t1ClipRect) {
        t1ClipRect.setAttribute('width', clamp(scanX - 78, 0, 444).toFixed(1));
      }
      if (t1ScanReadout) {
        if (scanX > 528) {
          t1ScanReadout.textContent = 'd = +∞ · missed';
        } else {
          const liveD = ((clamp(scanX, 78, 518) - 78) / 440) * 40 - 15;
          t1ScanReadout.textContent = `d = ${liveD > 0 ? '+' : ''}${liveD.toFixed(1)} s`;
        }
      }
      t1Items.forEach(item => {
        const hit = scanX >= item.x - 2;
        if (item.mark) item.mark.setAttribute('opacity', hit ? '1' : '0.26');
        if (item.drop) item.drop.setAttribute('opacity', hit ? String(item.baseOp) : '0.14');
        if (item.val) item.val.setAttribute('opacity', hit ? '1' : '0.18');
      });
    }

    // Act 2 elements
    const t2Prefix = protoTrack.querySelector('[data-t2-prefix]');
    const t2Branches = ['r1', 'r2', 'r3'].map((k, idx) => ({
      trace: protoTrack.querySelector(`[data-t2-trace="${k}"]`),
      cursor: protoTrack.querySelector(`[data-t2-cursor="${k}"]`),
      end: protoTrack.querySelector(`[data-t2-end="${k}"]`),
      ann: protoTrack.querySelector(`[data-t2-ann="${k}"]`),
      start: 0.16 + idx * 0.2,
      endAt: 0.50 + idx * 0.2
    }));

    function drawAct2(p) {
      setPathDraw(t2Prefix, subProgress(p, 0.0, 0.22));
      t2Branches.forEach(b => {
        const bp = smooth(subProgress(p, b.start, b.endAt));
        setPathDraw(b.trace, bp);
        placeCursorOnPath(b.trace, b.cursor, bp);
        const done = bp >= 0.96;
        if (b.end) b.end.setAttribute('opacity', done ? '1' : '0.18');
        if (b.ann) b.ann.setAttribute('opacity', bp >= 0.55 ? '1' : '0.16');
      });
    }

    // Act 3 elements
    const t3Playhead = protoTrack.querySelector('[data-t3-playhead]');
    const t3Lanes = ['r-off', 'r-on', 'h-off', 'h-on'].map(k => ({
      trace: protoTrack.querySelector(`[data-t3-trace="${k}"]`),
      cursor: protoTrack.querySelector(`[data-t3-cursor="${k}"]`),
      out: protoTrack.querySelector(`[data-t3-out="${k}"]`)
    }));

    function drawAct3(p) {
      const lp = smooth(subProgress(p, 0.04, 0.90));
      t3Lanes.forEach(lane => {
        setPathDraw(lane.trace, lp);
        placeCursorOnPath(lane.trace, lane.cursor, lp);
        if (lane.out) lane.out.setAttribute('opacity', lp >= 0.93 ? '1' : '0.28');
      });
      if (t3Playhead) {
        const hx = lerp(88, 526, lp);
        t3Playhead.setAttribute('x1', hx.toFixed(1));
        t3Playhead.setAttribute('x2', hx.toFixed(1));
      }
    }

    const drawFns = [drawAct1, drawAct2, drawAct3];

    renderProtocol = () => {
      const fallback = innerWidth <= 720 || reducedMotion.matches;
      if (fallback) {
        actPairs.forEach((pair, i) => {
          pair.style.opacity = '';
          pair.style.transform = '';
          pair.style.pointerEvents = '';
          drawFns[i](1);
        });
        return;
      }

      const progress = scrollTrackProgress(protoTrack, viewport);
      if (spineFill) spineFill.style.setProperty('--proto-progress', progress.toFixed(4));

      const activeIdx = progress < 1 / 3 ? 0 : progress < 2 / 3 ? 1 : 2;
      spineSteps.forEach((step, i) => step.classList.toggle('is-active', i === activeIdx));

      // Crossfade envelope across the 3 thirds with gentle 10px vertical drift
      const fade = 0.055;
      actPairs.forEach((pair, i) => {
        const s = i / 3;
        const e = (i + 1) / 3;
        let op = 0;
        let dy = 0;
        if (progress >= s - fade && progress <= e + fade) {
          if (i > 0 && progress < s + fade) {
            const k = smooth(subProgress(progress, s - fade, s + fade));
            op = k;
            dy = lerp(10, 0, k);
          } else if (i < 2 && progress > e - fade) {
            const k = smooth(subProgress(progress, e - fade, e + fade));
            op = 1 - k;
            dy = lerp(0, -10, k);
          } else {
            op = 1;
            dy = 0;
          }
        }
        pair.style.opacity = op.toFixed(3);
        pair.style.transform = `translate3d(0, ${dy.toFixed(1)}px, 0)`;
        pair.style.pointerEvents = op > 0.35 ? '' : 'none';

        const localP = subProgress(progress, s + 0.02, e - 0.04);
        drawFns[i](localP);
      });
    };
  }

  // --- 2. Data Generation: Sticky 5-Stage Y-Shaped Pipeline ---
  const dataTrack = document.getElementById('data-sticky-stage');
  let renderPipeline = () => {};

  if (dataTrack) {
    const viewport = dataTrack.querySelector('.data-sticky-viewport');
    const counter = dataTrack.querySelector('[data-pipe-counter]');
    const progressFill = dataTrack.querySelector('.pipe-progress-fill');
    const boxes = [...dataTrack.querySelectorAll('[data-pipe-box]')];
    const stepItems = [...dataTrack.querySelectorAll('[data-pipe-step]')];
    const scanner = dataTrack.querySelector('[data-pipe-scanner]');
    const bars = [...dataTrack.querySelectorAll('[data-pipe-bar]')];
    const trace12 = dataTrack.querySelector('#pipe-trace-12');
    const trace23 = dataTrack.querySelector('#pipe-trace-23');
    const traceRewind = dataTrack.querySelector('#pipe-trace-rewind');
    const trace3y = dataTrack.querySelector('#pipe-trace-3y');
    const traceOrig = dataTrack.querySelector('#pipe-trace-orig');
    const traceCorr = dataTrack.querySelector('#pipe-trace-corr');
    const traceOut = dataTrack.querySelector('#pipe-trace-out');
    const traceAug1 = dataTrack.querySelector('#pipe-trace-aug1');
    const traceAug2 = dataTrack.querySelector('#pipe-trace-aug2');
    const traceAug3 = dataTrack.querySelector('#pipe-trace-aug3');

    const barEnds = [103, 59, 31];

    function drawPipelineAt(p) {
      if (progressFill) progressFill.style.setProperty('--pipe-progress', p.toFixed(4));
      const stage = Math.min(4, Math.floor(p * 4.99));
      if (counter) counter.textContent = `0${stage + 1} / 05`;

      boxes.forEach(box => {
        const id = box.dataset.pipeBox;
        const match = stage === 3 ? (id === '3' || id === '3b') : Number(id) === stage;
        box.classList.toggle('is-active-stage', match);
      });
      stepItems.forEach((step, i) => step.classList.toggle('is-active', i === stage));

      // Stage 1 bars (0.00 -> 0.16)
      const bp = smooth(subProgress(p, 0.0, 0.16));
      bars.forEach((bar, i) => {
        bar.setAttribute('x2', lerp(16, barEnds[i], bp).toFixed(1));
      });

      // Bridges & stage curves
      setPathDraw(trace12, subProgress(p, 0.14, 0.24));
      if (scanner) {
        const sp = smooth(subProgress(p, 0.20, 0.36));
        const sx = lerp(28, 102, sp);
        scanner.setAttribute('x1', sx.toFixed(1));
        scanner.setAttribute('x2', sx.toFixed(1));
      }
      setPathDraw(trace23, subProgress(p, 0.34, 0.44));
      setPathDraw(traceRewind, smooth(subProgress(p, 0.42, 0.56)));
      setPathDraw(trace3y, subProgress(p, 0.52, 0.60));

      const forkP = smooth(subProgress(p, 0.58, 0.78));
      setPathDraw(traceOrig, forkP);
      setPathDraw(traceCorr, forkP);

      setPathDraw(traceOut, subProgress(p, 0.76, 0.85));
      const augP = smooth(subProgress(p, 0.82, 0.98));
      setPathDraw(traceAug1, augP);
      setPathDraw(traceAug2, augP);
      setPathDraw(traceAug3, augP);
    }

    renderPipeline = () => {
      if (innerWidth <= 720 || reducedMotion.matches) {
        drawPipelineAt(1);
        return;
      }
      drawPipelineAt(scrollTrackProgress(dataTrack, viewport));
    };
  }

  // --- 3. Single Passive Scroll-Clock Scheduler (same pattern as scroll.js) ---
  let frameId = 0;
  function drawAll() {
    frameId = 0;
    renderProtocol();
    renderPipeline();
  }
  function queueDraw() {
    if (!frameId) frameId = requestAnimationFrame(drawAll);
  }

  drawAll();
  addEventListener('scroll', queueDraw, { passive: true });
  addEventListener('resize', queueDraw);
  addEventListener('pageshow', queueDraw);
  reducedMotion.addEventListener('change', queueDraw);
  document.fonts.ready.then(queueDraw);

  // --- 4. Stat Count-Up, Distribution Bar Reveals & Calm Case Timeline Scrubber ---
  const countUpValue = el => {
    const raw = el.dataset.finalText || el.textContent.trim();
    el.dataset.finalText = raw;
    const targets = [];
    const text = raw.replace(/\d[\d,]*/g, m => {
      targets.push({ value: parseInt(m.replace(/,/g, ''), 10), comma: m.includes(',') });
      return '\u0000';
    });
    if (!targets.length) return;

    const start = performance.now();
    const duration = 650;
    const step = now => {
      const p = clamp((now - start) / duration, 0, 1);
      const eased = 1 - (1 - p) ** 3;
      let idx = 0;
      el.textContent = p >= 1
        ? raw
        : text.replace(/\u0000/g, () => {
            const t = targets[idx++];
            const val = Math.round(t.value * eased);
            return t.comma ? val.toLocaleString('en-US') : String(val);
          });
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const revealTargets = [
    ...document.querySelectorAll('.overview-stats .stat-card'),
    ...document.querySelectorAll('.bar-list, .family-split, .resumption-bars, .rrw-cov-bar')
  ];

  document.querySelectorAll('.overview-stats .stat-card').forEach((card, i) => {
    card.classList.add('reveal-stat');
    card.style.setProperty('--stagger', `${i * 65}ms`);
  });

  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('has-reveal');
    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-revealed');
        const val = el.querySelector('.stat-value');
        if (val && !val.dataset.counted) {
          val.dataset.counted = '1';
          countUpValue(val);
        }
        revealObs.unobserve(el);
      });
    }, { threshold: 0.12 });

    revealTargets.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < innerHeight * 0.95) {
        el.classList.add('is-revealed');
      } else {
        revealObs.observe(el);
      }
    });
  }

  document.querySelectorAll('.case-card').forEach(card => {
    const steps = [...card.querySelectorAll('.case-steps li')];
    if (!steps.length) return;
    const setActive = targetIdx => {
      steps.forEach((li, i) => {
        li.classList.toggle('is-step-done', i < targetIdx);
        li.classList.toggle('is-active-step', i === targetIdx);
      });
    };
    setActive(steps.length - 1);
    steps.forEach((li, i) => {
      li.addEventListener('mouseenter', () => setActive(i));
      li.addEventListener('focusin', () => setActive(i));
    });
    card.addEventListener('mouseleave', () => setActive(steps.length - 1));
    card.addEventListener('focusout', e => {
      if (!card.contains(e.relatedTarget)) setActive(steps.length - 1);
    });
  });
})();
