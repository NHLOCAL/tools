/* Apply theme before paint. Storage restrictions must not break the site. */
(() => {
  let theme;
  try { theme = localStorage.getItem('theme'); } catch { /* Private browsing. */ }
  if (theme !== 'dark' && theme !== 'light') {
    theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = theme;
})();
