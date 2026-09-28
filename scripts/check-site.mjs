import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { checkPublications } from './check-publications.mjs';

const root = path.resolve(process.argv[2] || 'public');
const output = path.resolve(process.argv[3] || '/private/tmp/wilna-redesign/qa');
const require = createRequire(import.meta.url);
const modulePath = process.env.PLAYWRIGHT_MODULE || require.resolve('playwright');
const { chromium } = await import(pathToFileURL(modulePath));
await fs.mkdir(output, { recursive: true });
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.xml': 'application/xml' };
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (!url.pathname.startsWith('/wilna-site/')) { response.writeHead(404).end(); return; }
    const relative = decodeURIComponent(url.pathname.slice('/wilna-site/'.length));
    let filename = path.resolve(root, relative);
    if (!filename.startsWith(root + path.sep) && filename !== root) throw new Error('Invalid path');
    if ((await fs.stat(filename)).isDirectory()) filename = path.join(filename, 'index.html');
    const data = await fs.readFile(filename);
    response.writeHead(200, { 'content-type': mime[path.extname(filename)] || 'application/octet-stream' });
    response.end(data);
  } catch { response.writeHead(404).end(); }
});
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
const origin = 'http://127.0.0.1:' + server.address().port;
const base = origin + '/wilna-site/';
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});
const report = { pages: [], issues: [], interactions: [], screenshots: [] };
const context = await browser.newContext({ reducedMotion: 'reduce' });
const page = await context.newPage();
page.on('pageerror', (error) => report.issues.push({ type: 'javascript', message: error.message }));
page.on('response', (response) => {
  if (response.url().startsWith(origin) && response.status() >= 400) report.issues.push({ type: 'http', status: response.status(), url: response.url() });
});
const researchAreas = ['multimodal-sensing', 'communications-networks', 'collaborative-edge-intelligence', 'physical-ai'];
const keyPages = ['', 'research/', ...researchAreas.map((area) => `research/${area}/`), 'research/acoustic/', 'research/wireless-sensing/', 'people/', 'people/leiwang/', 'people/shahid-muhammad-rehman/', 'people/akehao/', 'people/zhouxiaoyu/', 'papers/', 'papers/wimti/', 'news/', 'news/adapblinker/', 'joinus/'];
try {
  for (const lang of ['zh', 'en']) {
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of keyPages) {
        const relative = lang + '/' + route;
        const response = await page.goto(base + relative, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200, relative);
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].map(async (img) => {
            img.loading = 'eager';
            try { await img.decode(); } catch {}
          }));
        });
        const state = await page.evaluate(() => ({
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          h1: document.querySelectorAll('h1').length,
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content,
          brokenImages: [...document.images].filter((img) => !img.complete || !img.naturalWidth).map((img) => img.currentSrc),
          missingAlt: [...document.images].filter((img) => !img.hasAttribute('alt')).length,
          languageLink: document.querySelector('.language-link')?.getAttribute('href'),
          badPaths: [...document.querySelectorAll('[href],[src]')].flatMap((el) => ['href', 'src'].map((name) => el.getAttribute(name)).filter((value) => value?.startsWith('/') && !value.startsWith('/wilna-site/'))),
          photoWidths: [...document.querySelectorAll('.advisor-card__image,.profile__photo')].map((img) => img.getBoundingClientRect().width),
        }));
        report.pages.push({ route: relative, width, ...state });
        if (state.scrollWidth > width || state.h1 !== 1 || !state.description || state.brokenImages.length || state.missingAlt || state.badPaths.length) report.issues.push({ type: 'page', route: relative, width, state });
        const expectedLanguage = '/wilna-site/' + (lang === 'zh' ? 'en' : 'zh') + '/' + route;
        if (state.languageLink !== expectedLanguage) report.issues.push({ type: 'translation', route: relative, got: state.languageLink, expected: expectedLanguage });
        if ((lang === 'zh' && ['', 'people/', 'research/acoustic/', 'papers/', 'news/', 'joinus/'].includes(route) && [390,1440].includes(width)) || (lang === 'en' && ['', 'people/'].includes(route) && width === 1440)) {
          const name = lang + '-' + (route.replaceAll('/', '-').replace(/-$/, '') || 'home') + '-' + width + '.png';
          await page.screenshot({ path: path.join(output, name), fullPage: true });
          if (route === '' || route === 'people/') {
            await page.screenshot({ path: path.join(output, name.replace('.png', '-viewport.png')) });
          }
          report.screenshots.push(name);
        }
      }
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + 'zh/');
  const menu = page.locator('.menu-toggle');
  await menu.focus();
  await page.keyboard.press('Enter');
  assert.equal(await menu.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.textContent), '首页');
  await page.keyboard.press('Escape');
  assert.equal(await menu.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains('menu-toggle')), true);
  report.interactions.push('mobile keyboard menu, Escape, and focus return');
  assert.equal(await page.locator('[data-hero-slide]').count(), 3);
  assert.equal(await page.locator('[data-hero-dot]').count(), 3);
  assert.equal(await page.locator('[data-carousel-toggle], [data-full-photo]').count(), 0);
  await page.locator('[data-hero-dot]').nth(2).click();
  assert.equal(await page.locator('[data-hero-dot]').nth(2).getAttribute('aria-current'), 'true');
  await page.locator('[data-hero-dot]').nth(2).focus();
  await page.locator('[data-hero-dot]').nth(2).hover();
  await page.waitForTimeout(6400);
  assert.equal(await page.locator('[data-hero-dot]').nth(0).getAttribute('aria-current'), 'true');
  assert.equal(await page.locator('[data-hero-slide]').first().evaluate((slide) => getComputedStyle(slide).transitionDuration), '0s');
  report.interactions.push('three slides, removed full-photo/playback controls, manual selection, wraparound, autoplay during hover/focus and reduced-motion without transitions');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(base + 'zh/');
  await page.mouse.move(0, 0);
  await page.waitForTimeout(6400);
  assert.equal(await page.locator('[data-hero-dot]').nth(1).getAttribute('aria-current'), 'true');
  await page.waitForTimeout(6400);
  assert.equal(await page.locator('[data-hero-dot]').nth(2).getAttribute('aria-current'), 'true');
  await page.waitForTimeout(6400);
  assert.equal(await page.locator('[data-hero-dot]').nth(0).getAttribute('aria-current'), 'true');
  await page.goto(base + 'en/');
  assert.equal(await page.locator('[data-carousel-toggle], [data-full-photo]').count(), 0);
  await page.waitForTimeout(6400);
  assert.equal(await page.locator('[data-hero-dot]').nth(1).getAttribute('aria-current'), 'true');
  report.interactions.push('continuous six-second full cycle and English autoplay');

  await checkPublications(page, base, output);
  for (const lang of ['zh', 'en']) {
    const expected = lang === 'zh'
      ? ['多模态感知', '通信与网络', '协同边缘智能', '物理 AI 系统']
      : ['Multimodal Sensing', 'Communications and Networks', 'Collaborative Edge Intelligence', 'Physical AI Systems'];
    for (const route of ['', 'research/']) {
      await page.goto(base + lang + '/' + route);
      assert.deepEqual(await page.locator('.research-card h3').allTextContents(), expected);
      assert.deepEqual(await page.locator('.research-card h3 a').evaluateAll((links) => links.map((a) => a.getAttribute('href'))), researchAreas.map((area) => `/wilna-site/${lang}/research/${area}/`));
      assert.equal(await page.locator('.research-card img').count(), 4);
      assert.equal(await page.locator('.research-topics li').count(), 13);
      assert.equal(await page.locator('.project-card').count(), 4);
      if (!route) {
        assert.ok((await page.title()).includes('WiLNA'));
        assert.equal(await page.locator('.hero__full-name').textContent(), 'Wireless Lab of Network and Application');
        assert.equal(await page.locator('h1').first().textContent(), 'WiLNA');
        assert.ok((await page.locator('.hero__tagline').textContent()).includes(lang === 'zh' ? '感知 · 连接 · 决策 · 交互' : 'Decision-making'));
        assert.ok((await page.locator('.hero__description').textContent()).includes(lang === 'zh' ? '面向海洋作业与工业现场' : 'marine operations'));
      }
    }
    await page.goto(base + lang + '/joinus/');
    assert.deepEqual(await page.locator('.join-directions h3').allTextContents(), expected);
    await page.goto(base + lang + '/research/multimodal-sensing/');
    assert.equal(await page.locator('.research-topic-links a').count(), 2);
    for (const area of researchAreas) {
      await page.goto(base + lang + `/research/${area}/`);
      assert.equal(await page.locator('.area-section').count(), 3);
      assert.deepEqual(await page.locator('.area-section h2').allTextContents(), lang === 'zh' ? ['研究目标', '具体课题', '代表成果'] : ['Research Goal', 'Specific Topics', 'Representative Results']);
      assert.ok(await page.locator('.area-goal').textContent());
      assert.ok(await page.locator('.area-topic-list li').count() > 0);
      assert.ok(await page.locator('.area-paper-list li').count() > 0);
      assert.ok(await page.locator('.area-paper-list a').evaluateAll((links) => links.every((a) => a.href.startsWith('https://doi.org/'))));
      assert.equal(await page.locator('.project-card').count(), 1);
      assert.equal(await page.locator('.area-paper-list li').count(), 1);
      assert.equal(await page.locator('.project-card .text-link').count(), 1);
      assert.ok((await page.locator('.project-card .text-link').getAttribute('href')).startsWith('https://doi.org/'));
      assert.ok(await page.locator('.research-area-figure img').evaluate((img) => img.complete && img.naturalWidth > 0));
      assert.equal(await page.locator('main img:not(.site-brand__university):not(.site-brand__team)').count(), 1);
      assert.equal(await page.locator('figcaption').count(), 0);
      assert.equal(await page.locator('.area-all-papers').getAttribute('href'), `/wilna-site/${lang}/papers/`);
    }
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ['', 'research/', ...researchAreas.map((area) => `research/${area}/`)]) {
        await page.goto(base + lang + '/' + route, { waitUntil: 'networkidle' });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        if (route === 'research/' || route === '') await page.screenshot({ path: path.join(output, `research-update-${lang}-${route ? 'areas' : 'hero'}-${width}.png`), fullPage: !!route });
      }
    }
  }
  report.interactions.push('four ordered bilingual research areas, 13 topics, correct links, updated hero, old topic routes and 320/390/768/1440px layouts');
  report.interactions.push('Data-driven exact titles/authors and verified links, pagination without duplicates, all years/types, title/author/venue search, combined filters, reset, empty state, URL persistence, language switch, keyboard and bilingual 320/390/768/1440px layouts');

  await page.goto(base + 'zh/people/');
  assert.equal(await page.locator('.advisor-card').count(), 4);
  assert.deepEqual(await page.locator('.advisor-card h3').allTextContents(), ['王雷', '覃振权', '池建成', '李中尉']);
  assert.ok((await page.locator('.advisor-card').last().textContent()).includes('dllizhongwei@gmail.com'));
  assert.equal(await page.locator('#students .member-card').count(), 43);
  assert.equal(await page.locator('#phd-students .member-card').count(), 18);
  assert.equal(await page.locator('#master-students .member-card').count(), 25);
  assert.equal(await page.locator('#undergraduate-students .member-card').count(), 0);
  assert.equal(await page.locator('#alumni .member-card').count(), 18);
  assert.ok((await page.locator('#phd-students .member-card__identity').allTextContents()).every((identity) => identity === '博士'));
  assert.ok((await page.locator('#master-students .member-card__identity').allTextContents()).every((identity) => identity === '硕士'));
  assert.ok((await page.locator('#phd-students').textContent()).includes('Shahid Muhammad Rehman'));
  assert.equal(await page.locator('#master-students a[href$="/akehao/"] .member-card__photo').count(), 0);
  assert.equal(await page.locator('#phd-students a[href$="/wangzhaohui/"] .member-card__photo').count(), 0);
  assert.equal(await page.locator('#master-students a[href$="/akehao/"] .member-card__mark').count(), 1);
  assert.equal(await page.locator('#phd-students a[href$="/wangzhaohui/"] .member-card__mark').count(), 1);
  report.interactions.push('4 faculty, 18 PhD students, 25 masters, empty undergraduate section, 18 alumni, English international names, missing-photo placeholders');
  await page.goto(base + 'en/people/');
  assert.deepEqual(await page.locator('.advisor-card h3').allTextContents(), ['Lei Wang', 'Zhenquan Qin', 'Jiancheng Chi', 'Li Zhongwei']);
  assert.ok((await page.locator('.advisor-card').last().textContent()).includes('dllizhongwei@gmail.com'));
  await page.goto(base + 'zh/people/akehao/');
  assert.equal(await page.locator('.profile__grid--student h1').textContent(), '阿克豪');
  assert.equal(await page.locator('.profile__role').textContent(), '硕士');
  assert.equal(await page.locator('.profile__research').count(), 0);
  assert.equal(await page.locator('.profile__intro').count(), 0);
  await page.goto(base + 'en/people/shahid-muhammad-rehman/');
  assert.equal(await page.locator('.profile__grid--student h1').textContent(), 'Shahid Muhammad Rehman');
  assert.equal(await page.locator('.profile__role').textContent(), 'PhD');
  for (const lang of ['zh', 'en']) {
    await page.goto(base + lang + '/news/');
    assert.equal(await page.locator('#archive').count(), 0);
  }
  report.interactions.push('bilingual faculty order and removal of historical news archive');

  for (const width of [320, 1080, 1200]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const relative of ['zh/', 'en/', 'zh/people/', 'en/people/', 'zh/papers/']) {
      await page.goto(base + relative, { waitUntil: 'networkidle' });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, relative + ':' + width);
    }
  }
  report.interactions.push('320, 1080, and 1200px breakpoint overflow checks');

  const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJSPage = await noJS.newPage();
  await noJSPage.goto(base + 'zh/papers/');
  const publicationData = JSON.parse(await fs.readFile(new URL('../data/publications.json', import.meta.url), 'utf8'));
  assert.equal(await noJSPage.locator('[data-publication]:visible').count(), publicationData.publications.length);
  assert.equal(await noJSPage.locator('.site-nav').isVisible(), true);
  await noJS.close();
  report.interactions.push('navigation and all publications available without JavaScript');
} catch (error) {
  report.issues.push({ type: 'assertion', message: error.stack });
} finally {
  await fs.writeFile(path.join(output, 'browser-report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
console.log(JSON.stringify({ pageChecks: report.pages.length, issues: report.issues, interactions: report.interactions, screenshots: output }, null, 2));
if (report.issues.length) process.exitCode = 1;
