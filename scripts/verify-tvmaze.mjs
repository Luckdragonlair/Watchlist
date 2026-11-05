import { mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

// Read-only coverage check: no app database writes and no Silo queries.
const titles = ['Severance', 'The Institute', 'Ghosts', 'DAN DA DAN', 'Star Trek: Strange New Worlds'];
const base = 'https://api.tvmaze.com';
const requests = [];
const normalize = name => name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
async function get(path) {
  const url = base + path;
  for (let attempt = 0; attempt < 3; attempt++) {
    await delay(450);
    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    requests.push({ url, status: response.status, checkedAt: new Date().toISOString() });
    if (response.status === 429 && attempt < 2) {
      await delay(2_000 * (attempt + 1));
      continue;
    }
    if (!response.ok) throw new Error(`TVmaze returned HTTP ${response.status} for ${url}`);
    return response.json();
  }
}
const results = [];
for (const title of titles) {
  const result = { query: title, candidates: [] };
  results.push(result);
  try {
    const search = await get(`/search/shows?q=${encodeURIComponent(title)}`);
    result.candidates = search.map(({ show }) => ({
      id: show.id, name: show.name, premiered: show.premiered ?? null,
      service: show.webChannel?.name ?? show.network?.name ?? null, url: show.url,
      exactName: normalize(show.name) === normalize(title),
    }));
    const exact = result.candidates.filter(candidate => candidate.exactName);
    if (exact.length !== 1) {
      result.outcome = exact.length > 1 ? 'ambiguous-exact-name' : 'no-exact-name';
      result.note = 'No candidate selected. Manual identification is required.';
      continue;
    }
    const id = exact[0].id;
    const show = await get(`/shows/${id}`);
    const seasons = await get(`/shows/${id}/seasons`);
    const episodes = await get(`/shows/${id}/episodes`);
    const regular = episodes.filter(episode => episode.type === 'regular' && episode.number !== null);
    result.outcome = 'unique-exact-name-coverage-checked';
    result.coverage = {
      showId: id, name: show.name, status: show.status ?? null,
      premiered: show.premiered ?? null,
      service: show.webChannel?.name ?? show.network?.name ?? null,
      episodeEndpointIncludesSpecials: false,
      seasonCount: seasons.length, episodeCount: episodes.length, regularEpisodeCount: regular.length,
      episodesWithUnknownAirstamp: episodes.filter(e => !e.airstamp).length,
      episodesWithUnknownAirdate: episodes.filter(e => !e.airdate).length,
      episodesWithNoReleaseDateOrTime: episodes.filter(e => !e.airstamp && !e.airdate).length,
      seasonsWithUnknownEpisodeOrder: seasons.filter(s => s.episodeOrder == null).length,
      seasonsWithUnknownEndDate: seasons.filter(s => !s.endDate).length,
      seasons: seasons.map(s => ({
        id: s.id, number: s.number, expectedEpisodeCount: s.episodeOrder ?? null,
        endDate: s.endDate ?? null, listedRegularEpisodes: regular.filter(e => e.season === s.number).length,
      })),
    };
  } catch (error) {
    result.outcome = 'request-failed';
    result.error = error instanceof Error ? error.message : String(error);
    process.exitCode = 1;
  }
}
const report = {
  checkedAt: new Date().toISOString(), provider: 'TVmaze',
  scope: 'Public metadata coverage only. No release claims independently verified; no app library imported or changed.',
  matchingRule: 'Fetch details only when exactly one search candidate has an exact normalized name. Ambiguous candidates remain unselected.',
  results, requests,
};
mkdirSync(new URL('../Notes', import.meta.url), { recursive: true });
writeFileSync(new URL('../Notes/TVMAZE_LIVE_CHECK.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
for (const result of results) console.log(JSON.stringify({
  query: result.query, outcome: result.outcome, candidates: result.candidates.length,
  exactIds: result.candidates.filter(c => c.exactName).map(c => c.id),
  seasons: result.coverage?.seasonCount, episodes: result.coverage?.episodeCount,
  unknownAirstamps: result.coverage?.episodesWithUnknownAirstamp,
  unknownEpisodeOrders: result.coverage?.seasonsWithUnknownEpisodeOrder,
  error: result.error,
}));
