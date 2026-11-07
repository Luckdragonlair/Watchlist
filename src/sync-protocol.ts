// Pure protocol model, not a network client. A future adapter must validate input,
// authenticate the account, and persist the state + acknowledgement atomically.
export type SyncValue = null | boolean | number | string | SyncValue[] | { [key: string]: SyncValue };
interface OperationIdentity {
  protocolVersion: 1;
  operationId: string;
  accountId: string;
  generation: string;
  showId: number;
  lifecycle: string;
}
export type SyncOperation = OperationIdentity & (
  | { kind: 'add-show'; baseShowRevision: number }
  | { kind: 'delete-show'; baseShowRevision: number }
  | { kind: 'put-entity'; entityKey: string; baseRevision: number; value: SyncValue }
  | { kind: 'delete-entity'; entityKey: string; baseRevision: number }
);
export interface SyncEntity {
  readonly revision: number;
  readonly deleted: boolean;
  readonly value?: SyncValue;
}
export interface SyncShow {
  readonly lifecycle: string;
  // Includes child edits so deleting a show also detects unseen notes/progress.
  // Child edits still compare only their own entity revision and can merge.
  readonly showRevision: number;
  readonly usedLifecycles: readonly string[];
  readonly deleted: boolean;
  readonly entities: ReadonlyMap<string, SyncEntity>;
}
export interface SyncAcknowledgement {
  readonly operationId: string;
  readonly showId: number;
  readonly showRevision: number;
  readonly entityKey?: string;
  readonly entityRevision?: number;
}
export interface SyncReceipt {
  readonly signature: string;
  readonly acknowledgement: SyncAcknowledgement;
}
export interface SyncProtocolState {
  readonly accountId: string;
  readonly generation: string;
  readonly shows: ReadonlyMap<number, SyncShow>;
  readonly receipts: ReadonlyMap<string, SyncReceipt>;
}
export type SyncConflictReason = 'invalid-operation' | 'account-mismatch' | 'generation-mismatch'
  | 'operation-id-reused' | 'show-missing' | 'show-exists' | 'show-deleted'
  | 'lifecycle-mismatch' | 'lifecycle-reused' | 'revision-mismatch';
export type SyncResult =
  | { status: 'applied' | 'duplicate'; state: SyncProtocolState; acknowledgement: SyncAcknowledgement }
  | { status: 'conflict'; state: SyncProtocolState; reason: SyncConflictReason; currentRevision?: number };

const identifier = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const revision = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

// Canonical JSON makes identity checks independent of object property order, and
// ensures payloads are finite plain data. It never executes HTML or provider text.
function canonical(value: unknown, ancestors = new Set<object>()): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (typeof value !== 'object' || !value || ancestors.has(value)) throw new Error('Expected finite JSON data');
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) throw new Error('Expected plain JSON data');
  ancestors.add(value);
  let result: string;
  if (Array.isArray(value)) {
    // Array holes are not JSON values; do not silently replace them with null.
    result = '[' + Array.from(value, child => canonical(child, ancestors)).join(',') + ']';
  } else {
    result = '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical((value as Record<string, unknown>)[key], ancestors)).join(',') + '}';
  }
  ancestors.delete(value);
  return result;
}

/** A generation is a committed library identity, not a timestamp or device clock.
 * After a restore, an adapter starts from the new committed generation and its
 * validated snapshot. It must quarantine old-generation pending operations.
 */
export function createSyncProtocolState(accountId: string, generation: string): SyncProtocolState {
  if (!identifier(accountId) || !identifier(generation)) throw new Error('An account and library generation are required.');
  return { accountId, generation, shows: new Map(), receipts: new Map() };
}

/** Receipts and show tombstones must be retained by the future persistent adapter.
 * Do not compact either without a separate acknowledged-device protocol.
 * Conflict outcomes never change state or consume an operation ID.
 */
