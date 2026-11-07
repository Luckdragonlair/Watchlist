import { describe, expect, it } from 'vitest';
import { libraryContentKey, mergeLibraries, SyncConflict, type SharedLibrary } from '../src/sync-merge';

const stamp = '2026-11-06T12:00:00Z';
const copy = <T>(value: T): T => structuredClone(value);
function fixture(): SharedLibrary {
  return { epoch: 'epoch-A', lifecycles: { '10': 'life-A', '11': 'life-B' }, backup: {
    version: 1, exportedAt: stamp,
    shows: [10, 11].map(id => ({ id, name: `Show ${id}`, summary: null, status: null, genres: [], service: null, url: `https://www.tvmaze.com/shows/${id}`, syncedAt: stamp })),
    seasons: [10, 11].map(showId => ({ id: showId + 10, showId, number: 1, episodeOrder: null, endDate: null })),
    episodes: [30, 31, 40].map(id => ({ id, showId: id === 40 ? 11 : 10, season: 1, number: id === 31 ? 2 : 1, name: `Episode ${id}`, summary: null, airstamp: null, airdate: null, type: 'regular' })),
    progress: [], preferences: [10, 11].map((showId, order) => ({ showId, order, notes: '' })),
    sources: [{ id: 'source-A', name: 'Working catalog', raw: 'Original source retained', importedAt: stamp, rows: [
      { id: 'row-A', title: 'Show 10', notes: '', state: 'imported', showId: 10 },
      { id: 'row-B', title: 'Show 11', notes: '', state: 'imported', showId: 11 },
    ] }],
  } };
}
function watched(library: SharedLibrary, episodeId: number, watchedAt = stamp) {
  library.backup.progress.push({ episodeId, showId: episodeId === 40 ? 11 : 10, watchedAt });
}
function removeShow(library: SharedLibrary, showId: number, token = 'deleted-life') {
  const b = library.backup;
  b.shows = b.shows.filter(r => r.id !== showId); b.seasons = b.seasons.filter(r => r.showId !== showId);
  b.episodes = b.episodes.filter(r => r.showId !== showId); b.progress = b.progress.filter(r => r.showId !== showId);
  b.preferences = b.preferences.filter(r => r.showId !== showId);
  b.sources = b.sources.map(s => { const rows = s.rows.filter(r => r.showId !== showId); return { ...s, rows, raw: JSON.stringify(rows, null, 2) }; });
  library.lifecycles[showId] = token;
}
function empty(epoch: string): SharedLibrary {
  return { epoch, lifecycles: {}, backup: { version: 1, exportedAt: stamp, shows: [], seasons: [], episodes: [], progress: [], preferences: [], sources: [] } };
}
describe('three-way shared library merge', () => {
  it('merges independently watched episodes, notes and ordering', () => {
    const base = fixture(), local = copy(base), remote = copy(base);
    watched(local, 30); watched(remote, 31);
    local.backup.preferences[0].notes = 'Local note'; remote.backup.preferences[0].order = 9;
    const merged = mergeLibraries(base, local, remote);
    expect(merged.backup.progress.map(p => p.episodeId)).toEqual([30, 31]);
    expect(merged.backup.preferences[0]).toEqual({ showId: 10, order: 9, notes: 'Local note' });
  });
  it('merges independent fields of a show', () => {
    const base = fixture(), local = copy(base), remote = copy(base);
    local.backup.shows[0].name = 'Corrected name'; remote.backup.shows[0].genres = ['Drama'];
    expect(mergeLibraries(base, local, remote).backup.shows[0]).toMatchObject({ name: 'Corrected name', genres: ['Drama'] });
  });
  it('reports conflicting edits to the same preference field', () => {
    const base = fixture(), local = copy(base), remote = copy(base);
    local.backup.preferences[0].notes = 'Local'; remote.backup.preferences[0].notes = 'Remote';
    expect(() => mergeLibraries(base, local, remote)).toThrow(/Preferences 10: notes/);
    remote.backup.preferences[0].notes = 'Local'; expect(mergeLibraries(base, local, remote).backup.preferences[0].notes).toBe('Local');
  });
  it('reports conflicting order edits independently of notes', () => {
    const base = fixture(), local = copy(base), remote = copy(base);
    local.backup.preferences[0].order = 3; remote.backup.preferences[0].order = 7;
    expect(() => mergeLibraries(base, local, remote)).toThrow(/ordering/);
  });
  it('does not silently mix disjoint concurrent reorders into a new global order', () => {
    const base = fixture(), local = copy(base), remote = copy(base);
    local.backup.preferences[0].order = 5; remote.backup.preferences[1].order = 5;
    expect(() => mergeLibraries(base, local, remote)).toThrow(/Binge ordering/);
    remote.backup.preferences[1].order = 1; remote.backup.preferences[0].order = 5;
    expect(mergeLibraries(base, local, remote).backup.preferences[0].order).toBe(5);
  });
  it('merges provider refresh timestamps while preserving independent metadata fields', () => {
    const base = fixture(), local = copy(base), remote = copy(base);
    local.backup.shows[0].syncedAt = '2026-11-06T12:01:00Z'; remote.backup.shows[0].syncedAt = '2026-11-06T12:02:00Z';
    local.backup.shows[0].name = 'New name'; remote.backup.shows[0].genres = ['Drama'];
    expect(mergeLibraries(base, local, remote).backup.shows[0]).toMatchObject({ name: 'New name', genres: ['Drama'], syncedAt: '2026-11-06T12:02:00Z' });
  });
  it('accepts same-episode watched changes with different watched times', () => {
    const base = fixture(), local = copy(base), remote = copy(base);
    watched(local, 30, '2026-11-06T12:01:00Z'); watched(remote, 30, '2026-11-06T12:02:00Z');
    expect(mergeLibraries(base, local, remote).backup.progress).toEqual([{ episodeId: 30, showId: 10, watchedAt: '2026-11-06T12:02:00Z' }]);
  });
  it('treats a missing watched record as explicit unwatched', () => {
    const base = fixture(); watched(base, 30);
    const local = copy(base), remote = copy(base); local.backup.progress = [];
    expect(mergeLibraries(base, local, remote).backup.progress).toEqual([]);
    remote.backup.progress[0].watchedAt = '2026-11-06T12:03:00Z';
    expect(() => mergeLibraries(base, local, remote)).toThrow(/deleted.*edited/);
  });
  it.each(['notes', 'progress', 'episodes'] as const)('conflicts when remote deletion meets an old-life %s edit', field => {
    const base = fixture(), local = copy(base), remote = copy(base);
    if (field === 'notes') local.backup.preferences[0].notes = 'Keep this note';
    if (field === 'progress') watched(local, 30);
    if (field === 'episodes') local.backup.episodes[0].name = 'Corrected episode';
    removeShow(remote, 10);
    expect(() => mergeLibraries(base, local, remote)).toThrow(/deleted or re-added/);
  });
  it('adopts an uncontested deletion and keeps its tombstone without resurrection', () => {
    const base = fixture(); watched(base, 30);
    const local = copy(base), remote = copy(base); removeShow(remote, 10);
    const merged = mergeLibraries(base, local, remote);
    expect(merged.backup.shows.map(s => s.id)).toEqual([11]); expect(merged.backup.progress).toEqual([]);
    expect(merged.lifecycles['10']).toBe('deleted-life'); expect(merged.backup.sources[0].rows.map(r => r.id)).toEqual(['row-B']);
    expect(libraryContentKey(mergeLibraries(base, local, merged))).toBe(libraryContentKey(merged));
  });
  it('adopts a delete/re-add lifecycle and its exact history when the old client is unchanged', () => {
    const base = fixture(); watched(base, 30);
    const remote = copy(base); remote.lifecycles['10'] = 'fresh-life'; remote.backup.progress = [];
    remote.backup.preferences[0].notes = 'Fresh notes';
    const merged = mergeLibraries(base, copy(base), remote);
    expect(merged.lifecycles['10']).toBe('fresh-life'); expect(merged.backup.progress).toEqual([]);
    expect(merged.backup.preferences[0].notes).toBe('Fresh notes');
    const stale = copy(base); watched(stale, 31);
    expect(() => mergeLibraries(base, stale, remote)).toThrow(SyncConflict);
  });
  it('adopts local lifecycle replacement symmetrically', () => {
    const base = fixture(), local = copy(base); local.lifecycles['10'] = 'fresh-local-life';
    expect(mergeLibraries(base, local, copy(base)).lifecycles['10']).toBe('fresh-local-life');
  });
  it('rejects competing new lifecycle tokens, even with matching visible records', () => {
    const base = fixture(), local = copy(base), remote = copy(base);
    local.lifecycles['10'] = 'local-life'; remote.lifecycles['10'] = 'remote-life';
    expect(() => mergeLibraries(base, local, remote)).toThrow(/deleted or re-added/);
  });
  it('accepts identical concurrent new lifecycles and rejects divergent new baselines', () => {
    const base = fixture(), local = copy(base); local.lifecycles['10'] = 'shared-new-life';
    const remote = copy(local); expect(mergeLibraries(base, local, remote).lifecycles['10']).toBe('shared-new-life');
    remote.backup.preferences[0].notes = 'No common new-life baseline';
    expect(() => mergeLibraries(base, local, remote)).toThrow(/new lifecycle/);
  });
  it('rejects lost tombstones and re-adds reusing a tombstone identity', () => {
    const base = fixture(); removeShow(base, 10);
    const local = copy(base); delete local.lifecycles['10'];
    expect(() => mergeLibraries(base, local, copy(base))).toThrow(/tombstone/);
    const reused = fixture(); reused.lifecycles['10'] = base.lifecycles['10'];
    expect(() => mergeLibraries(base, reused, copy(base))).toThrow(/fresh lifecycle/);
  });
  it('merges deletion of one show with edits to an independent show and source row', () => {
    const base = fixture(), local = copy(base), remote = copy(base); removeShow(local, 10);
    remote.backup.preferences[1].notes = 'Other show note'; remote.backup.sources[0].rows[1].notes = 'Other source note';
    const merged = mergeLibraries(base, local, remote);
    expect(merged.backup.shows.map(s => s.id)).toEqual([11]); expect(merged.backup.preferences[0].notes).toBe('Other show note');
    expect(merged.backup.sources[0].rows).toEqual([{ ...remote.backup.sources[0].rows[1] }]);
  });
  it('merges two independent deletions in the same retained source catalog', () => {
    const base = fixture(), local = copy(base), remote = copy(base); removeShow(local, 10); removeShow(remote, 11, 'other-deleted-life');
    const merged = mergeLibraries(base, local, remote); expect(merged.backup.shows).toEqual([]);
    expect(merged.backup.sources[0]).toMatchObject({ rows: [], raw: '[]' });
  });
  it('merges independent source-row changes by row identifier', () => {
    const base = fixture(), local = copy(base), remote = copy(base);
    local.backup.sources[0].rows[0].notes = 'First source note'; remote.backup.sources[0].rows[1].notes = 'Second source note';
    expect(mergeLibraries(base, local, remote).backup.sources[0].rows.map(r => r.notes)).toEqual(['First source note', 'Second source note']);
  });
  it.each(['local', 'remote'] as const)('accepts an uncontested %s restore, including an empty replacement', side => {
    const base = fixture(), replacement = empty('restored-epoch');
    const merged = side === 'local' ? mergeLibraries(base, replacement, copy(base)) : mergeLibraries(base, copy(base), replacement);
    expect(merged).toEqual(replacement); expect(merged.backup.shows).toEqual([]);
  });
  it('rejects old-epoch edits while another device restores', () => {
    const base = fixture(), local = copy(base); watched(local, 30);
    expect(() => mergeLibraries(base, local, empty('restored-epoch'))).toThrow(/older library/);
    expect(() => mergeLibraries(base, empty('restored-epoch'), local)).toThrow(/older library/);
  });
  it('accepts identical concurrent restores but rejects competing replacement identities', () => {
    const base = fixture(), restored = empty('restored-epoch'), identical = copy(restored); identical.backup.exportedAt = '2026-11-06T12:05:00Z';
    expect(mergeLibraries(base, restored, identical).epoch).toBe('restored-epoch');
    expect(() => mergeLibraries(base, restored, empty('another-restore'))).toThrow(/Both devices replaced/);
  });
  it('ignores export timestamps and record ordering in dirty checks and duplicate snapshots', () => {
    const base = fixture(), shuffled = copy(base); shuffled.backup.exportedAt = '2026-11-06T13:00:00Z';
    shuffled.backup.shows.reverse(); shuffled.backup.episodes.reverse(); shuffled.backup.sources[0].rows.reverse();
    shuffled.lifecycles = { '11': 'life-B', '10': 'life-A' };
    expect(libraryContentKey(base)).toBe(libraryContentKey(shuffled));
    expect(libraryContentKey(mergeLibraries(base, shuffled, shuffled))).toBe(libraryContentKey(base));
    shuffled.lifecycles['10'] = 'changed-life'; expect(libraryContentKey(base)).not.toBe(libraryContentKey(shuffled));
  });
  it('does not mutate or return shared references to any input', () => {
    const base = fixture(), local = copy(base), remote = copy(base), before = JSON.stringify([base, local, remote]);
    const merged = mergeLibraries(base, local, remote); merged.backup.shows[0].genres.push('Changed after merge'); merged.lifecycles['10'] = 'changed';
    expect(JSON.stringify([base, local, remote])).toBe(before);
  });
  it('rejects invalid or dangling input records with an actionable sync error', () => {
    const base = fixture(), invalid = copy(base); invalid.backup.episodes[0].showId = 999;
    expect(() => mergeLibraries(base, invalid, copy(base))).toThrow(/missing show 999/);
    const missing = copy(base); delete missing.lifecycles['10']; expect(() => libraryContentKey(missing)).toThrow(/lifecycle/);
  });
  it('retains retracted owned and ownerless legacy history when no lifecycle is replaced', () => {
    const base = fixture(); base.backup.progress.push({ episodeId: 999, showId: 10, watchedAt: stamp }, { episodeId: 1000, watchedAt: stamp });
    const merged = mergeLibraries(base, copy(base), copy(base)); expect(merged.backup.progress).toEqual(base.backup.progress);
  });
  it('never carries ownerless old history into a re-add whose episode metadata identifies its owner', () => {
    const base = fixture(); base.backup.progress.push({ episodeId: 999, watchedAt: stamp });
    const local = copy(base), remote = copy(base); remote.lifecycles['10'] = 'fresh-life'; remote.backup.progress = [];
    remote.backup.episodes.push({ ...remote.backup.episodes[0], id: 999, number: 3 });
    expect(mergeLibraries(base, local, remote).backup.progress).toEqual([]);
    local.backup.progress[0].watchedAt = '2026-11-06T12:05:00Z';
    expect(() => mergeLibraries(base, local, remote)).toThrow(SyncConflict);
  });
});
