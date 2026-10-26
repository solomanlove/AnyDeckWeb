const menuToggle = document.querySelector('[data-menu-toggle]');
const navLinks = document.querySelector('[data-nav-links]');

menuToggle?.addEventListener('click', () => {
  const isOpen = navLinks?.classList.toggle('is-open') ?? false;
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks?.addEventListener('click', () => {
  navLinks.classList.remove('is-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
});

const searchInput = document.querySelector('[data-help-search]');
const searchItems = [...document.querySelectorAll('[data-search-item]')];
const emptyState = document.querySelector('[data-empty-state]');

searchInput?.addEventListener('input', (event) => {
  const keyword = event.target.value.trim().toLocaleLowerCase('zh-CN');
  let visibleCount = 0;

  searchItems.forEach((item) => {
    const matches = item.textContent.toLocaleLowerCase('zh-CN').includes(keyword);
    item.hidden = !matches;
    visibleCount += matches ? 1 : 0;
  });

  if (emptyState) {
    emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
  }
});

document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});
