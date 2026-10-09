import fs from 'node:fs/promises';

const publicationsPath = new URL('../data/publications.json', import.meta.url);
const rankingsPath = new URL('../data/publication_rankings.json', import.meta.url);
const ccfRelease = 'https://www.ccf.org.cn/Academic_Evaluation/By_category/2026-03-05/861526.shtml';
const ccfSource = 'https://lib.ecnu.edu.cn/_upload/article/files/e2/d9/dd45764345088869915f6b3617a4/28891f1f-eb8a-4000-a279-6e7141d92488.pdf';

const journalRanks = {
  'ACM Trans. Sens. Networks': ['B', 'Computer Networks'],
  'Comput. Networks': ['B', 'Computer Networks'],
  'Concurr. Comput. Pract. Exp.': ['C', 'Computer Architecture'],
  'Eng. Appl. Artif. Intell.': ['B', 'Artificial Intelligence'],
  'Expert Syst. Appl.': ['B', 'Artificial Intelligence'],
  'Future Gener. Comput. Syst.': ['C', 'Computer Architecture'],
  'IEEE Internet Things J.': ['C', 'Computer Networks'],
  'IEEE Trans Autom. Sci. Eng.': ['B', 'Cross/Comprehensive/Emerging'],
  'IEEE Trans. Circuits Syst. Video Technol.': ['B', 'Computer Graphics and Multimedia'],
  'IEEE Trans. Comput. Soc. Syst.': ['C', 'Cross/Comprehensive/Emerging'],
  'IEEE Trans. Dependable Secur. Comput.': ['A', 'Network and Information Security'],
  'IEEE Trans. Image Process.': ['A', 'Computer Graphics and Multimedia'],
  'IEEE Trans. Ind. Informatics': ['C', 'Cross/Comprehensive/Emerging'],
  'IEEE Trans. Inf. Theory': ['A', 'Computer Science Theory'],
  'IEEE Trans. Intell. Transp. Syst.': ['B', 'Cross/Comprehensive/Emerging'],
  'IEEE Trans. Mob. Comput.': ['A', 'Computer Networks'],
  'IEEE/ACM Trans. Netw.': ['A', 'Computer Networks'],
  'J. Comput. Syst. Sci.': ['B', 'Computer Science Theory'],
  'J. Netw. Comput. Appl.': ['C', 'Computer Networks'],
  'Mob. Networks Appl.': ['C', 'Computer Networks'],
  'Neural Networks': ['B', 'Artificial Intelligence'],
  'Neurocomputing': ['C', 'Artificial Intelligence'],
  'Pattern Recognit.': ['B', 'Artificial Intelligence'],
  'Soft Comput.': ['C', 'Artificial Intelligence'],
  'The Journal of Supercomputing': ['C', 'Computer Architecture'],
};

const conferenceRanks = {
  A: [
    'INFOCOM',
    'MobiCom',
    'SIGCOMM',
    'Fortieth AAAI Conference on Artificial Intelligence, Thirty-Eighth Conference on Innovative Applications of Artificial Intelligence, Sixteenth Symposium on Educational Advances in Artificial Intelligence, AAAI 2026, Singapore, January 20-27, 2026',
    'IEEE INFOCOM 2026 - IEEE Conference on Computer Communications, Tokyo, Japan, May 18-21, 2026',
  ],
  B: [
    'CIKM', 'ICDCS', 'ICNP', 'ICPP', 'IPSN', 'IWQoS', 'MobiHoc', 'MobiSys', 'SECON',
    'ICPP Workshops', 'SECON Workshops',
    'IEEE/ACM International Symposium on Quality of Service, IWQoS 2026, Istanbul, Turkiye, June 29 - July 2, 2026',
  ],
  C: [
    'GLOBECOM', 'ICC', 'ICCCN', 'ICPADS', 'MASS', 'MMAsia', 'MSN', 'Networking',
    'WASA', 'WASA (1)', 'WCNC',
  ],
};

const conferenceMap = new Map(
  Object.entries(conferenceRanks).flatMap(([category, venues]) => venues.map((venue) => [venue, category])),
);
conferenceMap.set('INFOCOM Workshops', 'A');
conferenceMap.set('SIGCOMM Posters and Demos', 'A');
const rankLevel = { A: 1, B: 2, C: 3 };

