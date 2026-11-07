import {
  collection, doc, getDocFromServer, onSnapshot, runTransaction, serverTimestamp,
  type Firestore, type Unsubscribe,
} from 'firebase/firestore';
import { validateBackup } from './backup-validation';
import type { SharedLibrary } from './sync-merge';

const MAX_CHUNK_BYTES = 750_000;
const MAX_CHUNK_COUNT = 8;
const MAX_DOCUMENT_CHARS = 800_000;
const MAX_PAYLOAD_BYTES = MAX_CHUNK_BYTES * MAX_CHUNK_COUNT;
const MAX_READ_ATTEMPTS = 3;
const encoder = new TextEncoder();
export class CloudLibraryLimitError extends Error {
  constructor(){super('The shared library exceeds this sync version’s 6 MB limit. Your local library is unchanged.');this.name='CloudLibraryLimitError';}
}

interface Manifest {
  version: 1;
  revision: number;
  epoch: string;
  chunkCount: number;
  payloadHash: string;
  updatedAt: unknown;
}

export class CloudRevisionConflict extends Error {
  constructor(readonly expectedRevision: number, readonly currentRevision: number | null) {
    super(`The shared library changed from revision ${expectedRevision} to ${currentRevision ?? 'empty'}. Read it again before saving.`);
    this.name = 'CloudRevisionConflict';
  }
}

function rootRef(db: Firestore, uid: string) {
  return doc(db, 'users', uid, 'sync', 'library');
}

function chunksRef(db: Firestore, uid: string) {
  return collection(rootRef(db, uid), 'chunks');
}

function chunkRef(db: Firestore, uid: string, index: number) {
  return doc(chunksRef(db, uid), String(index));
}

