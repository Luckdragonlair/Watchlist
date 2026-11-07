const {createHash}=require('node:crypto');
function makeCommit(documentPath,manifest,library){
 const raw=JSON.stringify(library),bytes=Buffer.from(raw,'utf8');if(bytes.length>6000000)throw new Error('Shared library exceeds 6 MB; no changes written.');
 const chunks=[];for(let start=0;start<bytes.length;){let end=Math.min(start+750000,bytes.length);while(end<bytes.length&&(bytes[end]&0xc0)===0x80)end--;chunks.push(bytes.subarray(start,end).toString('utf8'));start=end;}
 if(!chunks.length||chunks.length>8)throw new Error('Invalid chunk count.');
 const revision=Number(manifest.fields.revision.integerValue)+1,name=documentPath.replace(/^\//,''),writes=[];
 if(!manifest.updateTime||library.epoch!==manifest.fields.epoch.stringValue)throw new Error('Invalid baseline generation/precondition.');
 for(let i=0;i<chunks.length;i++)writes.push({update:{name:name+'/chunks/'+i,fields:{revision:{integerValue:String(revision)},data:{stringValue:chunks[i]}}}});
 for(let i=chunks.length;i<Number(manifest.fields.chunkCount.integerValue);i++)writes.push({delete:name+'/chunks/'+i});
 const hash=createHash('sha256').update(raw).digest('hex');
 writes.push({update:{name,fields:{version:{integerValue:'1'},revision:{integerValue:String(revision)},epoch:{stringValue:library.epoch},chunkCount:{integerValue:String(chunks.length)},payloadHash:{stringValue:hash}}},currentDocument:{updateTime:manifest.updateTime},updateTransforms:[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]});
 return {writes,revision,hash,bytes:bytes.length};
}
module.exports={makeCommit};
