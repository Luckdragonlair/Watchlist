import type { Backup, ImportRow } from './model';

const MAX_BACKUP_BYTES = 50_000_000;
type RecordValue = Record<string, unknown>;
function fail(location: string, reason: string): never {
  throw new Error(`Backup ${location}: ${reason}. Choose a complete, unmodified Watchlist backup.`);
}
function object(value: unknown, location: string): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(location, 'must be an object');
  return value as RecordValue;
}
function array(value: unknown, location: string): unknown[] {
  if (!Array.isArray(value)) fail(location, 'is missing or is not a list');
  return value;
}
function text(value: unknown, location: string): string {
  if (typeof value !== 'string') fail(location, 'must be text');
  return value;
}
function identity(value: unknown, location: string): string {
  const result = text(value, location);
  if (!result.trim()) fail(location, 'needs a nonempty identifier');
  return result;
}
function number(value: unknown, location: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(location, 'must be a finite number');
  return value;
}
function integer(value: unknown, location: string, minimum = 0): number {
  const result = number(value, location);
  if (!Number.isSafeInteger(result) || result < minimum) fail(location, `must be a whole number of at least ${minimum}`);
  return result;
}
const id = (value: unknown, location: string) => integer(value, location, 1);
function nullable<T>(value: unknown, location: string, parse: (value: unknown, location: string) => T): T | null {
  return value === null ? null : parse(value, location);
}
function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function date(value: unknown, location: string): string {
  const result = text(value, location);
  if (!validDate(result)) fail(location, 'needs a valid date in YYYY-MM-DD format');
  return result;
}
function timestamp(value: unknown, location: string): string {
  const result = text(value, location);
  const parts = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/i.exec(result);
  if (!parts || !validDate(parts[1]) || Number(parts[2]) > 23 || Number(parts[3]) > 59 || Number(parts[4] ?? 0) > 59 || !Number.isFinite(Date.parse(result))) {
    fail(location, 'needs a valid date and time with a time zone');
  }
  return result;
}
function unique<T>(values: T[], key: (value: T) => string | number, location: string): void {
  const seen = new Set<string | number>();
  for (const value of values) {
    const identifier = key(value);
    if (seen.has(identifier)) fail(location, `contains duplicate identifier ${identifier}`);
    seen.add(identifier);
  }
}
function row(value: unknown, location: string): ImportRow {
  const r = object(value, location);
  if (!['pending', 'excluded', 'review', 'imported'].includes(String(r.state)) || typeof r.state !== 'string') fail(`${location} state`, 'is not recognized');
  const result: ImportRow = {
    id: identity(r.id, `${location} identifier`), title: text(r.title, `${location} title`),
    notes: text(r.notes, `${location} notes`), state: r.state as ImportRow['state'],
  };
  if (r.showId !== undefined) result.showId = id(r.showId, `${location} show identifier`);
  if (r.season !== undefined) result.season = integer(r.season, `${location} season`);
  if (r.sourceCategory !== undefined) {
    if (!['Weekly', 'Binge', 'Watched'].includes(String(r.sourceCategory)) || typeof r.sourceCategory !== 'string') fail(`${location} category`, 'is not recognized');
    result.sourceCategory = r.sourceCategory as ImportRow['sourceCategory'];
  }
  for (const field of ['sourceWeekday', 'sourceStatus', 'rawTitle'] as const) {
    if (r[field] !== undefined) result[field] = text(r[field], `${location} ${field}`);
  }
  return result;
}

export function parseBackup(raw: string): Backup {
  if (typeof raw !== 'string') fail('file', 'must contain text');
  if (raw.length > MAX_BACKUP_BYTES || new TextEncoder().encode(raw).byteLength > MAX_BACKUP_BYTES) fail('file', 'is larger than the 50 MB limit');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { fail('file', 'could not be read as JSON'); }
  return validateBackup(value);
}

