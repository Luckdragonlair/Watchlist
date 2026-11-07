import type { Backup, Progress, Source } from './model';
import { validateBackup } from './backup-validation';

export interface SharedLibrary { backup: Backup; epoch: string; lifecycles: Record<string, string> }
export class SyncConflict extends Error {
  constructor(reason: string) { super(reason); this.name = 'SyncConflict'; }
}
type Row = { [key: string]: unknown };
type Branch = 'local' | 'remote';
const clone = <T>(value: T): T => structuredClone(value);
function stable(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stable((value as Row)[k])).join(',') + '}';
  return JSON.stringify(value) ?? 'undefined';
}
const equal = (a: unknown, b: unknown) => stable(a) === stable(b);
const compare = (a: string | number, b: string | number) => a < b ? -1 : a > b ? 1 : 0;
function sorted<T>(rows: T[], key: (row: T) => string | number): T[] { return [...rows].sort((a, b) => compare(key(a), key(b))); }
function normalized(library: SharedLibrary): SharedLibrary {
  try {
    if (!library || typeof library.epoch !== 'string' || !library.epoch.trim()) throw new Error('A library epoch is required.');
    if (!library.lifecycles || typeof library.lifecycles !== 'object' || Array.isArray(library.lifecycles)) throw new Error('Show lifecycle identifiers are required.');
    const backup = validateBackup(library.backup), lifecycles: Record<string, string> = {};
    for (const [key, token] of Object.entries(library.lifecycles)) {
      if (!/^[1-9]\d*$/.test(key) || !Number.isSafeInteger(Number(key)) || typeof token !== 'string' || !token.trim()) throw new Error('A show lifecycle identifier is invalid.');
      lifecycles[key] = token;
    }
    for (const show of backup.shows) if (!lifecycles[String(show.id)]) throw new Error(`Show ${show.id} is missing its lifecycle identifier.`);
    return { backup, epoch: library.epoch, lifecycles };
  } catch (error) { throw new SyncConflict(`Cannot synchronize this library: ${error instanceof Error ? error.message : String(error)}`); }
}
function content(library: SharedLibrary) {
  const { exportedAt: _ignored, ...backup } = library.backup;
  return { epoch: library.epoch, lifecycles: library.lifecycles, backup: {
    ...backup, shows: sorted(backup.shows, r => r.id), seasons: sorted(backup.seasons, r => r.id),
    episodes: sorted(backup.episodes, r => r.id), progress: sorted(backup.progress, r => r.episodeId),
    preferences: sorted(backup.preferences, r => r.showId),
    sources: sorted(backup.sources, r => r.id).map(s => ({ ...s, rows: sorted(s.rows, r => r.id) })),
  } };
}
/** Stable dirty-check key; array order and export time are not user edits. */
export function libraryContentKey(library: SharedLibrary): string { return stable(content(normalized(library))); }
function mergeField(base: unknown, local: unknown, remote: unknown, where: string): unknown {
  if (equal(local, remote)) return clone(local);
  if (equal(local, base)) return clone(remote);
  if (equal(remote, base)) return clone(local);
  throw new SyncConflict(`${where} was changed differently on both devices. Choose which change to keep.`);
}
function mergeRecord<T extends object>(base: T | undefined, local: T | undefined, remote: T | undefined, where: string,
  special?: (key: string, b: Row, l: Row, r: Row) => { value: unknown } | undefined): T | undefined {
  if (equal(local, remote) || equal(local, base) || equal(remote, base)) return mergeField(base, local, remote, where) as T | undefined;
  if (!local || !remote) throw new SyncConflict(`${where} was deleted on one device and edited on the other.`);
  const b = (base ?? {}) as Row, l = local as Row, r = remote as Row, result: Row = {};
  for (const key of new Set([...Object.keys(b), ...Object.keys(l), ...Object.keys(r)])) {
    const selected = special?.(key, b, l, r);
    const value = selected ? selected.value : mergeField(b[key], l[key], r[key], `${where}: ${key}`);
    if (value !== undefined) result[key] = value;
  }
  return result as T;
}
function showContent(library: SharedLibrary, id: number, progressOwner: (p: Progress) => number | undefined) {
  const b = library.backup;
  return {
    show: b.shows.find(r => r.id === id), seasons: sorted(b.seasons.filter(r => r.showId === id), r => r.id),
    episodes: sorted(b.episodes.filter(r => r.showId === id), r => r.id), progress: sorted(b.progress.filter(r => progressOwner(r) === id), r => r.episodeId),
    preference: b.preferences.find(r => r.showId === id),
    sourceRows: sorted(b.sources, r => r.id).flatMap(s => sorted(s.rows.filter(r => r.showId === id), r => r.id).map(r => ({ source: s.id, row: r }))),
  };
}

