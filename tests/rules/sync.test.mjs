import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';

const projectId = 'demo-watchlist-rules';
const ownerUid = '6FpyLI0bEFaPJBTUboMz0MzTpMV2';
const otherUid = 'another-test-user';
const endpoint = process.env.FIRESTORE_EMULATOR_HOST ?? '';
const match = /^(127\.0\.0\.1|localhost):(\d{1,5})$/.exec(endpoint);

if (!match || Number(match[2]) < 1 || Number(match[2]) > 65535) {
  throw new Error('Refusing to run Firestore sync rules tests without a local emulator. Set FIRESTORE_EMULATOR_HOST to 127.0.0.1:<port> or localhost:<port>.');
}

const [, host, rawPort] = match;
const port = Number(rawPort);
const rules = await readFile(fileURLToPath(new URL('../../firestore.rules', import.meta.url)), 'utf8');
let environment;

function libraryRef(db, uid = ownerUid) {
  return doc(db, 'users', uid, 'sync', 'library');
}

function chunkRef(db, index, uid = ownerUid) {
  return doc(db, 'users', uid, 'sync', 'library', 'chunks', String(index));
}

function manifest(revision, chunkCount, extra = {}) {
  return {
    version: 1,
    revision,
    epoch: 'epoch-a',
    chunkCount,
    payloadHash: 'a'.repeat(64),
    updatedAt: serverTimestamp(),
    ...extra,
  };
}

async function commitLibrary(db, revision, chunks, manifestExtra = {}) {
  const batch = writeBatch(db);
  batch.set(libraryRef(db), manifest(revision, chunks.length, manifestExtra));
  chunks.forEach((data, index) => batch.set(chunkRef(db, index), { revision, data }));
  return batch.commit();
}

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { host, port, rules },
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
});

after(async () => {
  await environment?.cleanup();
});

test('owner can atomically create and advance a multi-chunk library, deleting stale chunks', async () => {
  const db = environment.authenticatedContext(ownerUid).firestore();
  const initial = await assertSucceeds(getDoc(libraryRef(db)));
  assert.equal(initial.exists(), false);
  await assertSucceeds(commitLibrary(db, 1, ['first part', 'second part']));
  await assertSucceeds(getDoc(libraryRef(db)));
  await assertSucceeds(getDoc(chunkRef(db, 0)));
  await assertSucceeds(getDoc(chunkRef(db, 1)));

  const update = writeBatch(db);
  update.set(libraryRef(db), manifest(2, 1));
  update.set(chunkRef(db, 0), { revision: 2, data: 'replacement snapshot' });
  update.delete(chunkRef(db, 1));
  await assertSucceeds(update.commit());
  await assertSucceeds(getDoc(libraryRef(db)));
  await assertSucceeds(getDoc(chunkRef(db, 0)));
  await assertFails(getDoc(chunkRef(db, 1)));
});

test('anonymous and non-owner clients cannot read the owner manifest or chunks', async () => {
  const seed = environment.authenticatedContext(ownerUid).firestore();
  await assertSucceeds(commitLibrary(seed, 1, ['owner data']));

  const anonymousDb = environment.unauthenticatedContext().firestore();
  const otherDb = environment.authenticatedContext(otherUid).firestore();
  await assertFails(getDoc(libraryRef(anonymousDb)));
  await assertFails(getDoc(chunkRef(anonymousDb, 0)));
  await assertFails(getDoc(libraryRef(otherDb)));
  await assertFails(getDoc(chunkRef(otherDb, 0)));
  await assertFails(getDoc(libraryRef(otherDb, otherUid)));
});

test('manifest rejects extra fields and invalid revision transitions', async () => {
  const db = environment.authenticatedContext(ownerUid).firestore();
  const badSchema = writeBatch(db);
  badSchema.set(libraryRef(db), manifest(1, 1, { admin: true }));
  badSchema.set(chunkRef(db, 0), { revision: 1, data: 'payload' });
  await assertFails(badSchema.commit());

  await assertSucceeds(commitLibrary(db, 1, ['payload']));
  const badRevision = writeBatch(db);
  badRevision.set(libraryRef(db), manifest(3, 1));
  badRevision.set(chunkRef(db, 0), { revision: 3, data: 'new payload' });
  await assertFails(badRevision.commit());
});

test('chunks reject oversized data and extra fields', async () => {
  const db = environment.authenticatedContext(ownerUid).firestore();
  const oversized = writeBatch(db);
  oversized.set(libraryRef(db), manifest(1, 1));
  oversized.set(chunkRef(db, 0), { revision: 1, data: 'x'.repeat(800_001) });
  await assertFails(oversized.commit());

  const badChunk = writeBatch(db);
  badChunk.set(libraryRef(db), manifest(1, 1));
  badChunk.set(chunkRef(db, 0), { revision: 1, data: 'payload', extra: true });
  await assertFails(badChunk.commit());
});

test('chunk writes without an atomic manifest and manifests without chunk zero are denied', async () => {
  const db = environment.authenticatedContext(ownerUid).firestore();
  await assertFails(setDoc(chunkRef(db, 0), { revision: 1, data: 'orphaned chunk' }));
  await assertFails(setDoc(libraryRef(db), manifest(1, 1)));
});

test('manifest deletion is denied, including by the configured owner', async () => {
  const db = environment.authenticatedContext(ownerUid).firestore();
  await assertSucceeds(commitLibrary(db, 1, ['payload']));
  await assertFails(deleteDoc(libraryRef(db)));
});

test('owner cannot write the sync library under another UID', async () => {
  const db = environment.authenticatedContext(ownerUid).firestore();
  const batch = writeBatch(db);
  batch.set(libraryRef(db, otherUid), manifest(1, 1));
  batch.set(chunkRef(db, 0, otherUid), { revision: 1, data: 'wrong owner' });
  await assertFails(batch.commit());
});

test('all eight declared chunks must be present in the atomic snapshot', async () => {
  const db = environment.authenticatedContext(ownerUid).firestore();
  const partial = writeBatch(db);
  partial.set(libraryRef(db), manifest(1, 8));
  for (let index = 0; index < 7; index++) partial.set(chunkRef(db, index), {revision: 1, data: 'fixture'});
  await assertFails(partial.commit());
  await assertSucceeds(commitLibrary(db, 1, Array(8).fill('fixture')));
});