const publications = JSON.parse(await fs.readFile(publicationsPath, 'utf8')).publications;
const entries = {};

for (const publication of publications) {
  const isJournal = publication.type === 'journal-article';
  const journalRank = isJournal ? journalRanks[publication.venue] : null;
  const candidateConferenceRank = conferenceMap.get(publication.venue) ?? null;
  const conferenceEligible = publication.type === 'conference-paper'
    && !/workshop|poster|demo|companion/i.test(publication.venue);
  const ccfCategory = journalRank?.[0]
    ?? (conferenceEligible ? candidateConferenceRank : null)
    ?? null;
  const ccfEligible = Boolean(journalRank) || (conferenceEligible && Boolean(candidateConferenceRank));
  const ccfStatus = ccfCategory
    ? 'classified'
    : candidateConferenceRank && !conferenceEligible
      ? 'excluded-publication-format'
      : (isJournal || publication.type === 'conference-paper')
        ? 'not-listed'
      : 'not-applicable';

  // The licensed 2025 CAS table is not available here; retain explicit empty fields instead of inferring zones.
  const cas = {
    edition: isJournal ? 2025 : null,
    major_zone: null,
    subject_zones: [],
    top: null,
    status: isJournal ? 'not-verified' : 'not-applicable',
  };
  const casZones = [cas.major_zone, ...cas.subject_zones.map((item) => item.zone)].filter(Number.isInteger);
  const casLevel = casZones.length ? Math.min(...casZones) : null;
  const ccfLevel = ccfCategory ? rankLevel[ccfCategory] : null;
  const selectedLevel = [ccfLevel, casLevel].filter(Number.isInteger).sort((a, b) => a - b)[0] ?? null;
  const selectedSource = selectedLevel === null
    ? null
    : ccfLevel === selectedLevel
      ? 'CCF'
      : 'CAS';
  const selectedCategory = selectedSource === 'CCF' ? ccfCategory : null;
  const selectedLabel = selectedSource === 'CCF'
    ? `CCF ${selectedCategory}`
    : selectedSource === 'CAS'
      ? `CAS ${selectedLevel}区`
      : null;

  entries[String(publication.id)] = {
    id: publication.id,
    year: publication.year,
    venue: publication.venue,
    type: publication.type,
    ccf: {
      edition: 2026,
      category: ccfCategory,
      venue_category: journalRank?.[0] ?? candidateConferenceRank,
      area: journalRank?.[1] ?? null,
      eligible: ccfEligible,
      status: ccfStatus,
      source: ccfSource,
    },
    cas,
    selected: {
      source: selectedSource,
      level: selectedLevel,
      label_zh: selectedLabel,
      label_en: selectedSource === 'CAS' ? `CAS Zone ${selectedLevel}` : selectedLabel,
      status: isJournal && cas.status !== 'verified'
        ? (selectedSource ? 'cas-pending' : 'cas-pending-unranked')
        : selectedLevel === null
          ? 'unranked'
          : 'verified',
    },
    sort_order: selectedLevel ?? 99,
    sort_key: `${String(selectedLevel ?? 99).padStart(2, '0')}-${String(publication.id).padStart(3, '0')}`,
  };
}

const result = {
  schema_version: 1,
  policy: {
    ccf_edition: 2026,
    cas_edition: 2025,
    equivalence: { 'CCF A': 1, 'CCF B': 2, 'CCF C': 3, 'CAS Zone 1': 1, 'CAS Zone 2': 2, 'CAS Zone 3': 3, 'CAS Zone 4': 4 },
    selection: 'Choose the highest level (smallest number); prefer CCF when levels tie.',
    ordering: 'Within each publication year: selected level ascending, then original publication ID ascending; unranked entries last.',
    ccf_release: ccfRelease,
    ccf_source: ccfSource,
    cas_source: 'https://www.lib.szu.edu.cn/er/fenqubiao',
    cas_limitation: 'The complete licensed 2025 CAS partition table was not available for verification; zone fields are intentionally null until checked against authorized data.',
  },
  publications: entries,
  records: Object.values(entries),
};

await fs.writeFile(rankingsPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Generated ranking metadata for ${Object.keys(entries).length} publications.`);
