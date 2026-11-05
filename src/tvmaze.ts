import type { Bundle, Show, Episode, Season } from './model';
export interface Candidate { id: number; name: string; premiered: string | null; status: string | null; language: string | null; url: string; network: {name: string} | null; webChannel: {name: string} | null; summary: string | null; genres: string[] }
const API = 'https://api.tvmaze.com';
async function get<T>(path: string): Promise<T> {
  const response = await fetch(API + path, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(response.status === 429 ? 'TVmaze is busy. Please retry in a moment.' : `TVmaze request failed (${response.status}). Your saved progress is unchanged.`);
  return response.json() as Promise<T>;
}
export const searchShows = async (query: string) => (await get<{show: Candidate}[]>(`/search/shows?q=${encodeURIComponent(query)}`)).map(x => x.show);
export async function fetchEpisodeOwner(episodeId:number):Promise<number> {
  const episode=await get<{_links:{show:{href:string}}}>(`/episodes/${episodeId}`);
  const link=new URL(episode._links.show.href);
  const match=link.pathname.match(/^\/shows\/(\d+)$/);
  if (link.origin!==API || !match) throw new Error('TVmaze did not identify this episode’s show.');
  return Number(match[1]);
}
export async function fetchBundle(id: number): Promise<Bundle> {
  const show = await get<Candidate>(`/shows/${id}`);
  const seasons = await get<Omit<Season, 'showId'>[]>(`/shows/${id}/seasons`);
  const episodes = await get<Omit<Episode, 'showId'>[]>(`/shows/${id}/episodes`);
  const metadata: Show = { id: show.id, name: show.name, summary: show.summary, status: show.status, genres: show.genres, service: show.webChannel?.name ?? show.network?.name ?? null, url: show.url, syncedAt: new Date().toISOString() };
  return { show: metadata, seasons: seasons.map(s => ({ id: s.id, showId: id, number: s.number, episodeOrder: s.episodeOrder, endDate: s.endDate })), episodes: episodes.map(e => ({ id: e.id, showId: id, season: e.season, number: e.number, name: e.name, summary: e.summary, airstamp: e.airstamp, airdate: e.airdate, type: e.type })) };
}
// Provider HTML is rendered as text, never injected into the page.
export const plainText = (html: string | null) => html ? html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"') : 'Unknown';
