import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseBackup, validateBackup } from '../src/backup-validation';
import type { Backup } from '../src/model';

const stamp = '2026-11-05T12:00:00.000Z';
function fixture(): Backup {
  return {
    version: 1, exportedAt: stamp,
    shows: [{ id: 10, name: 'Fixture', summary: null, status: null, genres: ['Drama'], service: null, url: 'https://www.tvmaze.com/shows/10', syncedAt: stamp }],
    seasons: [{ id: 20, showId: 10, number: 1, episodeOrder: 1, endDate: '2025-01-01' }],
    episodes: [{ id: 30, showId: 10, season: 1, number: 1, name: 'Pilot', summary: null, airstamp: '2025-01-01T12:00:00+00:00', airdate: '2025-01-01', type: 'regular' }],
    progress: [{ episodeId: 30, showId: 10, watchedAt: stamp }],
    preferences: [{ showId: 10, order: 0, notes: 'My notes' }],
    sources: [{ id: 'source', name: 'Working list', raw: 'Fixture', importedAt: stamp, rows: [{ id: '0', title: 'Fixture', notes: '', state: 'imported', showId: 10 }] }],
  };
}
describe('backup validation', () => {
  it('roundtrips all current model fields and the real master working catalog', () => {
    const b = fixture();
    b.sources.push(JSON.parse(readFileSync(new URL('../public/master-working.json', import.meta.url), 'utf8')));
    b.sources[0].rows[0] = { ...b.sources[0].rows[0], sourceCategory: 'Watched', sourceWeekday: 'Wednesday', sourceStatus: 'Unknown / TBA', season: 1, rawTitle: 'Fixture S1' };
    expect(parseBackup(JSON.stringify(b))).toEqual(b);
  });
  it('accepts an empty library and mandatory empty arrays', () => {
    expect(validateBackup({ version: 1, exportedAt: stamp, shows: [], seasons: [], episodes: [], progress: [], preferences: [], sources: [] }).shows).toEqual([]);
  });
  it('retains null metadata, season zero, zero expected count, and unnumbered special episodes', () => {
    const b = fixture();
    b.seasons[0] = { ...b.seasons[0], number: 0, episodeOrder: 0, endDate: null };
    b.episodes[0] = { ...b.episodes[0], season: 0, number: null, airstamp: null, airdate: null, type: 'significant_special' };
    expect(validateBackup(b)).toEqual(b);
  });
  it('keeps personal notes and source text as plain text', () => {
    const b = fixture();
    b.preferences[0].notes = '<img src=x onerror=alert(1)>';
    b.sources[0].raw = '<script>arbitrary original text</script>';
    expect(validateBackup(b)).toEqual(b);
  });
  it('copies only model fields without modifying its input', () => {
    const b = fixture() as Backup & { extra?: unknown };
    b.extra = { unsafe: true };
    Object.assign(b.shows[0], { extra: 1 }); Object.assign(b.sources[0].rows[0], { extra: 2 });
    const restored = validateBackup(b);
    expect(restored).not.toHaveProperty('extra'); expect(restored.shows[0]).not.toHaveProperty('extra'); expect(restored.sources[0].rows[0]).not.toHaveProperty('extra');
    expect(restored.shows[0]).not.toBe(b.shows[0]); expect(b.extra).toEqual({ unsafe: true });
  });
  it.each([undefined, null, 0, 3, '1', false])('rejects missing or unknown version %s', version => {
    expect(() => validateBackup({ ...fixture(), version })).toThrow(/version.*version 1/);
  });
  it.each(['shows', 'seasons', 'episodes', 'progress', 'preferences', 'sources'])('requires the %s list', field => {
    const b = fixture() as unknown as Record<string, unknown>;
    delete b[field]; expect(() => validateBackup(b)).toThrow(/missing.*list/);
    b[field] = {}; expect(() => validateBackup(b)).toThrow(/list/);
  });
  it.each([null, [], 17, 'text'])('rejects a non-object backup %s', value => expect(() => validateBackup(value)).toThrow(/object/));
  it('reports malformed JSON and the file size limit', () => {
    expect(() => parseBackup('{broken')).toThrow(/could not be read as JSON/);
    expect(() => parseBackup('x'.repeat(50_000_001))).toThrow(/50 MB/);
  });
  it.each(['2026-02-30T12:00:00Z', '2026-11-05', '2026-11-05T12:00:00', '2026-11-05T24:30:00Z', '2026-11-05T12:60:00Z', 'not a time'])('rejects invalid or zoneless timestamps %s', value => {
    expect(() => validateBackup({ ...fixture(), exportedAt: value })).toThrow(/date and time/);
  });
  it('accepts leap days and explicit UTC offsets without changing them', () => {
    const b = fixture(); b.exportedAt = '2024-02-29T23:59:59.123+05:30';
    b.episodes[0].airdate = '2024-02-29'; expect(validateBackup(b)).toEqual(b);
    b.episodes[0].airdate = '2025-02-29'; expect(() => validateBackup(b)).toThrow(/valid date/);
  });
  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '10', null])('rejects invalid numeric identifiers %s', value => {
    const b = fixture(); Object.assign(b.shows[0], { id: value }); expect(() => validateBackup(b)).toThrow();
  });
  it.each(['shows', 'seasons', 'episodes', 'progress', 'preferences', 'sources'] as const)('rejects duplicate %s identifiers', field => {
    const b = fixture(); (b[field] as unknown[]).push(b[field][0]); expect(() => validateBackup(b)).toThrow(/duplicate identifier/);
  });
  it('rejects duplicate source row identifiers within one source, while allowing reuse across sources', () => {
    const b = fixture(); b.sources.push({ ...b.sources[0], id: 'different-source' }); expect(validateBackup(b)).toEqual(b);
    b.sources[0].rows = [...b.sources[0].rows, b.sources[0].rows[0]]; expect(() => validateBackup(b)).toThrow(/duplicate identifier/);
  });
  it.each(['seasons', 'episodes', 'preferences'] as const)('rejects an orphan %s show reference', field => {
    const b = fixture(); b[field][0].showId = 99; expect(() => validateBackup(b)).toThrow(/missing show 99/);
  });
  it('rejects conflicting history owners and unknown history owners', () => {
    const b = fixture(); b.shows.push({ ...b.shows[0], id: 11, name: 'Other show' }); b.progress[0].showId = 11;
    expect(() => validateBackup(b)).toThrow(/different show/);
    b.progress[0].showId = 99; expect(() => validateBackup(b)).toThrow(/missing show/);
  });
  it('maps legacy watched history from known episodes without mutating the original', () => {
    const b = fixture(); delete b.progress[0].showId;
    expect(validateBackup(b).progress[0].showId).toBe(10); expect(b.progress[0]).not.toHaveProperty('showId');
  });
  it('retains valid owned retracted history and ownerless legacy history without inventing a show', () => {
    const b = fixture(); b.progress.push({ episodeId: 999, showId: 10, watchedAt: stamp }, { episodeId: 1000, watchedAt: stamp });
    const result = parseBackup(JSON.stringify(b)); expect(result.progress).toEqual(b.progress); expect(result.progress[2]).not.toHaveProperty('showId');
  });
  it('rejects imported source rows without a known linked show', () => {
    const b = fixture(); delete b.sources[0].rows[0].showId; expect(() => validateBackup(b)).toThrow(/no linked show/);
    b.sources[0].rows[0].showId = 99; expect(() => validateBackup(b)).toThrow(/missing show/);
  });
  it('allows old source rows with optional fields absent but rejects any unknown mapping', () => {
    const b = fixture(); b.sources[0].rows[0] = { id: '0', title: 'Unmatched', notes: '', state: 'pending' };
    expect(validateBackup(b)).toEqual(b); b.sources[0].rows[0].showId = 99; expect(() => validateBackup(b)).toThrow(/missing show/);
  });
  it.each([
    ['show summary', (b: Backup) => { Object.assign(b.shows[0], { summary: undefined }); }],
    ['genre', (b: Backup) => { Object.assign(b.shows[0], { genres: [null] }); }],
    ['episode date', (b: Backup) => { b.episodes[0].airdate = '2025-13-01'; }],
    ['episode number', (b: Backup) => { b.episodes[0].number = 0; }],
    ['season', (b: Backup) => { b.seasons[0].number = -1; }],
    ['episode count', (b: Backup) => { b.seasons[0].episodeOrder = 1.5; }],
    ['preference order', (b: Backup) => { b.preferences[0].order = Infinity; }],
    ['source ID', (b: Backup) => { b.sources[0].id = ''; }],
    ['row state', (b: Backup) => { Object.assign(b.sources[0].rows[0], { state: 'unknown' }); }],
    ['row category', (b: Backup) => { Object.assign(b.sources[0].rows[0], { sourceCategory: 'Maybe' }); }],
    ['optional row text', (b: Backup) => { Object.assign(b.sources[0].rows[0], { rawTitle: null }); }],
    ['import timestamp', (b: Backup) => { b.sources[0].importedAt = 'unknown'; }],
  ])('validates the %s field', (_label, change) => {
    const b = fixture(); change(b); expect(() => validateBackup(b)).toThrow(/Backup/);
  });
});
