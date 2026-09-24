"""Apply reviewed source evidence and merge only identical title + verified URL pairs."""
import importlib.util
import json
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('enrich', ROOT / 'scripts/enrich-publications.py')
enrich = importlib.util.module_from_spec(spec)
spec.loader.exec_module(enrich)


def main():
    path = ROOT / 'data/publications.json'
    data = json.loads(path.read_text())
    overrides = json.loads((ROOT / 'data/publication-link-overrides.json').read_text())
    for paper in data['publications']:
        override = overrides.get(str(paper['id']))
        if override:
            verified = override.get('verified', True)
            paper.update(doi=override.get('doi', '') if verified else '',
                         url=(override.get('url') or 'https://doi.org/' + override['doi']) if verified else '',
                         link_verified=verified, link_verification={'provider': 'manual-primary-source-review',
                         'source_url': override['source_url'], 'reason': override['reason'], 'checked_at': datetime.now(timezone.utc).isoformat()})
            for flag in override.get('review_flags', []):
                if flag not in paper['review_flags']:
                    paper['review_flags'].append(flag)
            if 'metadata' in override:
                paper.update(override['metadata'])
    kept, merged, seen = [], [], {}
    for paper in data['publications']:
        address = paper['url'].lower().rstrip('/')
        key = (enrich.normalized(paper['title']), address)
        if address and key in seen:
            target = seen[key]
            target.setdefault('merged_source_ids', []).append(paper['id'])
            paper['merged_into'] = target['id']
            merged.append(paper)
        else:
            kept.append(paper)
            if address:
                seen[key] = paper
    data['publications'] = kept
    data['merged_publications'] = data.get('merged_publications', []) + merged
    data['deduplication'] = {'rule': 'Normalized identical title AND identical verified canonical URL',
                             'removed_ids': [p['id'] for p in data['merged_publications']],
                             'checked_at': datetime.now(timezone.utc).isoformat()}
    data['notes']['links'] = 'Links checked using publisher-deposited Crossref/DataCite metadata and individually reviewed primary sources. Evidence is recorded per entry. Unknown DOI values remain empty; verified official URLs may be used instead.'
    enrich.save(path, data)
    print(json.dumps({'records': len(kept), 'verified': sum(p['link_verified'] for p in kept),
                      'doi': sum(bool(p['doi']) for p in kept), 'merged_ids': data['deduplication']['removed_ids'],
                      'unresolved': [p['id'] for p in kept if not p['link_verified']]}, indent=2))


if __name__ == '__main__':
    main()
