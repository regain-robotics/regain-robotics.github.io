// Hero morph, guided scrolling, anchor navigation, and upper-edge elasticity.
(() => {
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
  const heroCopy = document.querySelector('.hero-copy');
  const heroTheme = document.querySelector('.hero-theme-toggle');
  const topbar = document.querySelector('.topbar');
  const teaser = document.querySelector('#teaser');
  const teaserVideo = teaser.querySelector('.video-slot');
  const overview = document.querySelector('#overview');
  let teaserStop = 0;
  let overviewStop = 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let morphFrame = 0;
  let heroHeight = 0;
  let currentScroll = scrollY;
  function drawMorph(time = 0) {
    morphFrame = 0;
    const mobile = innerWidth <= 600;
    const inset = mobile ? 12 : 24;
    const navHeight = mobile ? 56 : 64;
    const distance = Math.max(320, Math.min(720, heroHeight * .68));
    const target = Math.max(0, Math.min(distance, scrollY));
    // Scroll position is the single clock; no second delayed animation.
    currentScroll = target;
    const raw = Math.max(0, Math.min(1, currentScroll / distance));
    const progress = reducedMotion.matches ? (raw >= .5 ? 1 : 0) : raw * raw * raw * (raw * (raw * 6 - 15) + 10);
    const teaserProgress = Math.max(0, Math.min(1, scrollY / Math.max(1, teaserStop)));
    teaserVideo.style.setProperty('--teaser-scale', reducedMotion.matches ? 1 : .84 + .16 * (teaserProgress * teaserProgress * (3 - 2 * teaserProgress)));
    const finalWidth = Math.min(innerWidth - 2 * inset, 1200);
    const lerp = (start, end) => start + (end - start) * progress;
    root.style.setProperty('--shell-top', lerp(inset, mobile ? 12 : 16) + 'px');
    root.style.setProperty('--shell-left', lerp(inset, (innerWidth - finalWidth) / 2) + 'px');
    root.style.setProperty('--shell-width', lerp(innerWidth - 2 * inset, finalWidth) + 'px');
    root.style.setProperty('--shell-height', lerp(heroHeight, navHeight) + 'px');
    root.style.setProperty('--shell-radius', lerp(mobile ? 14 : 20, mobile ? 16 : 18) + 'px');
    root.style.setProperty('--nav-height', navHeight + 'px');
    root.style.setProperty('--copy-opacity', Math.max(0, 1 - progress * 1.8));
    root.style.setProperty('--copy-shift', (reducedMotion.matches ? 0 : currentScroll * .4) + 'px');
    root.toggleAttribute('data-edge-ready',scrollY <= 1);
    root.style.setProperty('--media-opacity', Math.max(0, 1 - progress * 1.6));
    root.style.setProperty('--nav-opacity', Math.max(0, Math.min(1, (progress - .62) / .38)));
    const glass = Math.max(0, Math.min(1, (progress - .7) / .3));
    root.style.setProperty('--shell-alpha', 1 - glass * .5);
    root.style.setProperty('--glass-blur', (glass * 8).toFixed(2) + 'px');
    topbar.inert = progress < .72;
    topbar.setAttribute('aria-hidden', String(progress < .72));
    heroCopy.inert = progress > .55;
    if (heroTheme) heroTheme.inert = progress > .55;
  }
  function queueMorph() {
    if (!morphFrame) morphFrame = requestAnimationFrame(drawMorph);
  }
  function measureMorph() {
    heroHeight = hero.offsetHeight;
    const navBottom = innerWidth <= 600 ? 68 : 80;
    const rect = teaserVideo.getBoundingClientRect();
    teaserStop = Math.max(0, scrollY + rect.top + rect.height / 2 - (innerHeight + navBottom) / 2);
    overviewStop = scrollY + overview.getBoundingClientRect().top;
    currentScroll = Math.max(0, Math.min(Math.max(320, Math.min(720, heroHeight * .68)), scrollY));
    queueMorph();
  }
  root.classList.add('has-morph');
  topbar.inert = true;
  measureMorph();
  addEventListener('scroll', queueMorph, {passive:true});
  addEventListener('resize', measureMorph);
  addEventListener('pageshow', measureMorph);
  reducedMotion.addEventListener('change', queueMorph);
  document.fonts.ready.then(measureMorph);


  // Native scrolling drives the visuals. Only the last part of each passage snaps.
  let passageFrame = 0;
  let passageBusy = false;
  let passageReleased = scrollY >= overviewStop - 4;
  let passageStage = scrollY < teaserStop - 64 ? 'hero' : 'teaser';
  let previousPassageY = scrollY;
  let previousPassageTime = performance.now();
  let passageCooldown = 0;
  function cancelPassage() {
    cancelAnimationFrame(passageFrame);
    passageFrame = 0;
    passageBusy = false;
  }
  function moveToStop(destination, releaseAfter = false, velocity = 0) {
    cancelPassage();
    const start = scrollY;
    const distance = destination - start;
    const began = performance.now();
    const duration = Math.min(620, Math.max(460, 460 + Math.abs(distance) * .13));
    // Carry the gesture's speed into a monotone curve with zero speed at arrival.
    const slope = velocity ? Math.min(1.8, Math.max(.5, velocity * duration / Math.max(1, Math.abs(distance)))) : 0;
    passageBusy = true;
    function finish() {
      passageFrame = 0;
      passageBusy = false;
      passageReleased = releaseAfter;
      passageStage = releaseAfter ? 'free' : 'teaser';
      passageCooldown = performance.now() + 180;
    }
    if (reducedMotion.matches) { scrollTo(0, destination); finish(); return; }
    function step(now) {
      const t = Math.min(1, (now - began) / duration);
      const eased = (3 * t * t - 2 * t * t * t) + slope * (t * t * t - 2 * t * t + t);
      scrollTo(0, start + distance * eased);
      if (t < 1) passageFrame = requestAnimationFrame(step);
      else finish();
    }
    passageFrame = requestAnimationFrame(step);
  }
  function passageInput(delta, event) {
    if (delta < 0) {
      cancelPassage();
      passageCooldown = performance.now() + 180;
      return;
    }
    if (passageReleased) return;
    const settlingAtTeaser = passageStage === 'teaser' && Math.abs(scrollY - teaserStop) < 32 && performance.now() < passageCooldown;
    if (passageBusy || settlingAtTeaser) event.preventDefault();
  }
  // A small elastic hinge only at the upper boundary of the hero.
  let edgePosition = 0;
  let edgeGoal = 0;
  let edgeVelocity = 0;
  let edgeFrame = 0;
  let edgeTime = 0;
  let edgeReleaseTimer;
  function paintEdge() {
    root.style.setProperty('--edge-angle',(-edgePosition*.018).toFixed(3)+'deg');
    root.style.setProperty('--edge-y',(edgePosition*.12).toFixed(3)+'px');
    root.style.setProperty('--edge-scale',(1+edgePosition*.000075).toFixed(5));
    root.style.setProperty('--edge-copy-y',(edgePosition*.05).toFixed(3)+'px');
  }
  function settleEdge(time) {
    const dt = edgeTime ? Math.min(.032,(time-edgeTime)/1000) : 1/60;
    edgeTime = time;
    edgeVelocity += ((edgeGoal-edgePosition)*240-edgeVelocity*27)*dt;
    edgePosition += edgeVelocity*dt;
    if (Math.abs(edgeGoal-edgePosition)<.03 && Math.abs(edgeVelocity)<.1) {
      edgePosition = edgeGoal;
      edgeVelocity = 0;
      edgeFrame = 0;
      edgeTime = 0;
      paintEdge();
      return;
    }
    paintEdge();
    edgeFrame = requestAnimationFrame(settleEdge);
  }
  function releaseEdge() {
    clearTimeout(edgeReleaseTimer);
    edgeGoal = 0;
    if (!edgeFrame && edgePosition) edgeFrame = requestAnimationFrame(settleEdge);
  }
  function pullHeroEdge(delta,event) {
    if (reducedMotion.matches || passageBusy || scrollY > 1 || delta >= 0) return false;
    event.preventDefault();
    edgeGoal = Math.min(40,edgeGoal+Math.min(10,Math.abs(delta)*.15));
    if (!edgeFrame) edgeFrame = requestAnimationFrame(settleEdge);
    clearTimeout(edgeReleaseTimer);
    edgeReleaseTimer = setTimeout(releaseEdge,110);
    return true;
  }
  addEventListener('scroll',() => { if (scrollY>1) releaseEdge(); },{passive:true});
  reducedMotion.addEventListener('change',() => {
    if (!reducedMotion.matches) return;
    cancelAnimationFrame(edgeFrame);
    clearTimeout(edgeReleaseTimer);
    edgeFrame = 0;
    edgeTime = 0;
    edgePosition = edgeGoal = edgeVelocity = 0;
    paintEdge();
  });
  addEventListener('touchend',releaseEdge,{passive:true});
  addEventListener('touchcancel',releaseEdge,{passive:true});
  addEventListener('wheel', event => {
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (event.target.closest('.table-wrap,video,input,textarea,select')) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    if (pullHeroEdge(event.deltaY*unit,event)) return;
    if (event.deltaY>0) releaseEdge();
    passageInput(event.deltaY,event);
  }, {passive:false});
  let touchY = 0;
  let touchX = 0;
  addEventListener('touchstart', event => {
    if (event.touches.length !== 1) return;
    touchY = event.touches[0].clientY;
    touchX = event.touches[0].clientX;
  }, {passive:true});
  addEventListener('touchmove', event => {
    if (event.touches.length !== 1 || event.target.closest('.table-wrap,video,input,textarea,select')) return;
    const point = event.touches[0];
    const delta = touchY - point.clientY;
    const horizontal = touchX - point.clientX;
    touchY = point.clientY;
    touchX = point.clientX;
    if (Math.abs(delta) >= Math.abs(horizontal)) {
      if (pullHeroEdge(delta,event)) return;
      if (delta>0) releaseEdge();
      passageInput(delta,event);
    }
  }, {passive:false});
  addEventListener('keydown', event => {
    if (event.target.closest('input,textarea,select,[contenteditable]') || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Escape') { cancelPassage(); passageReleased = true; return; }
    if (['Home','End','ArrowUp','PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey)) {
      cancelPassage(); passageCooldown = performance.now() + 180; return;
    }
    if (event.target.closest('button,a')) return;
    if (['PageDown','ArrowDown',' '].includes(event.key)) passageInput(1, event);
  });
  addEventListener('scroll', () => {
    const now = performance.now();
    const delta = scrollY - previousPassageY;
    const velocity = delta / Math.max(16, now - previousPassageTime);
    previousPassageY = scrollY;
    previousPassageTime = now;
    if (passageBusy) return;
    if (scrollY < 8) { passageReleased = false; passageStage = 'hero'; passageCooldown = 0; }
    else if (scrollY >= overviewStop - 4) { passageReleased = true; passageStage = 'free'; }
    if (passageReleased || delta <= 0 || now < passageCooldown) return;
    const origin = passageStage === 'hero' ? 0 : teaserStop;
    const threshold = Math.min(180, Math.max(110, innerHeight * .18));
    if (scrollY >= origin + threshold) {
      const leavingHero = passageStage === 'hero';
      moveToStop(leavingHero ? teaserStop : overviewStop, !leavingHero, velocity);
    }
  }, {passive:true});
  addEventListener('resize', () => { cancelPassage(); passageCooldown = performance.now() + 180; });
  addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    cancelPassage();
    const href = link.getAttribute('href');
    if (link.closest('.topbar')) {
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      passageReleased = href !== '#top';
      passageStage = passageReleased ? 'free' : 'hero';
      passageCooldown = 0;
      const destination = href === '#top' ? 0 : Math.max(0, scrollY + target.getBoundingClientRect().top);
      scrollTo({top:destination,behavior:reducedMotion.matches ? 'instant' : 'smooth'});
      history.pushState(null,'',href);
      return;
    }
    if (href === '#teaser') {
      event.preventDefault();
      moveToStop(teaserStop);
    } else {
      passageReleased = href !== '#top' && href !== '#main';
      passageStage = passageReleased ? 'free' : 'hero';
      passageCooldown = passageReleased ? performance.now() + 180 : 0;
    }
  });
})();
