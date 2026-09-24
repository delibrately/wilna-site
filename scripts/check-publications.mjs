import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function checkPublications(page, base, output) {
  const data = JSON.parse(await fs.readFile(new URL('../data/publications.json', import.meta.url), 'utf8')).publications;
  const sorted = [...data].sort((a, b) => b.year - a.year || a.id - b.id);
  const visibleIDs = () => page.locator('[data-publication]:visible').evaluateAll((items) => items.map((item) => Number(item.dataset.id)));
  const reset = () => page.locator('[data-publication-filters] button[type="reset"]').click();
  for (const lang of ['zh', 'en']) {
    await page.goto(base + lang + '/papers/');
    await page.waitForSelector('[data-publication-filters]:visible');
    assert.equal(await page.locator('[data-publication]').count(), data.length);
    assert.equal(await page.locator('.publication-citation,.publication-related,.publication-flag,.publication-archive').count(), 0);
    assert.equal(await page.locator('.page-heading p:not(.eyebrow)').count(), 0);
    assert.equal(await page.locator('.publication-summary > p').count(), 1);
    assert.deepEqual(await visibleIDs(), sorted.slice(0, 20).map((p) => p.id));
    assert.equal(await page.locator('[data-publication-prev]').isDisabled(), true);
    const rendered = await page.locator('[data-publication]').evaluateAll((items) => items.map((item) => ({
      id: Number(item.dataset.id), title: item.querySelector('h3').textContent,
      authors: item.querySelector('[data-publication-authors]').textContent,
    })));
    for (const entry of rendered) {
      const original = data.find((p) => p.id === entry.id);
      assert.equal(entry.title, original.title);
      assert.ok(entry.authors.endsWith(original.authors.join(', ')));
    }
    for (const original of data) {
      const links = page.locator(`#publication-${original.id} a[href^="https://"]`);
      assert.equal(await links.count(), original.link_verified ? (original.doi ? 2 : 1) : 0);
      if (original.link_verified) assert.equal(await links.first().getAttribute('href'), original.url);
    }
    const visited = [];
    const pageCount = Math.ceil(data.length / 20);
    for (let index = 1; index <= pageCount; index++) {
      await page.selectOption('[data-publication-page]', String(index));
      visited.push(...await visibleIDs());
    }
    assert.deepEqual(visited, sorted.map((p) => p.id));
    assert.equal(new Set(visited).size, data.length);
    assert.equal(await page.locator('[data-publication-next]').isDisabled(), true);
    assert.equal((await visibleIDs()).length, data.length % 20 || 20);
    await page.locator('[data-publication-prev]').click();
    assert.equal(await page.locator('[data-publication-page]').inputValue(), '13');
    await page.locator('[data-publication-next]').click();
    assert.equal(await page.locator('[data-publication-page]').inputValue(), '14');
    await reset();
    for (const year of new Set(data.map((p) => p.year))) {
      await page.selectOption('[name="year"]', String(year));
      const expected = sorted.filter((p) => p.year === year);
      assert.deepEqual(await visibleIDs(), expected.slice(0, 20).map((p) => p.id));
      assert.ok((await page.locator('[data-publication-count]').textContent()).includes(String(expected.length)));
    }
    await reset();
    for (const type of new Set(data.map((p) => p.type))) {
      await page.selectOption('[name="type"]', type);
      const expected = sorted.filter((p) => p.type === type);
      assert.deepEqual(await visibleIDs(), expected.slice(0, 20).map((p) => p.id));
    }
    await reset();
    for (const [query, expected] of [
      ['HUMVDETCLAS', [1]], ['Md. Jalil Piran', [65]], ['Noel Crespi', [147, 192]],
      ['SIGCOMM', [25, 85, 128, 157, 158]], ['Dbfed', [78, 87]],
    ]) {
      await page.fill('[name="q"]', query);
      assert.deepEqual(await visibleIDs(), expected, query);
    }
    await page.selectOption('[name="year"]', '2023');
    await page.selectOption('[name="type"]', 'preprint');
    assert.deepEqual(await visibleIDs(), [87]);
    await page.reload();
    assert.deepEqual(await visibleIDs(), [87]);
    const translated = await page.locator('.language-link').getAttribute('href');
    assert.ok(translated.includes('q=Dbfed') && translated.includes('type=preprint'));
    await page.goto(new URL(translated, base).href);
    assert.deepEqual(await visibleIDs(), [87]);
    await page.goto(base + lang + '/papers/#publication-87');
    assert.equal(await page.locator('#publication-87').isVisible(), true);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'publication-87');
    await page.fill('[name="q"]', '<script>missing-publication</script>');
    assert.deepEqual(await visibleIDs(), []);
    assert.equal(await page.locator('[data-publication-empty]').isVisible(), true);
    assert.equal(await page.locator('[data-publication-pagination]').isVisible(), false);
    await reset();
    await page.goto(base + lang + '/papers/?page=999&year=invalid&type=invalid');
    assert.deepEqual(await visibleIDs(), sorted.slice((pageCount - 1) * 20).map((p) => p.id));
    await page.goto(base + lang + '/papers/#publication-263');
    assert.equal(await page.locator('#publication-263').isVisible(), true);
    await reset();
    await page.locator('[name="q"]').focus();
    await page.keyboard.type('Dbfed');
    await page.keyboard.press('Enter');
    assert.deepEqual(await visibleIDs(), [78, 87]);
    for (const width of [320, 390, 768, 1440]) {
      await reset();
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => window.scrollTo(0, 0));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.screenshot({ path: path.join(output, `publications-${lang}-${width}.png`) });
      await page.fill('[name="q"]', 'Dbfed');
      await page.screenshot({ path: path.join(output, `publications-${lang}-${width}-filtered.png`), fullPage: true });
    }
  }
}
