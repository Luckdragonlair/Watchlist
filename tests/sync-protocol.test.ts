import { describe, expect, it } from 'vitest';
import { applySyncOperation, createSyncProtocolState, type SyncOperation, type SyncProtocolState, type SyncResult } from '../src/sync-protocol';

const identity = { protocolVersion: 1 as const, accountId: 'account-A', generation: 'library-A', showId: 10, lifecycle: 'life-A' };
type Kind<K extends SyncOperation['kind']> = Extract<SyncOperation, { kind: K }>;
const add = (changes: Partial<Kind<'add-show'>> = {}): Kind<'add-show'> => ({ ...identity, operationId: 'add-A', kind: 'add-show', baseShowRevision: 0, ...changes });
const put = (changes: Partial<Kind<'put-entity'>> = {}): Kind<'put-entity'> => ({ ...identity, operationId: 'put-A', kind: 'put-entity', entityKey: 'notes', baseRevision: 0, value: 'My notes', ...changes });
const remove = (changes: Partial<Kind<'delete-show'>> = {}): Kind<'delete-show'> => ({ ...identity, operationId: 'delete-A', kind: 'delete-show', baseShowRevision: 1, ...changes });
const empty = () => createSyncProtocolState('account-A', 'library-A');
function applied(state: SyncProtocolState, operation: SyncOperation): SyncProtocolState {
  const result = applySyncOperation(state, operation);
  expect(result.status).toBe('applied');
  if (result.status !== 'applied') throw new Error('Expected applied operation');
  return result.state;
}
function conflict(state: SyncProtocolState, operation: SyncOperation, reason: string): SyncResult {
  const result = applySyncOperation(state, operation);
  expect(result).toMatchObject({ status: 'conflict', reason });
  expect(result.state).toBe(state);
  return result;
}
describe('pure sync protocol', () => {
  it('starts an explicitly identified empty account and generation', () => {
    expect(empty().shows.size).toBe(0); expect(empty().receipts.size).toBe(0);
    expect(() => createSyncProtocolState('', 'generation')).toThrow(/account/);
    expect(() => createSyncProtocolState('account', '')).toThrow(/generation/);
  });
  it('acknowledges duplicate replay exactly once without changing state or revision', () => {
    const first = applySyncOperation(applied(empty(), add()), put());
    expect(first.status).toBe('applied');
    const duplicate = applySyncOperation(first.state, put());
    expect(duplicate.status).toBe('duplicate'); expect(duplicate.state).toBe(first.state);
    if (first.status === 'conflict' || duplicate.status === 'conflict') throw new Error('Expected acknowledgements');
    expect(duplicate.acknowledgement).toEqual(first.acknowledgement);
    expect(duplicate.state.shows.get(10)?.entities.get('notes')?.revision).toBe(1);
    expect(duplicate.state.receipts.size).toBe(2);
  });
  it('treats different object property orders as the same operation', () => {
    const original = put({ value: { a: 1, b: { x: true, y: null } } });
    const state = applied(applied(empty(), add()), original);
    expect(applySyncOperation(state, put({ value: { b: { y: null, x: true }, a: 1 } })).status).toBe('duplicate');
  });
  it('rejects operation ID reuse for different content', () => {
    const state = applied(applied(empty(), add()), put());
    conflict(state, put({ value: 'Different notes' }), 'operation-id-reused');
    conflict(state, put({ entityKey: 'progress:30' }), 'operation-id-reused');
  });
  it('merges independent entities edited from the same snapshot in either arrival order', () => {
    const initial = applied(empty(), add());
    const notes = put(), progress = put({ operationId: 'watch-30', entityKey: 'progress:30', value: { watched: true, watchedAt: '2026-11-06T12:00:00Z' } });
    const a = applied(applied(initial, notes), progress), b = applied(applied(initial, progress), notes);
    expect(a.shows.get(10)?.entities.get('notes')).toEqual(b.shows.get(10)?.entities.get('notes'));
    expect(a.shows.get(10)?.entities.get('progress:30')).toEqual(b.shows.get(10)?.entities.get('progress:30'));
    expect(initial.shows.get(10)?.entities.size).toBe(0);
  });
  it('keeps matching entity keys independent across different shows', () => {
    let state = applied(applied(empty(), add()), add({ showId: 11, operationId: 'add-B', lifecycle: 'life-B' }));
    state = applied(applied(state, put()), put({ showId: 11, lifecycle: 'life-B', operationId: 'notes-B', value: 'Other notes' }));
    expect(state.shows.get(10)?.entities.get('notes')?.value).toBe('My notes');
    expect(state.shows.get(11)?.entities.get('notes')?.value).toBe('Other notes');
  });
  it('rejects same-entity conflicts without silently overwriting or consuming the operation ID', () => {
    const state = applied(applied(empty(), add()), put());
    const edit = put({ operationId: 'put-B', value: 'Competing notes' });
    expect(conflict(state, edit, 'revision-mismatch')).toMatchObject({ currentRevision: 1 });
    expect(state.receipts.has('put-B')).toBe(false);
    const resolved = applied(state, { ...edit, baseRevision: 1 });
    expect(resolved.shows.get(10)?.entities.get('notes')).toEqual({ revision: 2, deleted: false, value: 'Competing notes' });
    expect(state.shows.get(10)?.entities.get('notes')?.value).toBe('My notes');
  });
  it('retains a show tombstone and rejects stale edits to all its child entities', () => {
    const deleted = applied(applied(applied(empty(), add()), put()), remove({ baseShowRevision: 2 }));
    expect(deleted.shows.get(10)).toMatchObject({ deleted: true, showRevision: 3 });
    expect(deleted.shows.get(10)?.entities.size).toBe(0);
    conflict(deleted, put({ operationId: 'late-note', baseRevision: 1 }), 'show-deleted');
    conflict(deleted, put({ operationId: 'late-progress', entityKey: 'progress:30' }), 'show-deleted');
    conflict(deleted, remove({ operationId: 'late-delete' }), 'show-deleted');
  });
  it('replays previously committed edits after deletion as receipts without resurrecting data', () => {
    const deleted = applied(applied(applied(empty(), add()), put()), remove({ baseShowRevision: 2 }));
    const replay = applySyncOperation(deleted, put());
    expect(replay.status).toBe('duplicate'); expect(replay.state).toBe(deleted);
    expect(replay.state.shows.get(10)?.deleted).toBe(true);
    expect(applySyncOperation(deleted, add()).status).toBe('duplicate');
  });
  it('requires an explicit new lifecycle and current tombstone revision to re-add', () => {
    const deleted = applied(applied(empty(), add()), remove());
    conflict(deleted, add({ operationId: 'readd-A', lifecycle: 'life-B' }), 'revision-mismatch');
    conflict(deleted, add({ operationId: 'readd-A', baseShowRevision: 2 }), 'lifecycle-reused');
    const readded = applied(deleted, add({ operationId: 'readd-A', lifecycle: 'life-B', baseShowRevision: 2 }));
    expect(readded.shows.get(10)).toMatchObject({ lifecycle: 'life-B', showRevision: 3, deleted: false, usedLifecycles: ['life-A', 'life-B'] });
    conflict(readded, put({ operationId: 'late-old-edit' }), 'lifecycle-mismatch');
    conflict(readded, remove({ operationId: 'late-old-delete' }), 'lifecycle-mismatch');
    const edited = applied(readded, put({ operationId: 'new-note', lifecycle: 'life-B', value: 'Fresh start' }));
    expect(edited.shows.get(10)?.entities.get('notes')?.revision).toBe(1);
  });
  it('rejects show deletion based on a snapshot predating a child edit', () => {
    const original = applied(empty(), add());
    const edited = applied(original, put());
    expect(conflict(edited, remove(), 'revision-mismatch')).toMatchObject({ currentRevision: 2 });
    expect(edited.shows.get(10)?.entities.get('notes')?.value).toBe('My notes');
    expect(applied(edited, remove({ baseShowRevision: 2 })).shows.get(10)?.deleted).toBe(true);
  });
  it('never reuses any older lifecycle token after repeated delete and re-add', () => {
    const deleted = applied(applied(empty(), add()), remove());
    const readded = applied(deleted, add({ operationId: 'add-B', lifecycle: 'life-B', baseShowRevision: 2 }));
    const deletedAgain = applied(readded, remove({ operationId: 'delete-B', lifecycle: 'life-B', baseShowRevision: 3 }));
    conflict(deletedAgain, add({ operationId: 'add-C', lifecycle: 'life-A', baseShowRevision: 4 }), 'lifecycle-reused');
  });
  it('protects entity deletion with a tombstone revision, including deleting an absent entity', () => {
    const initial = applied(empty(), add());
    const deletion: SyncOperation = { ...identity, kind: 'delete-entity', operationId: 'unwatch-30', entityKey: 'progress:30', baseRevision: 0 };
    const deleted = applied(initial, deletion);
    expect(deleted.shows.get(10)?.entities.get('progress:30')).toEqual({ revision: 1, deleted: true });
    conflict(deleted, put({ operationId: 'stale-watch', entityKey: 'progress:30' }), 'revision-mismatch');
    const watched = applied(deleted, put({ operationId: 'new-watch', entityKey: 'progress:30', baseRevision: 1, value: true }));
    expect(watched.shows.get(10)?.entities.get('progress:30')).toEqual({ revision: 2, deleted: false, value: true });
  });
  it('rejects old generations after restore before consulting any old receipt', () => {
    const old = applied(applied(empty(), add()), put());
    const restored = { ...old, generation: 'restored-generation' };
    conflict(restored, put(), 'generation-mismatch');
    conflict(restored, put({ operationId: 'old-pending-operation' }), 'generation-mismatch');
    expect(restored.shows.get(10)?.entities.get('notes')?.value).toBe('My notes');
    expect(applySyncOperation(restored, put({ operationId: 'new-operation', generation: 'restored-generation', baseRevision: 1 })).status).toBe('applied');
  });
  it('never applies another account operations even when identifiers and generations coincide', () => {
    const state = applied(empty(), add());
    conflict(state, put({ accountId: 'account-B' }), 'account-mismatch');
    expect(state.shows.get(10)?.entities.size).toBe(0);
  });
  it('copies mutable payloads and never modifies the supplied state', () => {
    const initial = empty(), active = applied(initial, add());
    const payload = { list: ['original'] };
    const updated = applied(active, put({ value: payload })); payload.list[0] = 'changed';
    expect(updated.shows.get(10)?.entities.get('notes')?.value).toEqual({ list: ['original'] });
    expect(initial.shows.size).toBe(0); expect(active.shows.get(10)?.entities.size).toBe(0); expect(active.receipts.size).toBe(1);
  });
  it('reports missing shows, active-show re-adds and stale lifecycle revisions explicitly', () => {
    conflict(empty(), put(), 'show-missing');
    conflict(empty(), add({ baseShowRevision: 4 }), 'revision-mismatch');
    const active = applied(empty(), add());
    conflict(active, add({ operationId: 'duplicate-title-add', lifecycle: 'life-B' }), 'show-exists');
    conflict(active, remove({ baseShowRevision: 0 }), 'revision-mismatch');
  });
  it.each([
    { operationId: '' }, { showId: 0 }, { showId: 1.5 }, { protocolVersion: 2 },
    { baseRevision: -1 }, { baseRevision: 0.5 }, { entityKey: '' },
    { value: undefined }, { value: Infinity }, { value: new Date() },
  ])('rejects invalid operation data %s without mutation', change => {
    conflict(applied(empty(), add()), { ...put(), ...change } as SyncOperation, 'invalid-operation');
  });
});
