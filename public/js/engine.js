/**
 * Shared relevance engine (no external API / no LLM).
 *
 * This single file runs in BOTH places:
 *   - the Node/Express backend (server/search.js re-exports it), and
 *   - the browser, when the app is served as a static site (e.g. on Vercel).
 *
 * It ranks colleagues for a plain-language query and returns a one-sentence
 * reason for each, using tokenisation + stop-word removal, prefix matching
 * (so "budget" matches "budgeting"), a small synonym map, per-field weighting,
 * and a completeness multiplier.
 *
 * Rules enforced here:
 *   - people whose "What I don't do" matches the query are never highlighted,
 *   - the searcher is never suggested to themselves,
 *   - more complete profiles count for more.
 */

(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Engine = api;
})(typeof self !== 'undefined' ? self : this, function () {
  // The five fields each person can fill in to enrich their profile.
  const ENRICHMENT_FIELDS = [
    'whatIDo', 'whatIDont', 'skills', 'currentlyWorkingOn', 'happyToHelp',
  ];

  const STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'to', 'of', 'in', 'on', 'for',
    'with', 'about', 'is', 'are', 'am', 'i', 'me', 'my', 'we', 'you', 'your',
    'need', 'needs', 'help', 'helping', 'who', 'what', 'which', 'how', 'can',
    'could', 'should', 'would', 'please', 'someone', 'anyone', 'people', 'person',
    'looking', 'find', 'want', 'wants', 'get', 'getting', 'new', 'some', 'any',
    'right', 'good', 'know', 'knows', 'do', 'does', 'be', 'at', 'by', 'from',
    'this', 'that', 'it', 'as', 'our', 'their',
  ]);

  // Query-side synonyms: when the user types the key, we also look for the values.
  const SYNONYMS = {
    budget: ['finance', 'financial', 'cost', 'forecasting'],
    budgeting: ['finance', 'financial', 'cost', 'forecasting'],
    finance: ['financial', 'budget', 'cost', 'accounting'],
    money: ['finance', 'budget', 'cost'],
    partnership: ['partner', 'deal', 'alliance', 'bizdev'],
    partnerships: ['partner', 'deal', 'alliance', 'bizdev'],
    partner: ['partnership', 'deal', 'alliance'],
    deal: ['partnership', 'partner', 'negotiation'],
    hiring: ['recruiting', 'recruit', 'onboarding', 'talent', 'people'],
    hire: ['recruiting', 'hiring', 'talent'],
    recruiting: ['hiring', 'talent', 'people'],
    research: ['usability', 'interviews', 'ethnography'],
    usability: ['research', 'interviews'],
    design: ['ux', 'ui', 'prototyping', 'figma'],
    frontend: ['react', 'ui', 'css', 'typescript'],
    backend: ['api', 'database', 'server', 'node'],
    devops: ['kubernetes', 'docker', 'infrastructure', 'deployment', 'pipelines', 'aws'],
    kubernetes: ['docker', 'infrastructure', 'deployment', 'devops'],
    infrastructure: ['devops', 'kubernetes', 'deployment', 'aws'],
    deploy: ['deployment', 'pipelines', 'release', 'ci'],
    deployment: ['deployments', 'pipelines', 'release', 'devops'],
    api: ['apis', 'integration', 'integrations', 'endpoints'],
    integration: ['integrations', 'api', 'apis'],
    pricing: ['price', 'cost', 'billing'],
    growth: ['acquisition', 'retention', 'funnel', 'experiments'],
    data: ['analytics', 'metrics', 'sql', 'pipelines'],
    analytics: ['data', 'metrics', 'experiments'],
    roadmap: ['roadmapping', 'prioritisation', 'strategy'],
    strategy: ['strategic', 'vision', 'roadmap'],
    security: ['auth', 'secure', 'infosec'],
    onboarding: ['onboard', 'hiring', 'people'],
    marketing: ['brand', 'campaign', 'seo'],
  };

  const FIELD_WEIGHTS = {
    skills: 3.0,
    happyToHelp: 2.5,
    currentlyWorkingOn: 2.0,
    whatIDo: 1.5,
    role: 1.0,
    area: 0.8,
  };

  const FIELD_PHRASES = {
    skills: (terms) => `has skills in ${terms}`,
    happyToHelp: (terms) => `is happy to help with ${terms}`,
    currentlyWorkingOn: (terms) => `is currently working on ${terms}`,
    whatIDo: (terms) => `works on ${terms}`,
    role: (terms, person) => `is our ${person.role}`,
    area: (terms, person) => `is in the ${person.area} team`,
  };

  function tokenize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .filter((t) => t.length > 1 && !STOPWORDS.has(t));
  }

  /** Profile completeness as a 0–100 percentage over the five enrichment fields. */
  function completeness(person) {
    const filled = ENRICHMENT_FIELDS.filter(
      (f) => person[f] && String(person[f]).trim().length > 0
    ).length;
    return Math.round((filled / ENRICHMENT_FIELDS.length) * 100);
  }

  function expandQuery(queryTokens) {
    const expanded = [];
    const seen = new Set();
    queryTokens.forEach((origin) => {
      const add = (term, isSynonym) => {
        if (!seen.has(term)) {
          seen.add(term);
          expanded.push({ term, origin, isSynonym });
        }
      };
      add(origin, false);
      (SYNONYMS[origin] || []).forEach((s) => add(s, true));
    });
    return expanded;
  }

  /** Prefix-aware token match (budget ~ budgeting, deploy ~ deployment). */
  function tokensMatch(a, b) {
    if (a === b) return true;
    if (a.length >= 4 && b.startsWith(a)) return true;
    if (b.length >= 4 && a.startsWith(b)) return true;
    return false;
  }

  function fieldMatchesAnyQueryTerm(fieldTokens, expanded) {
    return expanded.some((q) => fieldTokens.some((ft) => tokensMatch(q.term, ft)));
  }

  function joinTerms(terms) {
    const list = [...new Set(terms)];
    if (list.length <= 1) return list.join('');
    if (list.length === 2) return `${list[0]} and ${list[1]}`;
    return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
  }

  function search(people, query, selfUsername) {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];
    const expanded = expandQuery(queryTokens);

    const results = [];

    for (const person of people) {
      if (person.username === selfUsername) continue; // never suggest to self

      // Exclusion: if the query directly matches "What I don't do", skip entirely.
      // (Only direct words exclude — not synonyms — to avoid over-excluding.)
      const directTerms = expanded.filter((q) => !q.isSynonym);
      const dontTokens = tokenize(person.whatIDont);
      if (dontTokens.length && fieldMatchesAnyQueryTerm(dontTokens, directTerms)) {
        continue;
      }

      let score = 0;
      const matchedByField = {}; // field -> Set of the person's actual words that matched

      for (const field of Object.keys(FIELD_WEIGHTS)) {
        const fieldTokens = tokenize(person[field]);
        if (!fieldTokens.length) continue;
        const weight = FIELD_WEIGHTS[field];

        for (const q of expanded) {
          const synFactor = q.isSynonym ? 0.4 : 1.0;
          const matchedFt = fieldTokens.filter((ft) => tokensMatch(q.term, ft));
          if (matchedFt.length) {
            score += weight * matchedFt.length * synFactor;
            if (!matchedByField[field]) matchedByField[field] = new Set();
            matchedFt.forEach((ft) => matchedByField[field].add(ft));
          }
        }
      }

      if (score <= 0) continue;

      // Completeness multiplier: fuller profiles rank higher, but a sparse match
      // can still appear. (completeness may be precomputed or derived here.)
      const pct = typeof person.completeness === 'number' ? person.completeness : completeness(person);
      const factor = 0.6 + 0.4 * (pct / 100);
      const finalScore = score * factor;

      const reason = buildReason(person, matchedByField);
      results.push({ ...person, completeness: pct, score: Math.round(finalScore * 100) / 100, reason });
    }

    results.sort((a, b) => b.score - a.score);
    if (results.length > 0) {
      const floor = results[0].score * 0.12;
      return results.filter((r) => r.score >= floor);
    }
    return results;
  }

  function buildReason(person, matchedByField) {
    const fields = Object.keys(matchedByField).sort(
      (a, b) => FIELD_WEIGHTS[b] - FIELD_WEIGHTS[a]
    );
    const clauses = fields.slice(0, 2).map((field) => {
      const terms = joinTerms([...matchedByField[field]].slice(0, 3));
      return FIELD_PHRASES[field](terms, person);
    });
    if (clauses.length === 0) return 'Looks relevant to your request.';
    const sentence = `${person.firstName} ${clauses.join(', and ')}.`;
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }

  return { search, tokenize, completeness, ENRICHMENT_FIELDS };
});
