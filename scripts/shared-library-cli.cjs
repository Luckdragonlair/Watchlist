// Project-scoped server-confirmed reader. Credentials stay in Firebase CLI storage.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const project='genre-watchlist',uid='6FpyLI0bEFaPJBTUboMz0MzTpMV2';
const documentPath=`/projects/${project}/databases/(default)/documents/users/${uid}/sync/library`;
let client,validation;
async function api(){
 if(client)return client;
 if(JSON.parse(fs.readFileSync(path.join(root,'.firebaserc'),'utf8')).projects.default!==project)throw new Error('Wrong Firebase project.');
 const cli=path.join(root,'node_modules/firebase-tools/lib');
 const account=require(path.join(cli,'auth')).getGlobalDefaultAccount();if(!account)throw new Error('Sign in using Connect-Firebase.ps1 first.');
 await require(path.join(cli,'requireAuth')).requireAuth({project,user:account.user,tokens:account.tokens,nonInteractive:true});
 client=new(require(path.join(cli,'apiv2')).Client)({urlPrefix:'https://firestore.googleapis.com',apiVersion:'v1',auth:true});return client;
}
async function validators(){
 if(validation)return validation;
 const out=path.join(root,'.tools/library-validation.cjs');fs.mkdirSync(path.dirname(out),{recursive:true});
 const viteRequire=require('node:module').createRequire(require.resolve(path.join(root,'node_modules/vite/package.json')));
 await viteRequire('esbuild').build({absWorkingDir:root,stdin:{contents:"export {validateCloudUpload} from './src/cloud-transport.ts'; export {bucket,queue,regular,released,episodeLabel} from './src/model.ts';",resolveDir:root,loader:'ts'},bundle:true,packages:'external',platform:'node',format:'cjs',outfile:out,logLevel:'silent'});
 validation=require(out);return validation;
}
function decode(doc){return Object.fromEntries(Object.entries(doc.fields??{}).map(([k,v])=>[k,'integerValue'in v?Number(v.integerValue):v.stringValue??v.timestampValue??v.booleanValue]));}
async function readShared(known){
 const client=await api();
 for(let attempt=0;attempt<3;attempt++){
   const first=(await client.get(documentPath)).body,m=decode(first);
   if(m.version!==1||!Number.isSafeInteger(m.revision)||m.revision<1||!Number.isInteger(m.chunkCount)||m.chunkCount<1||m.chunkCount>8||!/^[a-f0-9]{64}$/.test(m.payloadHash))throw new Error('Invalid library manifest.');
   if(known?.revision===m.revision&&known?.payloadHash===m.payloadHash)return null;
   let serialized='';
   for(let i=0;i<m.chunkCount;i++){const c=decode((await client.get(documentPath+'/chunks/'+i)).body);if(c.revision!==m.revision||typeof c.data!=='string'||Buffer.byteLength(c.data)>750000)throw new Error('Changed or invalid library chunk; retry.');serialized+=c.data;}
   const last=(await client.get(documentPath)).body;if(last.updateTime!==first.updateTime)continue;
   if(Buffer.byteLength(serialized)>6000000||createHash('sha256').update(serialized).digest('hex')!==m.payloadHash)throw new Error('Invalid library size or checksum.');
   const library=JSON.parse(serialized);(await validators()).validateCloudUpload(library);
   if(library.epoch!==m.epoch)throw new Error('Library generation mismatch.');
   return {manifest:first,revision:m.revision,library,bytes:Buffer.byteLength(serialized)};
 }
 throw new Error('The shared library is changing. Retry after synchronization finishes.');
}
module.exports={root,project,uid,documentPath,api,validators,decode,readShared};
