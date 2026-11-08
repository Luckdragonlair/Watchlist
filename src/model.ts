export interface Show { id: number; name: string; summary: string | null; status: string | null; genres: string[]; service: string | null; url: string; syncedAt: string }
export interface Season { id: number; showId: number; number: number; episodeOrder: number | null; endDate: string | null }
export interface Episode { id: number; showId: number; season: number; number: number | null; name: string; summary: string | null; airstamp: string | null; airdate: string | null; type: string }
export interface Progress { episodeId: number; watchedAt: string; showId?: number }
export type BingeSection='watching-now'|'watch-soon'|'everything-else'|'not-for-me';
export interface Preference { showId: number; order: number; notes: string; bingeSection?:BingeSection; bingeManualOrder?:boolean }
export interface ImportRow { id: string; title: string; notes: string; state: 'pending' | 'excluded' | 'review' | 'imported'; showId?: number; sourceCategory?: 'Weekly' | 'Binge' | 'Watched'; sourceWeekday?: string; sourceStatus?: string; season?: number; rawTitle?: string }
export interface Source { id: string; name: string; raw: string; importedAt: string; rows: ImportRow[] }
export interface Bundle { show: Show; seasons: Season[]; episodes: Episode[] }
export interface Backup { version: 1|2|3; exportedAt: string; shows: Show[]; seasons: Season[]; episodes: Episode[]; progress: Progress[]; preferences: Preference[]; sources: Source[] }
export const chicagoDate = (now: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
export const airTime = (stamp: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(stamp));
export const episodeLabel = (e: Episode) => `S${e.season} E${e.number ?? '?'} · ${e.name}`;
export const regular = (e: Episode) => e.type === 'regular' && e.number !== null;
// A date alone does not establish that an episode has aired today. Wait until the next day.
export function released(e: Episode, now: Date): boolean {
  if (e.airstamp && Number.isFinite(Date.parse(e.airstamp))) return Date.parse(e.airstamp) <= now.getTime();
  return !!e.airdate && e.airdate < chicagoDate(now);
}
export const episodeSort = (a: Episode, b: Episode) => a.season - b.season || (a.number ?? Infinity) - (b.number ?? Infinity) || a.id - b.id;
export function queue(episodes: Episode[], progress: Progress[], now: Date) {
  const watched = new Set(progress.map(p => p.episodeId));
  const unwatched = episodes.filter(e => regular(e) && !watched.has(e.id)).sort(episodeSort);
  const available = unwatched.filter(e => released(e, now));
  const upcoming = episodes.filter(e => regular(e) && e.airstamp && Date.parse(e.airstamp) > now.getTime()).sort((a,b) => Date.parse(a.airstamp!) - Date.parse(b.airstamp!));
  return { next: available[0], available, upcoming, unknown: unwatched.filter(e => !released(e, now) && !e.airstamp) };
}
export function confirmedComplete(season: Season, episodes: Episode[], progress: Progress[], now: Date) {
  const list = episodes.filter(e => e.season === season.number && regular(e));
  const watched = new Set(progress.map(p => p.episodeId));
  return !!season.endDate && season.endDate <= chicagoDate(now) && !!season.episodeOrder && list.length === season.episodeOrder && list.every(e => released(e, now) && watched.has(e.id));
}
export function weeklyRelease(episodes: Episode[], progress: Progress[], now: Date): Episode | undefined {
  const q = queue(episodes, progress, now);
  // Release placement is independent of the oldest unwatched episode.
  // A season must have started: an announced premiere alone stays in Binge.
  return q.upcoming.find(e => episodes.some(prior => regular(prior) && prior.season === e.season && released(prior, now)));
}
export function bucket(episodes: Episode[], seasons: Season[], progress: Progress[], now: Date): 'Weekly' | 'Binge' | 'Watched' {
  const q = queue(episodes, progress, now);
  if (weeklyRelease(episodes, progress, now)) return 'Weekly';
  if (episodes.some(regular) && !q.next && !q.unknown.length && seasons.length > 0 && seasons.every(s => confirmedComplete(s, episodes, progress, now))) return 'Watched';
  return 'Binge';
}
