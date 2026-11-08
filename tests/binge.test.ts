import {afterEach,expect,it} from 'vitest';
import {WatchlistDB,saveBundle,setWatched,deleteShow,libraryRevision} from '../src/db';
import {createBackup,restoreBackup} from '../src/backup';
import {validateBackup} from '../src/backup-validation';
import {sectionOf,nextBingeDate,setBingeSection} from '../src/binge';
import {readLocalSync} from '../src/sync-local';
import {mergeLibraries,SyncConflict} from '../src/sync-merge';
import type {Bundle} from '../src/model';
const now=new Date('2026-11-08T18:00:00Z');
const bundle:Bundle={show:{id:1,name:'Section fixture',summary:null,status:'Running',genres:[],service:null,url:'https://www.tvmaze.com/shows/1',syncedAt:now.toISOString()},seasons:[],episodes:[{id:11,showId:1,season:1,number:1,name:'Episode',summary:null,type:'regular',airstamp:'2025-01-01T12:00:00Z',airdate:'2025-01-01'}]};
const databases:WatchlistDB[]=[];afterEach(async()=>{for(const database of databases)await database.delete();databases.length=0;});
async function fixture(){const database=new WatchlistDB('binge-'+crypto.randomUUID());databases.push(database);await saveBundle(bundle,database);return database;}
async function context(database:WatchlistDB){return [await libraryRevision(database),String((await database.settings.get('syncLife:1'))?.value??'')] as const;}
it('defaults new imports to Everything else and maps old unsectioned order to Watch soon without rewriting it',async()=>{
  const database=await fixture();expect(sectionOf(await database.preferences.get(1))).toBe('everything-else');
  const old={showId:1,order:17,notes:'Keep me'};await database.preferences.put(old);
  expect(sectionOf(await database.preferences.get(1))).toBe('watch-soon');expect(await database.preferences.get(1)).toEqual(old);
});
it('moves section reversibly without losing history/notes and preserves it through refresh, backup and restore',async()=>{
  const database=await fixture();await setWatched(11,true,database);await database.preferences.update(1,{notes:'Important'});
  const history=await database.progress.toArray();
  await setBingeSection(1,'not-for-me',...await context(database),database);await saveBundle(bundle,database,true);
  expect(await database.preferences.get(1)).toMatchObject({notes:'Important',bingeSection:'not-for-me'});expect(await database.progress.toArray()).toEqual(history);
  const backup=await createBackup(database);expect(backup.version).toBe(3);expect(validateBackup(backup).preferences[0].bingeSection).toBe('not-for-me');
  await restoreBackup(backup,database);await setBingeSection(1,'watching-now',...await context(database),database);
  expect(await database.preferences.get(1)).toMatchObject({notes:'Important',bingeSection:'watching-now'});expect(await database.progress.toArray()).toEqual(history);
});
it('keeps v1 backups readable and rejects unrecognized sections or sections hidden inside the old format',async()=>{
  const database=await fixture(),backup=await createBackup(database);const old={...backup,version:1,preferences:backup.preferences.map(({bingeSection,...p})=>p)};
  expect(validateBackup(old).version).toBe(1);expect(()=>validateBackup({...backup,version:1})).toThrow('Binge section');
  expect(()=>validateBackup({...backup,preferences:[{...backup.preferences[0],bingeSection:'invisible'}]})).toThrow('Binge section');
});
it('rejects a stale section action after restore or delete/re-add',async()=>{
  const database=await fixture(),old=await context(database);await restoreBackup(await createBackup(database),database);
  await expect(setBingeSection(1,'not-for-me',...old,database)).rejects.toThrow('restored or synchronized');
  const restored=await context(database);await deleteShow(1,database);await saveBundle(bundle,database);
  await expect(setBingeSection(1,'not-for-me',...restored,database)).rejects.toThrow('removed or replaced');
  expect((await database.preferences.get(1))?.bingeSection).toBe('everything-else');
});
it('merges an independent note and section choice, but holds conflicting section choices',async()=>{
  const database=await fixture(),base=(await readLocalSync(database)).current,local=structuredClone(base),remote=structuredClone(base);
  local.backup.preferences[0].bingeSection='watching-now';remote.backup.preferences[0].notes='Phone note';
  expect(mergeLibraries(base,local,remote).backup.preferences[0]).toMatchObject({bingeSection:'watching-now',notes:'Phone note'});
  remote.backup.preferences[0].bingeSection='not-for-me';expect(()=>mergeLibraries(base,local,remote)).toThrow(SyncConflict);
});
it('recognizes date-only future dates without inventing a release time or availability',()=>{
  const dateOnly={...bundle.episodes[0],airstamp:null,airdate:'2026-11-08'};
  expect(nextBingeDate([dateOnly],now)).toEqual({date:'2026-11-08',stamp:null});
  expect(nextBingeDate([{...dateOnly,airdate:null}],now)).toBeUndefined();
});