function assertUid(uid: string): void {
  if (typeof uid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new Error('A valid Firebase user ID is required.');
}

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function validateLibrary(value: unknown): SharedLibrary {
  if (!object(value) || Object.keys(value).sort().join(',') !== 'backup,epoch,lifecycles') throw new Error('The shared library has an invalid shape.');
  if (typeof value.epoch !== 'string' || !value.epoch.trim() || value.epoch.length > 128) throw new Error('The shared library epoch must be a nonempty string of at most 128 characters.');
  if (!object(value.lifecycles)) throw new Error('The shared library lifecycles must be a plain string map.');
  for (const [key, lifecycle] of Object.entries(value.lifecycles)) {
    if (!/^[1-9]\d*$/.test(key) || !Number.isSafeInteger(Number(key))
      || typeof lifecycle !== 'string' || !lifecycle.trim() || lifecycle.length > 128) {
      throw new Error('The shared library lifecycles must contain nonempty plain strings.');
    }
  }
  const backup = validateBackup(value.backup);
  for (const show of backup.shows) {
    if (typeof value.lifecycles[String(show.id)] !== 'string') throw new Error(`Show ${show.id} is missing its lifecycle identifier.`);
  }
  return { backup, epoch: value.epoch, lifecycles: value.lifecycles as Record<string, string> };
}

function splitPayload(serialized: string): string[] {
  const bytes=encoder.encode(serialized);
  if(bytes.byteLength>MAX_PAYLOAD_BYTES)throw new CloudLibraryLimitError();
  const chunks: string[] = [];
  const decoder=new TextDecoder('utf-8',{fatal:true});
  for(let start=0;start<bytes.length;){
    let end=Math.min(start+MAX_CHUNK_BYTES,bytes.length);
    while(end<bytes.length&&(bytes[end]&0xc0)===0x80)end--;
    chunks.push(decoder.decode(bytes.subarray(start,end)));
    start=end;
  }
  if (chunks.length < 1 || chunks.length > MAX_CHUNK_COUNT) throw new Error('The shared library is too large to upload.');
  if (chunks.some(chunk => chunk.length > MAX_DOCUMENT_CHARS)) throw new Error('A shared library chunk exceeds the Firestore document limit.');
  return chunks;
}
export function validateCloudUpload(library:SharedLibrary):void {splitPayload(JSON.stringify(validateLibrary(library)));}

async function sha256(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('Secure hashing is unavailable in this browser. Open Watchlist over HTTPS and retry.');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function parseManifest(value: unknown): Manifest {
  if (!object(value) || Object.keys(value).sort().join(',') !== 'chunkCount,epoch,payloadHash,revision,updatedAt,version') throw new Error('The shared library manifest has an invalid shape.');
  if (value.version !== 1 || !Number.isSafeInteger(value.revision) || Number(value.revision) < 1
    || !Number.isSafeInteger(value.chunkCount) || Number(value.chunkCount) < 1 || Number(value.chunkCount) > MAX_CHUNK_COUNT
    || typeof value.epoch !== 'string' || !value.epoch.trim() || value.epoch.length > 128
    || typeof value.payloadHash !== 'string' || !/^[0-9a-f]{64}$/.test(value.payloadHash)
    || !value.updatedAt || typeof (value.updatedAt as {toDate?: unknown}).toDate !== 'function') {
    throw new Error('The shared library manifest contains invalid values.');
  }
  return value as unknown as Manifest;
}

function sameManifest(a: Manifest, b: Manifest): boolean {
  return a.version === b.version && a.revision === b.revision && a.epoch === b.epoch
    && a.chunkCount === b.chunkCount && a.payloadHash === b.payloadHash;
}

function parseChunk(value: unknown, revision: number): string {
  if (!object(value) || Object.keys(value).sort().join(',') !== 'data,revision'
    || value.revision !== revision || typeof value.data !== 'string'
    || value.data.length > MAX_DOCUMENT_CHARS || encoder.encode(value.data).byteLength>MAX_CHUNK_BYTES) {
    throw new Error('A shared library chunk is missing or invalid.');
  }
  return value.data;
}

/** Read only server-confirmed cloud data. Dexie remains the offline source of truth. */
export async function readRemote(db: Firestore, uid: string): Promise<{revision: number; library: SharedLibrary} | null> {
  assertUid(uid);
  const manifestDocument = rootRef(db, uid);
  for (let attempt = 0; attempt < MAX_READ_ATTEMPTS; attempt++) {
    const firstSnapshot = await getDocFromServer(manifestDocument);
    if (!firstSnapshot.exists()) {
      const confirmation = await getDocFromServer(manifestDocument);
      if (!confirmation.exists()) return null;
      continue;
    }

    const firstManifest = parseManifest(firstSnapshot.data());
    let joined = '';
    let chunkError: unknown;
    for (let index = 0; index < firstManifest.chunkCount; index++) {
      try {
        const snapshot = await getDocFromServer(chunkRef(db, uid, index));
        if (!snapshot.exists()) throw new Error(`Shared library chunk ${index} is missing.`);
        joined += parseChunk(snapshot.data(), firstManifest.revision);
      } catch (error) {
        chunkError = error;
        break;
      }
    }

    const lastSnapshot = await getDocFromServer(manifestDocument);
    if (!lastSnapshot.exists()) continue;
    const lastManifest = parseManifest(lastSnapshot.data());
    if (!sameManifest(firstManifest, lastManifest)) continue;
    if (chunkError) throw chunkError;
    if (encoder.encode(joined).byteLength > MAX_PAYLOAD_BYTES) throw new Error('The shared library exceeds this sync version’s 6 MB read limit.');
    if (await sha256(joined) !== firstManifest.payloadHash) throw new Error('The shared library checksum did not match.');

    let decoded: unknown;
    try { decoded = JSON.parse(joined); } catch { throw new Error('The shared library payload is not valid JSON.'); }
    const library = validateLibrary(decoded);
    if (library.epoch !== firstManifest.epoch) throw new Error('The shared library epoch does not match its manifest.');
    return { revision: firstManifest.revision, library };
  }
  const last = await getDocFromServer(manifestDocument);
  const currentRevision = last.exists() ? parseManifest(last.data()).revision : null;
  throw new CloudRevisionConflict(currentRevision ?? 0, currentRevision);
}

/** Atomically write a validated snapshot when the current remote revision matches. */
export async function writeRemote(db: Firestore, uid: string, expectedRevision: number, value: SharedLibrary): Promise<number> {
  assertUid(uid);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || expectedRevision === Number.MAX_SAFE_INTEGER) {
    throw new Error('The expected cloud revision is invalid.');
  }
  const library = validateLibrary(value);
  const serialized = JSON.stringify(library);
  const chunks = splitPayload(serialized);
  const payloadHash = await sha256(serialized);
  const manifestDocument = rootRef(db, uid);

  return runTransaction(db, async transaction => {
    const currentSnapshot = await transaction.get(manifestDocument);
    let oldManifest: Manifest | null = null;
    if (currentSnapshot.exists()) oldManifest = parseManifest(currentSnapshot.data());
    const currentRevision = oldManifest?.revision ?? 0;
    if (currentRevision !== expectedRevision) throw new CloudRevisionConflict(expectedRevision, currentRevision);
    const revision = expectedRevision + 1;
    const manifest = {
      version: 1 as const, revision, epoch: library.epoch, chunkCount: chunks.length,
      payloadHash, updatedAt: serverTimestamp(),
    };

    for (let index = 0; index < chunks.length; index++) {
      transaction.set(chunkRef(db, uid, index), { revision, data: chunks[index] });
    }
    if (oldManifest) {
      for (let index = chunks.length; index < oldManifest.chunkCount; index++) transaction.delete(chunkRef(db, uid, index));
    }
    transaction.set(manifestDocument, manifest);
    return revision;
  });
}

/** Watch the small root manifest; call readRemote after a server-confirmed revision change. */
export function watchRemote(db: Firestore, uid: string, onRevision: (revision: number) => void, onError: (error: Error) => void): Unsubscribe {
  assertUid(uid);
  let lastRevision: number | null = null;
  return onSnapshot(rootRef(db, uid), { includeMetadataChanges: true }, snapshot => {
    // Ignore cache-only delivery. A metadata event follows once the server has confirmed
    // the first/reconnected snapshot, so the listener cannot hide the initial revision.
    if (snapshot.metadata.fromCache) return;
    try {
      const revision = snapshot.exists() ? parseManifest(snapshot.data()).revision : 0;
      if (revision !== lastRevision) {
        lastRevision = revision;
        onRevision(revision);
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('The shared library manifest is invalid.'));
    }
  }, error => onError(error));
}
