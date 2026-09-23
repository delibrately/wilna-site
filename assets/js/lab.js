(() => {
  const menu = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.site-nav');
  const mobile = window.matchMedia('(max-width: 1080px)');
  const setMenu = (open, returnFocus = false) => {
    navigation.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    navigation.inert = mobile.matches && !open;
    if (returnFocus) menu.focus();
  };
  document.documentElement.classList.add('js');
  if (menu && navigation) {
    setMenu(false);
    menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
    navigation.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    });
    document.addEventListener('click', (event) => { if (!event.target.closest('.site-header')) setMenu(false); });
    document.querySelector('.site-header').addEventListener('focusout', (event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setMenu(false);
    });
    mobile.addEventListener('change', () => setMenu(false));
  }

  const carousel = document.querySelector('[data-hero-carousel]');
  if (carousel) {
    const slides = [...carousel.querySelectorAll('[data-hero-slide]')];
    const dots = [...carousel.querySelectorAll('[data-hero-dot]')];
    let index = 0;
    let timer;
    const show = (next) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === index);
        slide.setAttribute('aria-hidden', String(i !== index));
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === index);
        if (i === index) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      carousel.querySelector('[data-slide-count]').textContent = String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    };
    const sync = () => {
      clearInterval(timer);
      if (slides.length > 1 && !document.hidden) {
        timer = setInterval(() => show(index + 1), 6000);
      }
    };
    dots.forEach((dot) => dot.addEventListener('click', () => { show(Number(dot.dataset.slideIndex)); sync(); }));
    document.addEventListener('visibilitychange', sync);
    show(0);
    sync();
  }

  const filters = document.querySelector('[data-paper-filters]');
  if (filters) {
    const year = filters.querySelector('[name="year"]');
    const topic = filters.querySelector('[name="topic"]');
    const count = document.querySelector('[data-paper-count]');
    const empty = document.querySelector('[data-paper-empty]');
    const papers = [...document.querySelectorAll('[data-paper]')];
    const apply = () => {
      let visible = 0;
      papers.forEach((paper) => {
        paper.hidden = Boolean((year.value && paper.dataset.year !== year.value) || (topic.value && paper.dataset.topic !== topic.value));
        if (!paper.hidden) visible++;
      });
      document.querySelectorAll('[data-year-group]').forEach((group) => {
        group.hidden = !group.querySelector('[data-paper]:not([hidden])');
      });
      count.textContent = visible + ' ' + count.dataset.label;
      empty.hidden = visible !== 0;
    };
    filters.hidden = false;
    filters.addEventListener('change', apply);
    filters.addEventListener('reset', () => setTimeout(apply, 0));
    apply();
  }
})();