/** Conservative 3-way merge. Callers must compare-and-swap the base snapshot when
 * saving; this pure function neither authenticates users nor commits cloud data.
 */
export function mergeLibraries(baseValue: SharedLibrary, localValue: SharedLibrary, remoteValue: SharedLibrary): SharedLibrary {
  const base = normalized(baseValue), local = normalized(localValue), remote = normalized(remoteValue);
  const localRestore = local.epoch !== base.epoch, remoteRestore = remote.epoch !== base.epoch;
  if (localRestore || remoteRestore) {
    if (localRestore && remoteRestore) {
      if (equal(content(local), content(remote))) return clone(local);
      throw new SyncConflict('Both devices replaced the library. Choose one restored library before synchronizing.');
    }
    const replacement = localRestore ? local : remote, other = localRestore ? remote : local;
    if (!equal(content(base), content(other))) throw new SyncConflict('A restored library conflicts with changes made to the older library on another device.');
    return clone(replacement);
  }
  const episodeOwners = new Map<number, Set<number>>();
  for (const library of [base, local, remote]) for (const e of library.backup.episodes) {
    const owners = episodeOwners.get(e.id) ?? new Set(); owners.add(e.showId); episodeOwners.set(e.id, owners);
  }
  const progressOwner = (p: Progress): number | undefined => p.showId ?? (episodeOwners.get(p.episodeId)?.size === 1 ? [...episodeOwners.get(p.episodeId)!][0] : undefined);
  const selections = new Map<number, Branch>(), lifecycles: Record<string, string> = {};
  const ids = new Set([...Object.keys(base.lifecycles), ...Object.keys(local.lifecycles), ...Object.keys(remote.lifecycles)]);
  for (const key of ids) {
    const id = Number(key), b = base.lifecycles[key], l = local.lifecycles[key], r = remote.lifecycles[key];
    if (b && (!l || !r)) throw new SyncConflict(`Show ${id} lost its lifecycle tombstone. Reload before synchronizing.`);
    const bc = showContent(base, id, progressOwner), lc = showContent(local, id, progressOwner), rc = showContent(remote, id, progressOwner);
    if (b && !bc.show && ((lc.show && l === b) || (rc.show && r === b))) throw new SyncConflict(`Show ${id} was re-added without a fresh lifecycle identifier.`);
    if (l !== r) {
      if (l === b && equal(lc, bc)) { selections.set(id, 'remote'); lifecycles[key] = r; }
      else if (r === b && equal(rc, bc)) { selections.set(id, 'local'); lifecycles[key] = l; }
      else throw new SyncConflict(`Show ${id} was deleted or re-added while its older copy was edited on another device.`);
    } else {
      lifecycles[key] = l;
      if (l !== b) {
        if (!equal(lc, rc)) throw new SyncConflict(`Show ${id} has a new lifecycle without a shared baseline. Reload before merging its changes.`);
        selections.set(id, 'local');
      } else if (!!lc.show !== !!rc.show) {
        const other = lc.show ? lc : rc;
        if (!equal(other, bc)) throw new SyncConflict(`Show ${id} was deleted on one device while its episodes, notes, or history changed on the other.`);
        selections.set(id, lc.show ? 'remote' : 'local');
      }
    }
  }
  // Ordering is one logical list even though ranks are stored per show. Avoid
  // silently combining different concurrent reorders into duplicate positions.
  const baseOrders = new Map(base.backup.preferences.map(p => [p.showId, p.order]));
  const changedOrders = (library: SharedLibrary) => sorted(library.backup.preferences.filter(p => baseOrders.has(p.showId)
    && p.order !== baseOrders.get(p.showId) && library.lifecycles[p.showId] === base.lifecycles[p.showId]), p => p.showId).map(p => [p.showId, p.order]);
  const localOrder = changedOrders(local), remoteOrder = changedOrders(remote);
  if (localOrder.length && remoteOrder.length && !equal(localOrder, remoteOrder)) throw new SyncConflict('Binge ordering changed differently on both devices. Choose one ordering before synchronizing.');
  function table<T extends object>(b: T[], l: T[], r: T[], key: (row: T) => string | number, where: string,
    owner?: (row: T) => number | undefined, custom?: (b: T | undefined, l: T | undefined, r: T | undefined, where: string) => T | undefined): T[] {
    const bm = new Map(b.map(row => [key(row), row])), lm = new Map(l.map(row => [key(row), row])), rm = new Map(r.map(row => [key(row), row]));
    const result: T[] = [];
    for (const id of [...new Set([...bm.keys(), ...lm.keys(), ...rm.keys()])].sort(compare)) {
      const bv = bm.get(id), lv = lm.get(id), rv = rm.get(id);
      const owners = new Set([bv, lv, rv].flatMap(row => row && owner && owner(row) !== undefined ? [owner(row)!] : []));
      const selected = [...owners].flatMap(showId => selections.has(showId) ? [selections.get(showId)!] : []);
      if (selected.length && owners.size > 1) throw new SyncConflict(`${where} ${id} changed show ownership across a deletion or re-add.`);
      const value = selected.length ? clone(selected[0] === 'local' ? lv : rv) : custom ? custom(bv, lv, rv, `${where} ${id}`) : mergeRecord(bv, lv, rv, `${where} ${id}`);
      if (value !== undefined) result.push(value);
    }
    return result;
  }
  const generatedRaw = (source: Source) => { try { return equal(JSON.parse(source.raw), source.rows); } catch { return false; } };
  function source(b: Source | undefined, l: Source | undefined, r: Source | undefined, where: string): Source | undefined {
    // Row IDs are scoped to their source. This lets independent title matches and
    // deletions merge without replaying rows from an older show incarnation.
    const rows = table(b?.rows ?? [], l?.rows ?? [], r?.rows ?? [], row => row.id, `${where} row`, row => row.showId);
    const merged = mergeRecord(b, l, r, where, (key) => {
      if (key === 'rows') return { value: rows };
      if (key === 'raw' && l && r && !equal(l.raw, r.raw) && generatedRaw(l) && generatedRaw(r)) return { value: JSON.stringify(rows, null, 2) };
      return undefined;
    });
    if (!merged) {
      if (rows.length) throw new SyncConflict(`${where} was deleted while its rows changed on another device.`);
      return undefined;
    }
    const derivedRaw = (l && merged.raw === l.raw && generatedRaw(l)) || (r && merged.raw === r.raw && generatedRaw(r));
    return { ...merged, rows, ...(derivedRaw ? { raw: JSON.stringify(rows, null, 2) } : {}) };
  }
  const b = base.backup, l = local.backup, r = remote.backup;
  const progress = table(b.progress, l.progress, r.progress, p => p.episodeId, 'Watched episode', progressOwner,
    (bp, lp, rp, where) => mergeRecord(bp, lp, rp, where, (key) => key === 'watchedAt' && lp && rp ? { value: [lp.watchedAt, rp.watchedAt].sort().at(-1) } : undefined));
  try {
    const backup = validateBackup({ version: 1, exportedAt: [l.exportedAt, r.exportedAt].sort().at(-1),
      shows: table(b.shows, l.shows, r.shows, row => row.id, 'Show', row => row.id,
        (bs, ls, rs, where) => mergeRecord(bs, ls, rs, where, key => key === 'syncedAt' && ls && rs ? { value: [ls.syncedAt, rs.syncedAt].sort().at(-1) } : undefined)),
      seasons: table(b.seasons, l.seasons, r.seasons, row => row.id, 'Season', row => row.showId),
      episodes: table(b.episodes, l.episodes, r.episodes, row => row.id, 'Episode', row => row.showId), progress,
      preferences: table(b.preferences, l.preferences, r.preferences, row => row.showId, 'Preferences', row => row.showId),
      sources: table(b.sources, l.sources, r.sources, row => row.id, 'Source', undefined, source),
    });
    return { backup, epoch: base.epoch, lifecycles };
  } catch (error) {
    if (error instanceof SyncConflict) throw error;
    throw new SyncConflict(`The merged library has inconsistent references: ${error instanceof Error ? error.message : String(error)}`);
  }
}
