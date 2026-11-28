// Recovery capability comparison (Fig. 5a/5b) and paired rollout previews.
(() => {
    const root = document.getElementById('recovery');
    if (!root) return;
    const radar = root.querySelector('.rrw-svg');
    const geometry = root.querySelector('.rrw-geometry');
    const axisButtons = [...root.querySelectorAll('[data-axis]')];
    const methodButtons = [...root.querySelectorAll('[data-method]')];
    const selectedAxisName = root.querySelector('[data-selected-axis]');
    const axisCountEl = root.querySelector('[data-axis-count]');
    const axisNoteEl = root.querySelector('[data-axis-note]');
    const axisNames = axisButtons.map(button =>
      [...button.childNodes].map(node => node.textContent).filter(Boolean).join(' ')
    );
    const axisParentCounts = [310, 86, 137, 114, 77, 40, 17];
    const angles = axisNames.map((_, axis) => axis * 2 * Math.PI / axisNames.length - Math.PI / 2);
    const MAX_VALUE = 40;

    // Task-macro Stage SR (%) across 750 common cases.
    const profiles = [
      { id: 'baseline',   style: 'rrw-baseline',          marker: 'square',  values: [14.6, 6.3, 8.9, 17.9, 7.3, 16.1, 0.0] },
      { id: 'astra',      style: 'rrw-method-astra',      marker: 'circle',  values: [34.7, 31.2, 22.5, 23.8, 23.1, 17.6, 0.0] },
      { id: 'failsafe',   style: 'rrw-method-failsafe',   marker: 'diamond', values: [17.5, 10.7, 19.1, 15.0, 9.1, 28.5, 5.0] },
      { id: 'sft',        style: 'rrw-method-sft',        marker: 'circle',  values: [9.5, 5.3, 10.0, 4.6, 4.4, 25.4, 13.3] },
      { id: 'retract',    style: 'rrw-method-retract',    marker: 'diamond', values: [11.8, 15.4, 9.7, 11.9, 11.5, 11.1, 0.0] },
      { id: 'agentchord', style: 'rrw-method-agentchord', marker: 'circle',  values: [9.8, 2.4, 16.7, 3.6, 7.3, 16.7, 0.0] },
      { id: 'phoenix',    style: 'rrw-method-phoenix',    marker: 'diamond', values: [3.3, 3.1, 4.5, 1.5, 3.4, 22.2, 0.0] }
    ].map(profile => ({ ...profile, readout: root.querySelector(`[data-value="${profile.id}"]`) }));

    const visibleOverlays = new Set(
      methodButtons.filter(button => button.getAttribute('aria-pressed') === 'true').map(button => button.dataset.method)
    );
    const isVisible = profile => profile.id === 'baseline' || visibleOverlays.has(profile.id);
    let selectedAxis = 0;

    // Exact failure_frame-sliced Y-branch rollouts (7 capabilities x 3 platforms).
    const YBRANCH_META = {
      '0:maniskill': { task: 'LiftPegUpright', tStar: 3.1 },
      '0:robotwin':  { task: 'place shoe', tStar: 54.5 },
      '0:robolab':   { task: 'ClampInRightBin', tStar: 15.3 },
      '1:maniskill': { task: 'PegInsertionSide', tStar: 7.3 },
      '1:robotwin':  { task: 'move pillbottle pad', tStar: 46.2 },
      '1:robolab':   { task: 'FoodPacking1Cans', tStar: 15.9 },
      '2:maniskill': { task: 'PokeCube', tStar: 1.7 },
      '2:robotwin':  { task: 'place bread basket', tStar: 28.2 },
      '2:robolab':   { task: 'BananaThenRubiksCube', tStar: 13.5 },
      '3:maniskill': { task: 'PickCube', tStar: 3.5 },
      '3:robotwin':  { task: 'place bread skillet', tStar: 47.3 },
      '3:robolab':   { task: 'MustardInRightBin', tStar: 8.1 },
      '4:maniskill': { task: 'StackPyramid', tStar: 9.5 },
      '4:robotwin':  { task: 'place a2b left', tStar: 60.2 },
      '4:robolab':   { task: 'ClampInRightBin', tStar: 6.7 },
      '5:robotwin':  { task: 'open laptop', tStar: 14.3 },
      '6:maniskill': { task: 'PushCube', tStar: 2.3 },
      '6:robotwin':  { task: 'turn switch', tStar: 11.6 }
    };

    let selectedPlatform = 'maniskill';
    const viewer = root.querySelector('#rrw-rollout-preview');
    const platformButtons = [...viewer.querySelectorAll('[data-platform]')];
    const demoCapLabel = viewer.querySelector('[data-demo-cap]');
    const demoTaskLabel = viewer.querySelector('[data-demo-task]');
    const rolloutHint = root.querySelector('.rrw-rollout-hint');
    const slots = {
      prefix: viewer.querySelector('[data-y-slot="prefix"] video'),
      original: viewer.querySelector('[data-y-slot="original"] video'),
      corrective: viewer.querySelector('[data-y-slot="corrective"] video')
    };
    const allVideos = Object.values(slots).filter(Boolean);
    allVideos.forEach(video => { video.muted = true; video.loop = false; });

    let yPhase = 'prefix';
    let cycleToken = 0;
    let restartTimer = 0;
    let origDone = false;
    let corrDone = false;

    function clearTimers() {
      clearTimeout(restartTimer);
      restartTimer = 0;
    }

    function setPhase(phase) {
      yPhase = phase;
      viewer.dataset.phase = phase;
    }

    function playPrefixPhase(token) {
      if (token !== cycleToken || document.hidden) return;
      clearTimers();
      setPhase('prefix');
      origDone = false;
      corrDone = false;
      if (slots.original) { slots.original.pause(); try { slots.original.currentTime = 0; } catch {} }
      if (slots.corrective) { slots.corrective.pause(); try { slots.corrective.currentTime = 0; } catch {} }
      if (slots.prefix) {
        try { slots.prefix.currentTime = 0; } catch {}
        slots.prefix.play().catch(() => {});
      }
    }

    function playBranchesPhase(token) {
      if (token !== cycleToken || document.hidden) return;
      clearTimers();
      setPhase('branches');
      origDone = false;
      corrDone = false;
      if (slots.prefix) slots.prefix.pause();
      if (slots.original) {
        try { slots.original.currentTime = 0; } catch {}
        slots.original.play().catch(() => {});
      } else {
        origDone = true;
      }
      if (slots.corrective) {
        try { slots.corrective.currentTime = 0; } catch {}
        slots.corrective.play().catch(() => {});
      } else {
        corrDone = true;
      }
    }

    function maybeLoopCycle(token) {
      if (token !== cycleToken || !origDone || !corrDone || document.hidden) return;
      clearTimers();
      restartTimer = setTimeout(() => playPrefixPhase(token), 900);
    }

    function syncPlayback() {
      if (document.hidden) {
        clearTimers();
        allVideos.forEach(v => v.pause());
        return;
      }
      if (yPhase === 'prefix') {
        slots.prefix?.play().catch(() => {});
      } else {
        if (!origDone) slots.original?.play().catch(() => {});
        if (!corrDone) slots.corrective?.play().catch(() => {});
      }
    }

    function updateYBranch() {
      cycleToken += 1;
      const token = cycleToken;
      clearTimers();
      setPhase('prefix');
      origDone = false;
      corrDone = false;

      const availablePlatforms = platformButtons
        .map(btn => btn.dataset.platform)
        .filter(p => Boolean(YBRANCH_META[`${selectedAxis}:${p}`]));
      if (!availablePlatforms.includes(selectedPlatform) && availablePlatforms.length) {
        selectedPlatform = availablePlatforms[0];
      }

      const key = `${selectedAxis}:${selectedPlatform}`;
      const info = YBRANCH_META[key] || { task: '', tStar: 0 };
      const capName = axisNames[selectedAxis];
      if (demoCapLabel) demoCapLabel.textContent = capName;
      if (demoTaskLabel) demoTaskLabel.textContent = `${info.task} · t* = ${info.tStar.toFixed(1)} s`;
      viewer.setAttribute('aria-label', `${capName} ${selectedPlatform} Y-shaped simulation rollout`);
      platformButtons.forEach(btn => {
        const hasCase = availablePlatforms.includes(btn.dataset.platform);
        btn.hidden = !hasCase;
        btn.setAttribute('aria-pressed', String(hasCase && btn.dataset.platform === selectedPlatform));
      });

      const v = '2';
      const urls = {
        prefix: `static/videos/recovery/ax${selectedAxis}_${selectedPlatform}_prefix.mp4?v=${v}`,
        original: `static/videos/recovery/ax${selectedAxis}_${selectedPlatform}_orig.mp4?v=${v}`,
        corrective: `static/videos/recovery/ax${selectedAxis}_${selectedPlatform}_corr.mp4?v=${v}`
      };
      Object.entries(urls).forEach(([role, src]) => {
        const video = slots[role];
        if (!video) return;
        video.pause();
        if (video.getAttribute('src') !== src) {
          video.setAttribute('src', src);
          video.load();
        } else {
          try { video.currentTime = 0; } catch {}
        }
      });
      if (slots.prefix && slots.prefix.readyState >= 2) {
        playPrefixPhase(token);
      }
    }

    function selectAxis(axisIndex) {
      selectedAxis = axisIndex;
      updateComparison();
      updateYBranch();
    }

    if (slots.prefix) {
      slots.prefix.addEventListener('loadeddata', () => {
        if (yPhase === 'prefix' && !document.hidden) {
          playPrefixPhase(cycleToken);
        }
      });
      slots.prefix.addEventListener('ended', () => {
        playBranchesPhase(cycleToken);
      });
    }
    if (slots.original) {
      slots.original.addEventListener('ended', () => {
        origDone = true;
        maybeLoopCycle(cycleToken);
      });
    }
    if (slots.corrective) {
      slots.corrective.addEventListener('ended', () => {
        corrDone = true;
        maybeLoopCycle(cycleToken);
      });
    }

    platformButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        selectedPlatform = btn.dataset.platform;
        updateYBranch();
      });
    });

    document.addEventListener('visibilitychange', syncPlayback);
    addEventListener('resize', drawRadar);
    if (rolloutHint) {
      rolloutHint.textContent = 'Select a capability axis or platform to inspect the Y-branch rollout';
    }

    function drawRadar() {
      const { width, height } = radar.getBoundingClientRect();
      if (!width || !height) return;
      radar.setAttribute('viewBox', `0 0 ${width} ${height}`);
      const centerX = width / 2;
      const centerY = height / 2 + 4;
      const radius = Math.min(132, width * .26, height * .33);
      const point = (axis, fraction) => [
        centerX + Math.cos(angles[axis]) * radius * fraction,
        centerY + Math.sin(angles[axis]) * radius * fraction
      ];
      const rings = [10, 20, 30, 40].map(value => {
        const corners = angles.map((_, axis) => point(axis, value / MAX_VALUE).join(',')).join(' ');
        return `<polygon class="rrw-gridline" points="${corners}"></polygon>`;
      });
      const spokes = angles.map((_, axis) => {
        const [x, y] = point(axis, 1);
        const activeClass = axis === selectedAxis ? ' rrw-spoke-active' : '';
        return `<line class="rrw-spoke${activeClass}" x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}"></line>`;
      });
      const series = profiles.filter(isVisible).map(profile => {
        const points = profile.values.map((value, axis) => point(axis, Math.min(1, value / MAX_VALUE)));
        const markers = points.map(([x, y], axis) => {
          const size = axis === selectedAxis ? 5 : 3.5;
          if (profile.marker === 'square') {
            return axis === selectedAxis
              ? `<rect class="rrw-point" x="${x - 3.5}" y="${y - 3.5}" width="7" height="7"></rect>`
              : '';
          }
          return profile.marker === 'circle'
            ? `<circle class="rrw-point" cx="${x}" cy="${y}" r="${size}"></circle>`
            : `<path class="rrw-point" d="M${x},${y - size} L${x + size},${y} ${x},${y + size} ${x - size},${y} Z"></path>`;
        });
        return `<g class="${profile.style}"><polygon class="rrw-profile" points="${points.map(pair => pair.join(',')).join(' ')}"></polygon>${markers.join('')}</g>`;
      });
      const ticks = [10, 20, 30, 40].map(value => {
        const [x, y] = point(0, value / MAX_VALUE);
        return `<text class="rrw-tick" x="${x + 7}" y="${y + 4}">${value}%</text>`;
      });
      geometry.innerHTML = [...rings, ...spokes, ...series, ...ticks].join('');

      const horizontal = [.5, .86, .89, .73, .27, .11, .14];
      const vertical = [
        centerY - radius - 26, point(1, 1)[1] - 12, point(2, 1)[1] + 10,
        centerY + radius + 20, centerY + radius + 20, point(5, 1)[1] + 10, point(6, 1)[1] - 12
      ];
      axisButtons.forEach((button, axis) => {
        const bounds = button.getBoundingClientRect();
        const halfWidth = bounds.width / 2 + 2;
        const halfHeight = bounds.height / 2;
        button.style.left = `${Math.max(halfWidth, Math.min(width - halfWidth, width * horizontal[axis]))}px`;
        button.style.top = `${Math.max(halfHeight, Math.min(height - halfHeight, vertical[axis]))}px`;
      });
    }

    function updateComparison() {
      selectedAxisName.textContent = axisNames[selectedAxis];
      if (axisCountEl) axisCountEl.textContent = `(n = ${axisParentCounts[selectedAxis]} parents)`;
      if (axisNoteEl) axisNoteEl.hidden = selectedAxis !== 6;
      methodButtons.forEach(button => {
        button.setAttribute('aria-pressed', String(visibleOverlays.has(button.dataset.method)));
      });
      profiles.forEach(profile => {
        if (!profile.readout) return;
        profile.readout.hidden = !isVisible(profile);
        profile.readout.querySelector('b').textContent = `${profile.values[selectedAxis].toFixed(1)}%`;
      });
      axisButtons.forEach((button, axis) => button.setAttribute('aria-pressed', String(axis === selectedAxis)));
      drawRadar();
    }

    axisButtons.forEach(button => {
      button.addEventListener('click', () => {
        selectAxis(Number(button.dataset.axis));
      });
    });
    methodButtons.forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.method;
      if (visibleOverlays.has(id)) visibleOverlays.delete(id);
      else visibleOverlays.add(id);
      updateComparison();
    }));

    selectAxis(0);
    new ResizeObserver(drawRadar).observe(radar);
    document.fonts.ready.then(drawRadar);
  })();
