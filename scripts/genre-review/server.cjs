const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const genresOf=values=>[...new Set(values.map(value=>value.trim()).filter(Boolean).map(value=>/^(science[ -]?fiction|sci-?fi)$/i.test(value)?'Science-Fiction':value))].sort((a,b)=>a.localeCompare(b));
const autoGenre=genres=>['Science-Fiction','Superhero','Fantasy','Horror','Comedy','Drama'].find(value=>genres.includes(value))??genres[0];
function createReviewServer({folder=path.resolve(__dirname,'../../Library')}={}){
 const backup=JSON.parse(fs.readFileSync(path.join(folder,'Watchlist Current.json'),'utf8'));
 const statusPath=path.join(folder,'export-status.json'),snapshot=fs.existsSync(statusPath)?JSON.parse(fs.readFileSync(statusPath,'utf8')):{exportedAt:backup.exportedAt};
 const shows=backup.shows.map(show=>({id:show.id,name:show.name,genres:genresOf(show.genres)})).filter(show=>show.genres.length>1).sort((a,b)=>a.name.localeCompare(b.name));
 const output=path.join(folder,'Primary Genre Choices.json');
 let review=fs.existsSync(output)?JSON.parse(fs.readFileSync(output,'utf8')):{version:1,purpose:'Watchlist primary genre review',choices:[]};
 if(review.version!==1||!Array.isArray(review.choices)||review.choices.some(row=>!Number.isInteger(row.showId)||typeof row.primaryGenre!=='string'))throw Error('Existing choices file is invalid; preserved unchanged.');
 const reply=(res,code,value)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
 return http.createServer(async(req,res)=>{
  const address=req.socket.localAddress,port=req.socket.localPort,origin='http://127.0.0.1:'+port;
  if(req.headers.host!=='127.0.0.1:'+port){reply(res,403,{error:'Local host required.'});return;}
  const route=new URL(req.url,origin).pathname;
  try{
   if(req.method==='GET'&&route==='/api/health'){reply(res,200,{service:'watchlist-genre-review',count:shows.length});return;}
   if(req.method==='GET'&&route==='/api/review'){reply(res,200,{snapshot,shows:shows.map(show=>({...show,automatic:autoGenre(show.genres)})),choices:review.choices});return;}
   if(req.method==='GET'&&route==='/api/export'){res.setHeader('Content-Disposition','attachment; filename="Primary Genre Choices.json"');reply(res,200,review);return;}
   if(req.method==='POST'&&route==='/api/choice'){
    if(req.headers.origin!==origin||!req.headers['content-type']?.startsWith('application/json')){reply(res,403,{error:'Save from the local review page only.'});return;}
    let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096){reply(res,413,{error:'Request too large.'});return;}}
    const input=JSON.parse(body),show=shows.find(row=>row.id===input.showId);
    if(!show||!show.genres.includes(input.primaryGenre)){reply(res,400,{error:'Choose one of this show’s listed genres.'});return;}
    const choice={showId:show.id,name:show.name,genres:show.genres,primaryGenre:input.primaryGenre,chosenAt:new Date().toISOString(),snapshot};
    const next={...review,updatedAt:new Date().toISOString(),choices:[...review.choices.filter(row=>row.showId!==show.id),choice]};
    const temporary=output+'.pending';fs.writeFileSync(temporary,JSON.stringify(next,null,2)+'\n',{flag:'w'});fs.renameSync(temporary,output);review=next;
    reply(res,200,{saved:choice});return;
   }
   if(req.method==='GET'&&(route==='/'||route==='/client.js')){
    res.writeHead(200,{'Content-Type':route==='/'?'text/html; charset=utf-8':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",'Referrer-Policy':'no-referrer'});res.end(fs.readFileSync(path.join(__dirname,route==='/'?'page.html':'client.js')));return;
   }
   reply(res,404,{error:'Not found.'});
  }catch(error){reply(res,500,{error:'Could not save or load this review. Your app library has not changed.'});}
 });
}
if(require.main===module){const server=createReviewServer();server.listen(5188,'127.0.0.1',()=>console.log('Genre review: http://127.0.0.1:5188'));server.on('error',error=>{console.error(error.message);process.exitCode=1;});}
module.exports={createReviewServer};