export function validateBackup(value: unknown): Backup {
  const b = object(value, 'file');
  if (b.version !== 1) fail('version', 'is missing or unsupported; this app accepts version 1');
  const exportedAt = timestamp(b.exportedAt, 'export date');
  const shows = array(b.shows, 'shows').map((value, index) => {
    const loc = `show ${index + 1}`, s = object(value, loc);
    return {
      id: id(s.id, `${loc} identifier`), name: text(s.name, `${loc} name`),
      summary: nullable(s.summary, `${loc} summary`, text), status: nullable(s.status, `${loc} status`, text),
      genres: array(s.genres, `${loc} genres`).map((genre, i) => text(genre, `${loc} genre ${i + 1}`)),
      service: nullable(s.service, `${loc} service`, text), url: text(s.url, `${loc} link`), syncedAt: timestamp(s.syncedAt, `${loc} refresh date`),
    };
  });
  const seasons = array(b.seasons, 'seasons').map((value, index) => {
    const loc = `season ${index + 1}`, s = object(value, loc);
    return {
      id: id(s.id, `${loc} identifier`), showId: id(s.showId, `${loc} show identifier`), number: integer(s.number, `${loc} number`),
      episodeOrder: nullable(s.episodeOrder, `${loc} expected episode count`, integer), endDate: nullable(s.endDate, `${loc} ending date`, date),
    };
  });
  const episodes = array(b.episodes, 'episodes').map((value, index) => {
    const loc = `episode ${index + 1}`, e = object(value, loc);
    return {
      id: id(e.id, `${loc} identifier`), showId: id(e.showId, `${loc} show identifier`), season: integer(e.season, `${loc} season`),
      number: nullable(e.number, `${loc} number`, (value, location) => integer(value, location, 1)),
      name: text(e.name, `${loc} name`), summary: nullable(e.summary, `${loc} summary`, text),
      airstamp: nullable(e.airstamp, `${loc} release time`, timestamp), airdate: nullable(e.airdate === '' ? null : e.airdate, `${loc} release date`, date), type: text(e.type, `${loc} type`),
    };
  });
  const progress = array(b.progress, 'watched history').map((value, index) => {
    const loc = `watched episode ${index + 1}`, p = object(value, loc);
    return { episodeId: id(p.episodeId, `${loc} identifier`), watchedAt: timestamp(p.watchedAt, `${loc} watched date`), ...(p.showId === undefined ? {} : { showId: id(p.showId, `${loc} show identifier`) }) };
  });
  const preferences = array(b.preferences, 'preferences').map((value, index) => {
    const loc = `preference ${index + 1}`, p = object(value, loc);
    return { showId: id(p.showId, `${loc} show identifier`), order: number(p.order, `${loc} order`), notes: text(p.notes, `${loc} notes`) };
  });
  const sources = array(b.sources, 'import sources').map((value, index) => {
    const loc = `import source ${index + 1}`, s = object(value, loc);
    const rows = array(s.rows, `${loc} rows`).map((value, i) => row(value, `${loc} row ${i + 1}`));
    unique(rows, r => r.id, `${loc} rows`);
    return { id: identity(s.id, `${loc} identifier`), name: text(s.name, `${loc} name`), raw: text(s.raw, `${loc} original text`), importedAt: timestamp(s.importedAt, `${loc} import date`), rows };
  });
  unique(shows, s => s.id, 'shows'); unique(seasons, s => s.id, 'seasons'); unique(episodes, e => e.id, 'episodes');
  unique(progress, p => p.episodeId, 'watched history'); unique(preferences, p => p.showId, 'preferences'); unique(sources, s => s.id, 'import sources');
  const showIds = new Set(shows.map(s => s.id));
  function knownShow(showId: number, location: string) {
    if (!showIds.has(showId)) fail(location, `refers to missing show ${showId}`);
  }
  for (const s of seasons) knownShow(s.showId, `season ${s.id}`);
  for (const e of episodes) knownShow(e.showId, `episode ${e.id}`);
  for (const p of preferences) knownShow(p.showId, 'preferences');
  const episodeOwners = new Map(episodes.map(e => [e.id, e.showId]));
  for (const p of progress) {
    const owner = episodeOwners.get(p.episodeId);
    if (p.showId !== undefined) {
      knownShow(p.showId, `watched episode ${p.episodeId}`);
      if (owner !== undefined && p.showId !== owner) fail(`watched episode ${p.episodeId}`, 'belongs to a different show than its episode record');
    } else if (owner !== undefined) p.showId = owner;
    // Old exports can contain history for retracted episodes without a known owner.
    // Preserve that history unchanged; a title or position cannot establish identity.
  }
  for (const source of sources) for (const r of source.rows) {
    if (r.state === 'imported' && r.showId === undefined) fail(`import source ${source.name}, row ${r.id}`, 'is marked imported but has no linked show');
    if (r.showId !== undefined) knownShow(r.showId, `import source ${source.name}, row ${r.id}`);
  }
  return { version: 1, exportedAt, shows, seasons, episodes, progress, preferences, sources };
}
