(() => {
  const root = document.querySelector('[data-publications]');
  if (!root) return;
  const form = root.querySelector('[data-publication-filters]');
  const query = form.elements.q;
  const year = form.elements.year;
  const type = form.elements.type;
  const result = root.querySelector('#publication-results');
  const count = root.querySelector('[data-publication-count]');
  const empty = root.querySelector('[data-publication-empty]');
  const navigation = root.querySelector('[data-publication-pagination]');
  const previous = root.querySelector('[data-publication-prev]');
  const next = root.querySelector('[data-publication-next]');
  const pageSelect = root.querySelector('[data-publication-page]');
  const groups = [...root.querySelectorAll('[data-publication-year]')];
  const normalize = (text) => text.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const papers = [...root.querySelectorAll('[data-publication]')].map((element) => ({
    element,
    text: normalize(['title', 'authors', 'venue'].map((field) => element.querySelector(`[data-publication-${field}]`).textContent).join(' ')),
  }));
  const size = 20;
  let page = 1;
  const writeURL = () => {
    const url = new URL(location.href);
    for (const [key, value] of [['q', query.value.trim()], ['year', year.value], ['type', type.value], ['page', page > 1 ? String(page) : '']]) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    history.replaceState(null, '', url);
    const languageLink = document.querySelector('.language-link');
    if (languageLink) {
      const translated = new URL(languageLink.href);
      translated.search = url.search;
      translated.hash = url.hash;
      languageLink.setAttribute('href', translated.pathname + translated.search + translated.hash);
    }
  };
  const render = (focus = false) => {
    const terms = normalize(query.value).split(' ').filter(Boolean);
    const matched = papers.filter(({ element, text }) =>
      (!year.value || element.dataset.year === year.value) &&
      (!type.value || element.dataset.type === type.value) && terms.every((term) => text.includes(term)));
    const totalPages = Math.max(1, Math.ceil(matched.length / size));
    page = Math.max(1, Math.min(page, totalPages));
    const visible = new Set(matched.slice((page - 1) * size, page * size));
    papers.forEach((paper) => { paper.element.hidden = !visible.has(paper); });
    groups.forEach((group) => { group.hidden = !group.querySelector('[data-publication]:not([hidden])'); });
    const first = matched.length ? (page - 1) * size + 1 : 0;
    const last = Math.min(page * size, matched.length);
    count.textContent = root.dataset.language === 'zh' ? `共 ${matched.length} 条文献 · 显示 ${first}–${last} 条` : `${matched.length} publications · Showing ${first}–${last}`;
    empty.hidden = matched.length !== 0;
    navigation.hidden = totalPages <= 1;
    previous.disabled = page === 1;
    next.disabled = page === totalPages;
    pageSelect.replaceChildren(...Array.from({ length: totalPages }, (_, i) => new Option(String(i + 1), String(i + 1), false, i + 1 === page)));
    root.querySelector('[data-publication-pages]').textContent = ` / ${totalPages}`;
    writeURL();
    if (focus) { result.focus(); result.scrollIntoView({ block: 'start' }); }
  };
  const readURL = () => {
    const params = new URLSearchParams(location.search);
    query.value = params.get('q') || '';
    year.value = [...year.options].some((option) => option.value === params.get('year')) ? params.get('year') : '';
    type.value = [...type.options].some((option) => option.value === params.get('type')) ? params.get('type') : '';
    page = /^\d+$/.test(params.get('page') || '') ? Number(params.get('page')) : 1;
  };
  const revealHash = () => {
    const target = papers.find(({ element }) => '#' + element.id === location.hash);
    if (!target) return;
    query.value = ''; year.value = ''; type.value = '';
    page = Math.floor(papers.indexOf(target) / size) + 1;
    render();
    target.element.focus();
    target.element.scrollIntoView({ block: 'start' });
  };
  const filter = () => {
    page = 1;
    history.replaceState(null, '', location.pathname + location.search);
    render();
  };
  form.addEventListener('submit', (event) => { event.preventDefault(); filter(); });
  query.addEventListener('input', filter);
  year.addEventListener('change', filter);
  type.addEventListener('change', filter);
  form.addEventListener('reset', (event) => {
    event.preventDefault();
    query.value = ''; year.value = ''; type.value = '';
    filter();
  });
  const turnPage = (value) => { page = value; history.replaceState(null, '', location.pathname + location.search); render(true); };
  previous.addEventListener('click', () => turnPage(page - 1));
  next.addEventListener('click', () => turnPage(page + 1));
  pageSelect.addEventListener('change', () => turnPage(Number(pageSelect.value)));
  window.addEventListener('hashchange', revealHash);
  window.addEventListener('popstate', () => { readURL(); render(); revealHash(); });
  readURL();
  render();
  revealHash();
  form.hidden = false;
})();
