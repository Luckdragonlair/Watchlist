import {afterEach,expect,it} from 'vitest';
import {WatchlistDB,saveBundle,libraryRevision,deleteShow} from '../src/db';
import {createBackup,restoreBackup} from '../src/backup';
import {moveInOrder,saveBingeOrder,type OrderSnapshot} from '../src/binge-order';
const databases:WatchlistDB[]=[];
afterEach(async()=>{for(const db of databases){db.close();await db.delete();}databases.length=0;});
async function fixture(){
 const db=new WatchlistDB('drag-'+crypto.randomUUID());databases.push(db);
 for(const id of [1,2,3,4]){await saveBundle({show:{id,name:'Fixture '+id,summary:null,status:'Running',genres:[],service:null,url:'https://www.tvmaze.com/shows/'+id,syncedAt:new Date().toISOString()},seasons:[{id,showId:id,number:1,episodeOrder:2,endDate:null}],episodes:[{id:id*10,showId:id,season:1,number:1,name:'Episode',summary:null,type:'regular',airstamp:'2025-01-01T12:00:00Z',airdate:'2025-01-01'}]},db);await db.preferences.update(id,{bingeSection:id===4?'watching-now':'watch-soon',order:id,notes:'Keep '+id});}
 const snapshot:OrderSnapshot={section:'watch-soon',revision:await libraryRevision(db),members:await Promise.all([1,2,3].map(async id=>({id,order:id,life:String((await db.settings.get('syncLife:'+id))?.value??'')})))};
 return {db,snapshot};
}
it('saves pointer/keyboard/arrow order atomically while preserving notes, history, other sections and metadata',async()=>{
 const {db,snapshot}=await fixture(),before=await createBackup(db);
 await db.preferences.update(1,{notes:'A newer note is retained'});
 await saveBingeOrder(snapshot,moveInOrder([1,2,3],1,3),db);
 const after=await createBackup(db);expect((await db.preferences.orderBy('order').toArray()).filter(p=>p.bingeSection==='watch-soon').map(p=>p.showId)).toEqual([2,3,1]);
 expect(after.preferences.find(p=>p.showId===1)?.notes).toBe('A newer note is retained');expect(after.preferences.find(p=>p.showId===4)).toEqual(before.preferences.find(p=>p.showId===4));
 for(const key of ['shows','seasons','episodes','progress','sources'] as const)expect(after[key]).toEqual(before[key]);
});
it('rejects an old drag after another order/section edit with no partial writes',async()=>{
 const {db,snapshot}=await fixture();await db.preferences.update(2,{order:90});const before=await createBackup(db);
 await expect(saveBingeOrder(snapshot,[3,2,1],db)).rejects.toThrow('saved order changed');expect((await createBackup(db)).preferences).toEqual(before.preferences);
 await db.preferences.update(2,{order:2,bingeSection:'not-for-me'});await expect(saveBingeOrder(snapshot,[3,2,1],db)).rejects.toThrow('show list changed');
});
it('rejects restore, deletion/re-add and changed availability snapshots',async()=>{
 const {db,snapshot}=await fixture();await restoreBackup(await createBackup(db),db);await expect(saveBingeOrder(snapshot,[3,2,1],db)).rejects.toThrow('restored or synchronized');
 const fresh={...snapshot,revision:await libraryRevision(db)};await deleteShow(1,db);await expect(saveBingeOrder(fresh,[3,2,1],db)).rejects.toThrow('show list changed');
 const other=await fixture();await other.db.episodes.update(20,{airstamp:'2035-01-01T12:00:00Z',airdate:'2035-01-01'});await expect(saveBingeOrder(other.snapshot,[3,2,1],other.db)).rejects.toThrow('show list changed');
});
it('rejects invalid permutations before writing and keeps hidden cards in their full saved ordering',async()=>{
 const {db,snapshot}=await fixture();await expect(saveBingeOrder(snapshot,[3,3,1],db)).rejects.toThrow('Invalid show order');
 await expect(saveBingeOrder({...snapshot,section:'everything-else' as never},[3,2,1],db)).rejects.toThrow('Invalid show order');
 expect(moveInOrder([1,2,3],3,1)).toEqual([3,1,2]);await saveBingeOrder(snapshot,moveInOrder([1,2,3],1,3),db);expect((await db.preferences.get(2))?.order).toBe(0);
});

it('started manual override survives format-3 backup/restore and Recent clears the override safely',async()=>{
 const {db}=await fixture();
 for(const id of [1,2,3]){await db.episodes.put({id:id*10+1,showId:id,season:1,number:2,name:'Next',summary:null,type:'regular',airstamp:'2025-01-01T12:00:00Z',airdate:'2025-01-01'});await db.progress.put({episodeId:id*10,showId:id,watchedAt:'2026-11-0'+id+'T12:00:00Z'});}
 async function capture():Promise<OrderSnapshot>{return {section:'watching-now',started:true,revision:await libraryRevision(db),members:await Promise.all([1,2,3].map(async id=>{const p=(await db.preferences.get(id))!;return {id,order:p.order,life:String((await db.settings.get('syncLife:'+id))?.value??''),activity:Date.parse('2026-11-0'+id+'T12:00:00Z'),storedSection:p.bingeSection,manual:!!p.bingeManualOrder};}))};}
 await saveBingeOrder(await capture(),[1,3,2],db);const backup=await createBackup(db);expect(backup.version).toBe(3);expect(backup.preferences.filter(p=>p.showId<4).every(p=>p.bingeManualOrder)).toBe(true);
 await restoreBackup(backup,db);expect((await db.preferences.get(1))?.bingeManualOrder).toBe(true);
 await saveBingeOrder(await capture(),[1,3,2],db,new Date(),false);expect((await db.preferences.get(1))?.bingeManualOrder).toBe(false);
 const stale=await capture();await db.progress.update(10,{watchedAt:'2026-11-08T12:00:00Z'});await expect(saveBingeOrder(stale,[3,2,1],db)).rejects.toThrow('saved order changed');
});
