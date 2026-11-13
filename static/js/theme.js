// Apply the saved palette before first paint; query links can preview either theme.
(() => {
  const root = document.documentElement;
  const query = new URLSearchParams(location.search).get('theme');
  let saved;
  try { saved = localStorage.getItem('regain-theme'); } catch {}
  function apply(theme) {
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'light' ? '#f7f8fa' : '#101114';
  }
  apply(['light','dark'].includes(query) ? query : saved === 'light' ? 'light' : 'dark');
  document.addEventListener('DOMContentLoaded', () => {
    const buttons = [...document.querySelectorAll('.theme-toggle')];
    function syncButton() {
      const light = root.dataset.theme === 'light';
      buttons.forEach(button => {
      button.setAttribute('aria-pressed',String(light));
      button.setAttribute('aria-label',light ? 'Switch to dark theme' : 'Switch to light theme');
      button.title = button.getAttribute('aria-label');
      });
    }
    syncButton();
    let switching = false;
    buttons.forEach(button => button.addEventListener('click', async () => {
      if (switching) return;
      const theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      const update = () => { apply(theme); syncButton(); };
      if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        switching = true;
        try { await document.startViewTransition(update).finished; } finally { switching = false; }
      } else update();
      try { localStorage.setItem('regain-theme',theme); } catch {}
    }));
  });
})();
