"""Validate the bibliography, optionally against an independent PDF extractor."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_YEARS = {2026: 25, 2025: 14, 2024: 23, 2023: 25, 2022: 23, 2021: 20,
                  2020: 12, 2019: 16, 2018: 23, 2017: 11, 2016: 6, 2015: 14,
                  2014: 7, 2013: 7, 2012: 6, 2011: 14, 2010: 10, 2009: 5, 2008: 2}
TYPES = {'journal-article', 'conference-paper', 'poster', 'poster-demo', 'preprint',
         'editorial', 'edited-volume', 'book-chapter'}


def compact(text):
    return ''.join(c for c in unicodedata.normalize('NFKD', text).lower() if c.isalnum())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pdf', type=Path)
    args = parser.parse_args()
    data = json.loads((ROOT / 'data/publications.json').read_text())
    papers = data['publications']
    original = [p for p in papers + data.get('merged_publications', []) if p['id'] <= 263]
    assert len(original) == 263
    assert sorted(p['id'] for p in original) == list(range(1, 264))
    assert Counter(p['year'] for p in original) == EXPECTED_YEARS
    assert len({p['id'] for p in papers}) == len(papers)
    by_id = {p['id']: p for p in papers}
    for p in papers:
        assert p['type'] in TYPES
        assert p['title'] and p['title'] in p['citation'], p['id']
        assert p['venue'] and p['venue'] in p['citation'], p['id']
        assert all(a and a in p['citation'] for a in p['authors']), p['id']
        if p['id'] <= 263:
            assert p['raw_reference'].startswith(f"[{p['id']}] ")
            assert len(re.findall(r'\[\d+\]', p['raw_reference'])) == 1
        assert p['citation'].endswith(str(p['year']) + '.')
        if p['link_verified']:
            assert p['url'].startswith('https://') and p['link_verification']['source_url'].startswith('https://')
            if p['doi']:
                assert p['url'].lower() == ('https://doi.org/' + p['doi']).lower()
        else:
            assert not p['doi'] and not p['url']
        assert all(1 <= n <= 19 for n in p['source_pages'])
        assert not re.search(r'[\ufffd\ufb00-\ufb06]|[a-z]- [a-z]', p['citation']), p['id']
        for related in p['related_ids']:
            assert related != p['id'] and p['id'] in by_id[related]['related_ids']
    assert by_id[65]['authors'][-2:] == ['Md. Jalil Piran', 'Atif Alamri']
    assert len(by_id[140]['authors']) == 6
    assert 'Noël Crespi' in by_id[147]['authors'] and 'Noël Crespi' in by_id[192]['authors']
    assert by_id[111]['venue'] == 'Ann. des Télécommunications'
    assert [p['id'] for p in papers if 'affiliation-unconfirmed' in p['review_flags']] == list(range(15, 21))
    assert [p['id'] for p in papers if p['contributor_role'] == 'editor'] == [108, 109, 110, 180]
    assert by_id[233]['issue'] != by_id[234]['issue']
    keys = [(compact(p['title']), p['url'].lower()) for p in papers if p['url']]
    assert len(keys) == len(set(keys)), 'Repeated title and URL'
    assert any(p['title'].lower().startswith('deeploc:') for p in papers)
    if args.pdf:
        from pypdf import PdfReader
        assert hashlib.sha256(args.pdf.read_bytes()).hexdigest() == data['source']['sha256']
        reader = PdfReader(args.pdf)
        text = '\n'.join(re.sub(r'\n\d+\s*$', '', p.extract_text()) for p in reader.pages)
        entries = list(re.finditer(r'\[(\d+)\]\s*(.*?)(?=\[\d+\]|\Z)', text, re.S))
        assert [int(m[1]) for m in entries] == list(range(1, 264))
        for entry in entries:
            p = by_id[int(entry[1])]
            assert compact(entry[0]) == compact(p['raw_reference']), f"PDF text mismatch [{p['id']}]"
            assert int(re.search(r'(\d{4})\.\s*$', entry[2])[1]) == p['year']
        assert not [a for p in reader.pages for a in p.get('/Annots', [])]
    print(json.dumps({'records': len(papers), 'years': Counter(p['year'] for p in papers),
                      'types': Counter(p['type'] for p in papers),
                      'related_groups': len(data['relationships']), 'independent_pdf_check': bool(args.pdf)}, indent=2))


if __name__ == '__main__':
    main()
