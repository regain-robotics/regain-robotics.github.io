// Recovery capability comparison and paired demo placeholders.
(() => {
    const root = document.getElementById('recovery');
    const radar = root.querySelector('.rrw-svg');
    const geometry = root.querySelector('.rrw-geometry');
    const axisButtons = [...root.querySelectorAll('[data-axis]')];
    const methodButtons = [...root.querySelectorAll('[data-method]')];
    const selectedAxisName = root.querySelector('[data-selected-axis]');
    const trajectoryButtons = [...root.querySelectorAll('[data-trajectory]')];
    const demoAxisName = root.querySelector('[data-demo-axis]');
    const axisNames = axisButtons.map(button =>
      [...button.childNodes].map(node => node.textContent).filter(Boolean).join(' ')
    );
    const angles = axisNames.map((_, axis) => axis * 2 * Math.PI / axisNames.length - Math.PI / 2);
    // Placeholder capability axes and profiles; replace with reviewed data when available.
    const profiles = [
      { id: 'baseline', style: 'rrw-baseline', values: [48, 54, 46, 61, 41, 51, 44] },
      { id: 'a', style: 'rrw-method-a', values: [66, 82, 58, 74, 47, 71, 55] },
      { id: 'b', style: 'rrw-method-b', values: [52, 67, 76, 56, 63, 57, 72] }
    ].map(profile => ({ ...profile, readout: root.querySelector(`[data-value="${profile.id}"]`) }));
    const visibleOverlays = new Set(methodButtons.filter(button => button.getAttribute('aria-pressed') === 'true').map(button => button.dataset.method));
    const isVisible = profile => profile.id === 'baseline' || visibleOverlays.has(profile.id);
    let selectedAxis = 0;
    let selectedTrajectory = 'original';
    // Add approved local clips here, keyed by "axisIndex:original|corrective".
    const demoSources = {};
    const popover = root.querySelector('#rrw-rollout-preview');
    const chart = root.querySelector('.rrw-chart');
    const preview = popover.querySelector('[data-demo-preview]');
    const video = preview.querySelector('video');
    const emptyPreview = preview.querySelector('.rrw-demo-empty');
    const previewStatus = preview.querySelector('[data-demo-status]');
    const rolloutHint = root.querySelector('.rrw-rollout-hint');
    const hoverInput = matchMedia('(hover: hover) and (pointer: fine)');
    let previewRequested = false;
    let previewAnchor = null;
    let previewOrigin = 'hover';
    let closeTimer;
    let fadeTimer;
    let restoringFocus = false;
    video.muted = true;

    function syncPreviewPlayback() {
      if (!previewRequested || popover.hidden || document.hidden || !video.hasAttribute('src')) {
        video.pause();
        return;
      }
      video.play().then(() => {
        if (!previewRequested || popover.hidden || document.hidden) video.pause();
      }).catch(() => { previewRequested = false; });
    }
    function stopPreview() {
      previewRequested = false;
      video.pause();
    }
    function closeDemoPreview() {
      clearTimeout(closeTimer);
      stopPreview();
      popover.classList.remove('is-visible');
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(() => { popover.hidden = true; },160);
      previewAnchor?.setAttribute('aria-expanded','false');
      previewAnchor = null;
    }
    function updateDemoSource() {
      stopPreview();
      const source = demoSources[`${selectedAxis}:${selectedTrajectory}`] || '';
      const previous = video.getAttribute('src') || '';
      if (source !== previous) {
        if (source) video.setAttribute('src',source);
        else video.removeAttribute('src');
        video.load();
      }
      const hasFrame = Boolean(source) && source === previous && video.readyState >= 2;
      video.hidden = !hasFrame;
      emptyPreview.hidden = hasFrame;
      preview.toggleAttribute('data-media-ready',Boolean(source));
      previewStatus.textContent = source ? 'Loading preview…' : 'Demo footage pending';
    }
    function openDemoPreview(button,origin) {
      clearTimeout(closeTimer);
      clearTimeout(fadeTimer);
      previewAnchor?.setAttribute('aria-expanded','false');
      previewAnchor = button;
      previewOrigin = origin;
      selectedAxis = Number(button.dataset.axis);
      updateComparison();
      updateDemoSource();
      popover.hidden = false;
      popover.setAttribute('aria-label',axisNames[selectedAxis]+' real rollout');
      button.setAttribute('aria-expanded','true');
      popover.classList.add('is-visible');
      previewRequested = true;
      syncPreviewPlayback();
    }
    function scheduleDemoClose() {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        const hovering = chart.matches(':hover') || popover.matches(':hover');
        const keyboardInside = previewOrigin === 'keyboard' && (document.activeElement === previewAnchor || popover.contains(document.activeElement));
        if (!hovering && !keyboardInside) closeDemoPreview();
      },240);
    }
    chart.addEventListener('pointerleave',() => { if (previewOrigin === 'hover') scheduleDemoClose(); });
    popover.addEventListener('pointerenter',() => clearTimeout(closeTimer));
    popover.addEventListener('pointerleave',() => { if (previewOrigin === 'hover') scheduleDemoClose(); });
    popover.addEventListener('focusin',() => clearTimeout(closeTimer));
    popover.addEventListener('focusout',scheduleDemoClose);
    video.addEventListener('loadeddata',() => {
      if (!video.hasAttribute('src')) return;
      video.hidden = false;
      emptyPreview.hidden = true;
    });
    video.addEventListener('playing',() => preview.classList.add('is-playing'));
    video.addEventListener('pause',() => preview.classList.remove('is-playing'));
    video.addEventListener('error',() => {
      stopPreview();
      video.hidden = true;
      emptyPreview.hidden = false;
      previewStatus.textContent = 'Demo footage pending';
    });
    document.addEventListener('pointerdown',event => {
      if (!popover.hidden && !popover.contains(event.target) && !axisButtons.some(button => button.contains(event.target))) closeDemoPreview();
    });
    document.addEventListener('keydown',event => {
      if (event.key !== 'Escape' || popover.hidden) return;
      const anchor = previewAnchor;
      const restore = popover.contains(document.activeElement);
      closeDemoPreview();
      if (restore && anchor) {
        restoringFocus = true;
        anchor.focus({preventScroll:true});
        restoringFocus = false;
      }
    });
    document.addEventListener('visibilitychange',() => { if (document.hidden) closeDemoPreview(); });
    addEventListener('resize',closeDemoPreview);
    function updateRolloutHint() {
      rolloutHint.textContent = hoverInput.matches ? 'Hover a type for real rollout' : 'Tap a type for real rollout';
    }
    hoverInput.addEventListener('change',() => { closeDemoPreview(); updateRolloutHint(); });
    updateRolloutHint();

    function drawRadar() {
      const { width, height } = radar.getBoundingClientRect();
      if (!width || !height) return;
      radar.setAttribute('viewBox', `0 0 ${width} ${height}`);
      const centerX = width / 2;
      const centerY = height / 2 + 4;
      const radius = Math.min(116, width * .29, height * .34);
      const point = (axis, fraction) => [
        centerX + Math.cos(angles[axis]) * radius * fraction,
        centerY + Math.sin(angles[axis]) * radius * fraction
      ];
      const rings = [25, 50, 75, 100].map(value => {
        const corners = angles.map((_, axis) => point(axis, value / 100).join(',')).join(' ');
        return `<polygon class="rrw-gridline" points="${corners}"></polygon>`;
      });
      const spokes = angles.map((_, axis) => {
        const [x, y] = point(axis, 1);
        const activeClass = axis === selectedAxis ? ' rrw-spoke-active' : '';
        return `<line class="rrw-spoke${activeClass}" x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}"></line>`;
      });
      const series = profiles.filter(isVisible).map(profile => {
        const points = profile.values.map((value, axis) => point(axis, value / 100));
        const markers = points.map(([x, y], axis) => {
          const size = axis === selectedAxis ? 5 : 3.5;
          if (profile.id === 'baseline') return axis === selectedAxis
            ? `<rect class="rrw-point" x="${x - 3.5}" y="${y - 3.5}" width="7" height="7"></rect>`
            : '';
          return profile.id === 'a'
            ? `<circle class="rrw-point" cx="${x}" cy="${y}" r="${size}"></circle>`
            : `<path class="rrw-point" d="M${x},${y - size} L${x + size},${y} ${x},${y + size} ${x - size},${y} Z"></path>`;
        });
        return `<g class="${profile.style}"><polygon class="rrw-profile" points="${points.map(pair => pair.join(',')).join(' ')}"></polygon>${markers.join('')}</g>`;
      });
      const ticks = [25, 50, 75, 100].map(value => {
        const [x, y] = point(0, value / 100);
        return `<text class="rrw-tick" x="${x + 7}" y="${y + 4}">${value}%</text>`;
      });
      geometry.innerHTML = [...rings, ...spokes, ...series, ...ticks].join('');

      const horizontal = [.5, .86, .89, .73, .27, .12, .15];
      const vertical = [
        centerY - radius - 34, point(1, 1)[1] - 12, point(2, 1)[1] + 10,
        centerY + radius + 14, centerY + radius + 14, point(5, 1)[1] + 10, point(6, 1)[1] - 12
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
      demoAxisName.textContent = axisNames[selectedAxis];
      methodButtons.forEach(button => {
        button.setAttribute('aria-pressed', String(visibleOverlays.has(button.dataset.method)));
      });
      profiles.forEach(profile => {
        profile.readout.hidden = !isVisible(profile);
        profile.readout.querySelector('b').textContent = `${profile.values[selectedAxis]}%`;
      });
      axisButtons.forEach((button, axis) => button.setAttribute('aria-pressed', String(axis === selectedAxis)));
      drawRadar();
    }

    axisButtons.forEach(button => {
      button.addEventListener('pointerenter',event => {
        if (hoverInput.matches && event.pointerType === 'mouse') openDemoPreview(button,'hover');
      });
      button.addEventListener('pointerleave',() => { if (previewOrigin === 'hover') scheduleDemoClose(); });
      button.addEventListener('focusin',() => {
        if (!restoringFocus && button.matches(':focus-visible')) openDemoPreview(button,'keyboard');
      });
      button.addEventListener('focusout',scheduleDemoClose);
      button.addEventListener('click',() => {
        if (!hoverInput.matches && previewAnchor === button && !popover.hidden) closeDemoPreview();
        else openDemoPreview(button,hoverInput.matches ? 'hover' : 'touch');
      });
    });
    methodButtons.forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.method;
      if (visibleOverlays.has(id)) visibleOverlays.delete(id);
      else visibleOverlays.add(id);
      updateComparison();
    }));

    trajectoryButtons.forEach(button => button.addEventListener('click', () => {
      trajectoryButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
      selectedTrajectory = button.dataset.trajectory;
      updateDemoSource();
      previewRequested = !popover.hidden;
      syncPreviewPlayback();
    }));

    updateComparison();
    updateDemoSource();
    new ResizeObserver(drawRadar).observe(radar);
    document.fonts.ready.then(drawRadar);
  })();