export function applySyncOperation(state: SyncProtocolState, operation: SyncOperation): SyncResult {
  const conflict = (reason: SyncConflictReason, currentRevision?: number): SyncResult => ({ status: 'conflict', state, reason, ...(currentRevision === undefined ? {} : { currentRevision }) });
  if (!operation || operation.protocolVersion !== 1 || !identifier(operation.operationId)
    || !identifier(operation.accountId) || !identifier(operation.generation) || !identifier(operation.lifecycle)
    || !Number.isSafeInteger(operation.showId) || operation.showId <= 0) return conflict('invalid-operation');
  if (operation.accountId !== state.accountId) return conflict('account-mismatch');
  if (operation.generation !== state.generation) return conflict('generation-mismatch');
  if (operation.kind === 'add-show' || operation.kind === 'delete-show') {
    if (!revision(operation.baseShowRevision)) return conflict('invalid-operation');
  } else if (operation.kind === 'put-entity' || operation.kind === 'delete-entity') {
    if (!identifier(operation.entityKey) || !revision(operation.baseRevision)) return conflict('invalid-operation');
  } else return conflict('invalid-operation');
  let signature: string;
  let normalizedValue: SyncValue | undefined;
  try {
    signature = canonical(operation);
    if (operation.kind === 'put-entity') normalizedValue = JSON.parse(canonical(operation.value)) as SyncValue;
  } catch { return conflict('invalid-operation'); }
  const previous = state.receipts.get(operation.operationId);
  if (previous) {
    if (previous.signature !== signature) return conflict('operation-id-reused');
    return { status: 'duplicate', state, acknowledgement: previous.acknowledgement };
  }
  const current = state.shows.get(operation.showId);
  let next: SyncShow;
  let entityRevision: number | undefined;
  if (operation.kind === 'add-show') {
    if (current && !current.deleted) return conflict('show-exists', current.showRevision);
    if (operation.baseShowRevision !== (current?.showRevision ?? 0)) return conflict('revision-mismatch', current?.showRevision ?? 0);
    if (current?.usedLifecycles.includes(operation.lifecycle)) return conflict('lifecycle-reused');
    if (operation.baseShowRevision === Number.MAX_SAFE_INTEGER) return conflict('invalid-operation');
    next = { lifecycle: operation.lifecycle, showRevision: operation.baseShowRevision + 1,
      usedLifecycles: [...(current?.usedLifecycles ?? []), operation.lifecycle], deleted: false, entities: new Map() };
  } else {
    if (!current) return conflict('show-missing');
    if (operation.lifecycle !== current.lifecycle) return conflict('lifecycle-mismatch');
    if (current.deleted) return conflict('show-deleted');
    if (operation.kind === 'delete-show') {
      if (operation.baseShowRevision !== current.showRevision) return conflict('revision-mismatch', current.showRevision);
      if (current.showRevision === Number.MAX_SAFE_INTEGER) return conflict('invalid-operation');
      next = { ...current, showRevision: current.showRevision + 1, deleted: true, entities: new Map() };
    } else {
      const existingRevision = current.entities.get(operation.entityKey)?.revision ?? 0;
      if (operation.baseRevision !== existingRevision) return conflict('revision-mismatch', existingRevision);
      if (existingRevision === Number.MAX_SAFE_INTEGER || current.showRevision === Number.MAX_SAFE_INTEGER) return conflict('invalid-operation');
      entityRevision = existingRevision + 1;
      const entities = new Map(current.entities);
      entities.set(operation.entityKey, operation.kind === 'delete-entity'
        ? { revision: entityRevision, deleted: true }
        : { revision: entityRevision, deleted: false, value: normalizedValue });
      next = { ...current, showRevision: current.showRevision + 1, entities };
    }
  }
  const acknowledgement: SyncAcknowledgement = {
    operationId: operation.operationId, showId: operation.showId, showRevision: next.showRevision,
    ...('entityKey' in operation ? { entityKey: operation.entityKey, entityRevision } : {}),
  };
  const shows = new Map(state.shows); shows.set(operation.showId, next);
  const receipts = new Map(state.receipts); receipts.set(operation.operationId, { signature, acknowledgement });
  return { status: 'applied', state: { ...state, shows, receipts }, acknowledgement };
}
