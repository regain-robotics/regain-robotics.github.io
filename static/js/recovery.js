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

    // Add approved local clips here, keyed by "axisIndex:domain:original|corrective".
    const demoSources = {};
    const popover = root.querySelector('#rrw-rollout-preview');
    const demos = [...popover.querySelectorAll('[data-demo-preview]')].map(preview => ({
      preview, video: preview.querySelector('video'),
      empty: preview.querySelector('.rrw-demo-empty'), status: preview.querySelector('[data-demo-status]')
    }));
    const demoCapLabels = [...popover.querySelectorAll('[data-demo-cap]')];
    const rolloutHint = root.querySelector('.rrw-rollout-hint');
    popover.hidden = false;
    popover.classList.add('is-visible');
    demos.forEach(({video}) => { video.muted = true; });

    function syncPreviewPlayback() {
      demos.forEach(({video}) => {
        if (document.hidden || !video.hasAttribute('src')) {
          video.pause();
          return;
        }
        video.play().then(() => {
          if (document.hidden) video.pause();
        }).catch(() => {});
      });
    }
    function updateDemoSource() {
      demos.forEach(({preview, video, empty, status}) => {
        const source = demoSources[`${selectedAxis}:${preview.dataset.domain}:${preview.dataset.trajectory}`] || '';
        const previous = video.getAttribute('src') || '';
        if (source !== previous) {
          if (source) video.setAttribute('src', source);
          else video.removeAttribute('src');
          video.load();
        }
        const hasFrame = Boolean(source) && source === previous && video.readyState >= 2;
        video.hidden = !hasFrame;
        empty.hidden = hasFrame;
        status.textContent = source ? 'Loading preview…' : 'Demo footage pending';
      });
    }
    function selectAxis(axisIndex) {
      selectedAxis = axisIndex;
      updateComparison();
      const capName = axisNames[selectedAxis];
      demoCapLabels.forEach(label => { label.textContent = capName; });
      popover.setAttribute('aria-label', `${capName} paired simulation rollouts`);
      updateDemoSource();
      syncPreviewPlayback();
    }
    demos.forEach(({video, empty, status}) => {
      video.addEventListener('loadeddata', () => {
        if (!video.hasAttribute('src')) return;
        video.hidden = false;
        empty.hidden = true;
      });
      video.addEventListener('error', () => {
        video.pause();
        video.hidden = true;
        empty.hidden = false;
        status.textContent = 'Demo footage pending';
      });
    });
    document.addEventListener('visibilitychange', syncPreviewPlayback);
    addEventListener('resize', drawRadar);
    if (rolloutHint) {
      rolloutHint.textContent = 'Select a capability axis to switch paired simulation rollouts';
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
