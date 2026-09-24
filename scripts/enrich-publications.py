"""Resolve bibliography links using publisher-deposited Crossref/DataCite records.

Responses are cached outside the repository. Ambiguous matches are not accepted.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
from difflib import SequenceMatcher
import html
import json
from pathlib import Path
import re
import time
import tomllib
import unicodedata
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]


def normalized(text):
    text = re.sub(r'<[^>]*>', '', html.unescape(text))
    return ''.join(c for c in unicodedata.normalize('NFKD', text).lower() if c.isalnum())


def save(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def get_json(url, cache):
    if cache.exists():
        return json.loads(cache.read_text())
    for attempt in range(2):
        try:
            request = Request(url, headers={'User-Agent': 'WilnaBibliographyVerification/1.0', 'Accept': 'application/json'})
            with urlopen(request, timeout=40) as response:
                payload = json.load(response)
            save(cache, payload)
            time.sleep(.2)
            return payload
        except Exception:
            if attempt:
                raise
            time.sleep(2)


def merge_legacy(data):
    papers = data['publications']
    mapping = []
    for path in sorted((ROOT / 'content/en/papers').glob('*.md')):
        source = path.read_text().split('+++')[1]
        meta = tomllib.loads(source)
        if path.stem == '_index' or meta.get('draft'):
            continue
        title = meta['title']
        match = next((p for p in papers if normalized(p['title']) == normalized(title)), None)
        if not match:
            year = int(str(meta['date'])[:4])
            authors = [a['name'] for a in meta['paper']['author']]
            citation = f"{', '.join(authors)}. {title}. {meta['publisher'].strip()}, {year}."
            match = dict(id=max(p['id'] for p in papers) + 1, title=title, authors=authors, year=year,
                         venue=meta['publisher'].strip(), volume='', issue='', pages='', article_number='',
                         type='journal-article', contributor_role='author', eprint_id='', publication_details=f'{year}.',
                         doi='', url='', link_verified=False, source_pages=[], raw_reference=meta.get('bibtex', citation),
                         citation=citation, review_flags=[], related_ids=[], source_kind='legacy-site')
            papers.append(match)
        sources = match.setdefault('legacy_sources', [])
        relative = str(path.relative_to(ROOT))
        if relative not in sources:
            sources.append(relative)
        mapping.append({'source': relative, 'publication_id': match['id'], 'added_from_legacy': match.get('source_kind') == 'legacy-site'})
    data['legacy_mapping'] = mapping


def score(paper, item):
    title = ': '.join(item.get('title', []) + item.get('subtitle', []))
    ratio = SequenceMatcher(None, normalized(paper['title']), normalized(title)).ratio()
    author_names = [normalized(' '.join([a.get('given', ''), a.get('family', '')])) for a in item.get('author', item.get('editor', []))]
    family_names = [normalized(a.get('family', '')) for a in item.get('author', item.get('editor', []))]
    full_overlap = sum(normalized(a) in author_names for a in paper['authors']) / len(paper['authors'])
    family_overlap = sum(any(f.endswith(normalized(a.split()[-1])) for f in family_names) for a in paper['authors']) / len(paper['authors'])
    years = {item[k]['date-parts'][0][0] for k in ['published', 'published-print', 'published-online', 'issued'] if item.get(k, {}).get('date-parts')}
    same_year = paper['year'] in years
    expected_type = {'journal-article': 'journal-article', 'conference-paper': 'proceedings-article', 'poster': 'proceedings-article', 'poster-demo': 'proceedings-article', 'book-chapter': 'book-chapter'}.get(paper['type'])
    right_type = not expected_type or expected_type == item.get('type')
    if expected_type == 'proceedings-article' and item.get('type') == 'book-chapter':
        right_type = any('Lecture Notes' in name for name in item.get('container-title', []))
    issue_match = not paper['issue'] or not item.get('issue') or normalized(paper['issue']) == normalized(item['issue'])
    volume_match = not paper['volume'] or not item.get('volume') or normalized(paper['volume']) == normalized(item['volume'])
    accepted = ratio >= .985 and full_overlap >= .6 and family_overlap >= .75 and same_year and right_type and issue_match and volume_match
    return dict(title_similarity=round(ratio, 5), full_author_overlap=round(full_overlap, 3), family_overlap=round(family_overlap, 3),
                years=sorted(years), same_year=same_year, right_type=right_type, issue_match=issue_match, volume_match=volume_match,
                accepted=accepted)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cache', type=Path, default=Path('/private/tmp/wilna-doi-cache'))
    parser.add_argument('--ids', help='Optional comma-separated IDs')
    args = parser.parse_args()
    args.cache.mkdir(parents=True, exist_ok=True)
    path = ROOT / 'data/publications.json'
    data = json.loads(path.read_text())
    merge_legacy(data)
    selected = {int(i) for i in args.ids.split(',')} if args.ids else None
    report = []
    for p in data['publications']:
        if selected and p['id'] not in selected:
            continue
        try:
            if p['type'] == 'preprint':
                doi = '10.48550/arXiv.' + p['eprint_id']
                url = 'https://api.datacite.org/dois/' + quote(doi, safe='/')
                attributes = get_json(url, args.cache / f"{p['id']}-datacite.json")['data']['attributes']
                title = attributes['titles'][0]['title']
                if normalized(title) != normalized(p['title']):
                    raise ValueError('DataCite title mismatch')
                p.update(doi=attributes['doi'], url='https://doi.org/' + attributes['doi'], link_verified=True,
                         link_verification={'provider': 'DataCite', 'source_url': url, 'title': title, 'checked_at': datetime.now(timezone.utc).isoformat(), 'creators': attributes['creators']})
                report.append({'id': p['id'], 'status': 'verified', 'doi': p['doi']})
            else:
                url = 'https://api.crossref.org/works?' + urlencode({'query.title': p['title'], 'query.author': p['authors'][0], 'rows': 5})
                items = get_json(url, args.cache / f"{p['id']}-search.json")['message']['items']
                candidates = [{'item': item, 'match': score(p, item)} for item in items]
                accepted = [c for c in candidates if c['match']['accepted']]
                distinct = {c['item']['DOI'].lower() for c in accepted}
                if len(distinct) == 1:
                    chosen = accepted[0]
                    item = chosen['item']
                    p.update(doi=item['DOI'], url='https://doi.org/' + item['DOI'], link_verified=True,
                             link_verification={'provider': 'Crossref', 'source_url': 'https://api.crossref.org/works/' + quote(item['DOI'], safe=''),
                                                'checked_at': datetime.now(timezone.utc).isoformat(), 'title': item.get('title'),
                                                'authors': item.get('author', item.get('editor', [])), 'container_title': item.get('container-title'),
                                                'volume': item.get('volume'), 'issue': item.get('issue'), 'page': item.get('page'),
                                                'article_number': item.get('article-number'), 'match': chosen['match']})
                    report.append({'id': p['id'], 'status': 'verified', 'doi': p['doi']})
                else:
                    report.append({'id': p['id'], 'status': 'review', 'title': p['title'], 'candidates': [dict(doi=c['item']['DOI'], title=c['item'].get('title'), venue=c['item'].get('container-title'), type=c['item'].get('type'), match=c['match']) for c in candidates]})
            print(f"[{p['id']}] {report[-1]['status']}", flush=True)
        except Exception as error:
            report.append({'id': p['id'], 'status': 'error', 'error': str(error)})
            print(f"[{p['id']}] {error}", flush=True)
        save(path, data)
        save(args.cache / 'report.json', report)
    print(Counter(r['status'] for r in report), flush=True)


if __name__ == '__main__':
    main()
