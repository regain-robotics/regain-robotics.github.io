// Section tracking, shared fluid highlights, and leaderboard transitions.
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const tabbar = document.querySelector('.tabs');
  const tabIndicator = document.querySelector('.tab-indicator');
  const boardStage = document.querySelector('.board-stage');
  const boardPanels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  let indicatorAnimation;
  let boardAnimations = [];
  let boardGeneration = 0;
  function moveFluidIndicator(container,indicator,target,animation,animate) {
    const old = indicator.getBoundingClientRect();
    const bounds = container.getBoundingClientRect();
    const fromX = old.left - bounds.left - container.clientLeft + container.scrollLeft;
    const toX = target.offsetLeft;
    const width = target.offsetWidth;
    animation?.cancel();
    indicator.style.transform = `translateX(${toX}px)`;
    indicator.style.width = width+'px';
    if (!animate || reducedMotion.matches) return;
    const bridgeLeft = Math.min(fromX,toX);
    const bridgeWidth = Math.max(fromX+old.width,toX+width)-bridgeLeft;
    return indicator.animate([
      {transform:`translateX(${fromX}px)`,width:old.width+'px'},
      {transform:`translateX(${bridgeLeft}px)`,width:bridgeWidth+'px',offset:.38},
      {transform:`translateX(${toX}px)`,width:width+'px'}
    ],{duration:440,easing:'cubic-bezier(.25,.8,.25,1)'});
  }
  function positionIndicator(tab,animate = false) {
    indicatorAnimation = moveFluidIndicator(tabbar,tabIndicator,tab,indicatorAnimation,animate);
  }
  function clearBoardTransition(selected) {
    boardGeneration++;
    boardAnimations.forEach(animation => animation.cancel());
    boardAnimations = [];
    boardStage.style.height = '';
    boardPanels.forEach((panel,index) => {
      panel.classList.remove('is-leaving');
      panel.hidden = index !== selected;
      panel.inert = index !== selected;
      if (index === selected) panel.removeAttribute('aria-hidden');
      else panel.setAttribute('aria-hidden','true');
    });
  }
  function activate(tab) {
    const previous = tabs.findIndex(item => item.getAttribute('aria-selected') === 'true');
    const next = tabs.indexOf(tab);
    if (next === previous) return;
    const oldHeight = boardStage.getBoundingClientRect().height;
    const oldTransform = getComputedStyle(boardPanels[previous]).transform;
    const oldOpacity = getComputedStyle(boardPanels[previous]).opacity;
    positionIndicator(tab,true);
    clearBoardTransition(next);
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected',String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    if (reducedMotion.matches) return;
    const direction = next > previous ? 1 : -1;
    const outgoing = boardPanels[previous];
    const incoming = boardPanels[next];
    const newHeight = incoming.offsetHeight;
    outgoing.hidden = false;
    outgoing.classList.add('is-leaving');
    boardStage.style.height = newHeight+'px';
    const timing = {duration:440,easing:'cubic-bezier(.25,.8,.25,1)'};
    boardAnimations = [
      outgoing.animate([{transform:oldTransform,opacity:oldOpacity},{transform:`translateX(${-direction*100}%)`,opacity:0}],timing),
      incoming.animate([{transform:`translateX(${direction*100}%)`,opacity:.35},{transform:'translateX(0)',opacity:1}],timing),
      boardStage.animate([{height:oldHeight+'px'},{height:newHeight+'px'}],timing)
    ];
    const generation = boardGeneration;
    Promise.all(boardAnimations.map(animation => animation.finished)).then(() => {
      if (generation === boardGeneration) clearBoardTransition(next);
    }).catch(() => {});
  }
  function resetBoardLayout() {
    const selected = tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');
    clearBoardTransition(selected);
    positionIndicator(tabs[selected]);
  }
  addEventListener('resize',resetBoardLayout);
  reducedMotion.addEventListener('change',resetBoardLayout);
  document.fonts.ready.then(resetBoardLayout);
  resetBoardLayout();
  const sectionNav = document.querySelector('.topbar nav');
  const navIndicator = document.querySelector('.nav-indicator');
  const sectionLinks = [...sectionNav.querySelectorAll('a')];
  let navAnimation;
  let currentSectionLink;
  let navFrame = 0;
  function syncSectionNav(animate = true) {
    navFrame = 0;
    const marker = (innerWidth <= 600 ? 68 : 80) + 96;
    let active;
    sectionLinks.forEach(link => {
      if (link.offsetWidth && document.querySelector(link.getAttribute('href')).getBoundingClientRect().top <= marker) active = link;
    });
    sectionLinks.forEach(link => {
      if (link === active) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
    navIndicator.style.opacity = active ? '1' : '0';
    if (active && (active !== currentSectionLink || !animate)) {
      navAnimation = moveFluidIndicator(sectionNav,navIndicator,active,navAnimation,animate && !!currentSectionLink);
      const left = Math.max(0,Math.min(sectionNav.scrollWidth-sectionNav.clientWidth,active.offsetLeft-(sectionNav.clientWidth-active.offsetWidth)/2));
      sectionNav.scrollTo({left,behavior:reducedMotion.matches || !animate ? 'instant' : 'smooth'});
    }
    currentSectionLink = active;
  }
  function queueSectionNav() {
    if (!navFrame) navFrame = requestAnimationFrame(() => syncSectionNav());
  }
  addEventListener('scroll',queueSectionNav,{passive:true});
  addEventListener('resize',() => syncSectionNav(false));
  document.fonts.ready.then(() => syncSectionNav(false));
  syncSectionNav(false);

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      activate(tabs[next]);
      tabs[next].focus();
    });
  });
})();
