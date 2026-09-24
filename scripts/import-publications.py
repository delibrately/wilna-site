"""Import the supplied bibliography; PDF dependencies are only needed for re-import."""
import argparse
import collections
import hashlib
import json
import re
import unicodedata
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]


def normalize(text):
    text = text.replace('No¨el', 'Noël').replace('T´el´ecommunications', 'Télécommunications')
    text = unicodedata.normalize('NFKC', text)
    text = text.replace('”listen”', '"listen"')
    text = re.sub(r'([–-])\n(?=\d)', r'\1', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return re.sub(r'\s+([,.;:])', r'\1', text)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('pdf', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'data/publications.json')
    args = parser.parse_args()
    overrides = json.loads((ROOT / 'data/publication-overrides.json').read_text())
    records = []
    current = None
    with pdfplumber.open(args.pdf) as pdf:
        for page_number, page in enumerate(pdf.pages, 1):
            lines = page.extract_text_lines(x_tolerance=1, return_chars=True)
            for line in lines:
                text = line['text']
                if text == 'References' or re.fullmatch(r'\d+', text):
                    continue
                match = re.match(r'^\[(\d+)\]\s*', text)
                if match:
                    current = {'id': int(match[1]), 'lines': [], 'venue_lines': [], 'source_pages': []}
                    records.append(current)
                if current is None:
                    raise ValueError(f'Unexpected leading text: {text}')
                current['lines'].append(text)
                if page_number not in current['source_pages']:
                    current['source_pages'].append(page_number)
                italic = list({(c['x0'], c['top'], c['text']): c for c in line['chars'] if 'CMTI' in c['fontname']}.values())
                if italic:
                    current['venue_lines'].append(pdfplumber.utils.extract_text(italic, x_tolerance=1, expand_ligatures=False))

    assert [r['id'] for r in records] == list(range(1, 264))
    publications = []
    hyphens = []
    for record in records:
        original = '\n'.join(record['lines'])
        text = re.sub(r'^\[\d+\]\s*', '', original)
        # Reviewed line-wrap tokens distinguish compound hyphens from discretionary ones.
        for token in re.findall(r'([\w]+)-\n([\w]+)', text):
            hyphens.append([record['id'], '-'.join(token)])
        for before, after in overrides['line_wraps'].items():
            text = text.replace(before.replace('|', '\n'), after)
        text = normalize(text)
        venue = normalize('\n'.join(record['venue_lines']))
        for before, after in overrides['line_wraps'].items():
            venue = venue.replace(normalize(before.replace('|', '\n')), after)
        # A later italic series name (e.g. LNCS) is not part of the venue/title.
        while venue and venue not in text:
            venue = venue.rsplit(' ', 1)[0] if ' ' in venue else ''
        editor = ', editors.' in text.split(venue)[0] if venue else False
        if editor:
            author_text, rest = text.split(', editors.', 1)
            title = venue
            tail = rest.strip()[len(venue):].lstrip(' ,')
            kind = 'edited-volume'
        else:
            boundary = re.search(r'(?<=[a-z])(?<!Md)\.\s+', text)
            assert boundary, text
            author_text = text[:boundary.start()]
            rest = text[boundary.end():]
            assert venue and venue in rest, (record['id'], venue, rest)
            title, tail = rest.split(venue, 1)
            title = re.sub(r'\s+In(?:\s.*)?$', '', title).rstrip(' .')
            tail = tail.lstrip(' ,')
            kind = 'conference-paper' if re.search(r'\bIn\s', rest[:rest.index(venue)]) else 'journal-article'
            if venue == 'CoRR':
                kind = 'preprint'
            elif title.lower().startswith('poster'):
                kind = 'poster'
            elif 'Posters and Demos' in venue:
                kind = 'poster-demo'
            elif title.lower().startswith(('guest editorial', 'welcome message')):
                kind = 'editorial'
            elif record['id'] == 130:
                kind = 'book-chapter'
        authors = [a.strip() for a in re.split(r',\s*(?:and\s+)?|\s+and\s+', author_text)]
        year = int(re.search(r'(\d{4})\.$', text)[1])
        pages = re.search(r'\bpages?\s+([^.,]+)', tail)
        volume, issue, article = '', '', ''
        if kind in ('journal-article', 'editorial', 'preprint') and not re.search(r'\bIn\s', rest[:rest.index(venue)]):
            meta = re.match(r'(\d+)(?:\(([^)]+)\))?(?::([^,]+))?,\s+\d{4}\.', tail)
            if meta:
                volume, issue, locator = meta[1], meta[2] or '', meta[3] or ''
                if '–' in locator or '-' in locator:
                    pages = locator
                else:
                    article = locator
        else:
            vol = re.search(r'\bvolume\s+(\d+)', tail)
            volume = vol[1] if vol else ''
        pages = pages[1] if isinstance(pages, re.Match) else pages or ''
        flags = []
        if 'Lei Wang' not in authors:
            flags.append('affiliation-unconfirmed')
        if kind == 'poster-demo':
            flags.append('type-unconfirmed')
        if kind == 'conference-paper' and pages:
            span = re.fullmatch(r'(?:\d+:)?(\d+)[–-](?:\d+:)?(\d+)', pages)
            if span and int(span[2]) - int(span[1]) < 3:
                flags.append('type-unconfirmed')
        pub = dict(id=record['id'], title=title, authors=authors, year=year,
                   venue=venue, volume=volume, issue=issue, pages=pages,
                   article_number=article, type=kind, contributor_role='editor' if editor else 'author',
                   eprint_id=(re.search(r'abs/([^,]+)', tail)[1] if kind == 'preprint' else ''),
                   publication_details=tail, doi='', url='', link_verified=False,
                   source_pages=record['source_pages'], raw_reference=original,
                   citation=text, review_flags=flags, related_ids=[])
        pub.update(overrides.get('entries', {}).get(str(pub['id']), {}))
        publications.append(pub)
    by_id = {p['id']: p for p in publications}
    for group in overrides['relationships']:
        for identifier in group['ids']:
            by_id[identifier]['related_ids'] = sorted(set(by_id[identifier]['related_ids'] + [i for i in group['ids'] if i != identifier]))
            if 'related-version-unconfirmed' not in by_id[identifier]['review_flags']:
                by_id[identifier]['review_flags'].append('related-version-unconfirmed')
    output = {
        'schema_version': 1,
        'source': {'filename': args.pdf.name, 'sha256': hashlib.sha256(args.pdf.read_bytes()).hexdigest(), 'pages': len(pdf.pages), 'expected_count': 263},
        'notes': {'affiliation': 'Bibliography inclusion does not establish laboratory affiliation. Entries without Lei Wang are flagged; no affiliation is inferred for other coauthors.', 'links': 'The supplied PDF contains no verified DOI or publisher URLs. Fields are intentionally empty.', 'case': 'Original title and author casing retained. Only extraction artifacts are normalized.'},
        'relationships': overrides['relationships'],
        'publications': publications,
    }
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'count': len(publications), 'years': dict(sorted(collections.Counter(p['year'] for p in publications).items(), reverse=True)), 'types': collections.Counter(p['type'] for p in publications), 'line_wrap_tokens': hyphens}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
