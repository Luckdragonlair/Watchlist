import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

const projectId = 'demo-watchlist-rules';
const ownerUid = '6FpyLI0bEFaPJBTUboMz0MzTpMV2';
const otherUid = 'another-test-user';
const endpoint = process.env.FIRESTORE_EMULATOR_HOST ?? '';
const match = /^(127\.0\.0\.1|localhost):(\d{1,5})$/.exec(endpoint);

if (!match || Number(match[2]) < 1 || Number(match[2]) > 65535) {
  throw new Error('Refusing to run Firestore rules tests without a local emulator. Set FIRESTORE_EMULATOR_HOST to 127.0.0.1:<port> or localhost:<port>.');
}

const [, host, rawPort] = match;
const port = Number(rawPort);
const rules = await readFile(fileURLToPath(new URL('../../firestore.rules', import.meta.url)), 'utf8');
let environment;

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { host, port, rules },
  });

  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', ownerUid, 'sync', 'library'), {version:1,revision:1,epoch:'fixture',chunkCount:1,payloadHash:'a'.repeat(64),updatedAt:Timestamp.now()});
    await setDoc(doc(db, 'users', ownerUid, 'sync', 'library', 'chunks', '0'), {revision:1,data:'fixture'});
    await setDoc(doc(db, 'users', otherUid, 'sync', 'library'), {version:1,revision:1,epoch:'fixture',chunkCount:1,payloadHash:'a'.repeat(64),updatedAt:Timestamp.now()});
    await setDoc(doc(db, 'config', 'settings'), { value: 'private configuration fixture' });
    await setDoc(doc(db, 'other', 'record'), { value: 'unmatched path fixture' });
  });
});

after(async () => {
  await environment?.cleanup();
});

test('configured owner can read its own root and nested documents', async () => {
  const db = environment.authenticatedContext(ownerUid).firestore();
  await assertSucceeds(getDoc(doc(db, 'users', ownerUid, 'sync', 'library')));
  await assertSucceeds(getDoc(doc(db, 'users', ownerUid, 'sync', 'library', 'chunks', '0')));
});

test('other users and anonymous clients cannot read the owner library', async () => {
  const ownerPath = ['users', ownerUid, 'sync', 'library'];
  const otherDb = environment.authenticatedContext(otherUid).firestore();
  const anonymousDb = environment.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(otherDb, ...ownerPath)));
  await assertFails(getDoc(doc(anonymousDb, ...ownerPath)));
  await assertFails(getDoc(doc(otherDb, 'users', otherUid, 'sync', 'library')));
});

test('the configured owner cannot read another UID path', async () => {
  const db = environment.authenticatedContext(ownerUid).firestore();
  await assertFails(getDoc(doc(db, 'users', otherUid, 'sync', 'library')));
});

test('unstructured owner writes and manifest deletion remain denied', async () => {
  const db = environment.authenticatedContext(ownerUid).firestore();
  await assertFails(setDoc(doc(db, 'users', ownerUid, 'sync', 'new'), { value: 'must be denied' }));
  await assertFails(updateDoc(doc(db, 'users', ownerUid, 'sync', 'library'), { value: 'must be denied' }));
  await assertFails(deleteDoc(doc(db, 'users', ownerUid, 'sync', 'library')));
});

test('owner access to config and unmatched paths remains denied', async () => {
  const db = environment.authenticatedContext(ownerUid).firestore();
  await assertFails(getDoc(doc(db, 'config', 'settings')));
  await assertFails(getDoc(doc(db, 'other', 'record')));
  await assertFails(setDoc(doc(db, 'config', 'new'), { value: 'must be denied' }));
  await assertFails(setDoc(doc(db, 'other', 'new'), { value: 'must be denied' }));
});
