const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createReviewServer}=require('../scripts/genre-review/server.cjs');
test('private review lists only multi-genre shows, saves explicit choices, resumes and rejects foreign/invalid writes',async()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'watchlist-genre-review-'));
 const source=JSON.stringify({shows:[{id:1,name:'Fixture fantasy',genres:['Fantasy','Comedy','Fantasy']},{id:2,name:'Single genre',genres:['Action']},{id:3,name:'Unclassified',genres:[]}],progress:[{episodeId:11}]});
 fs.writeFileSync(path.join(folder,'Watchlist Current.json'),source);
 let server=createReviewServer({folder}),browser;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let base='http://127.0.0.1:'+server.address().port;
  const data=await(await fetch(base+'/api/review')).json();assert.equal(data.shows.length,1);assert.deepEqual(data.shows[0].genres,['Comedy','Fantasy']);assert.equal(data.choices.length,0);
  const {chromium}=require('@playwright/test');browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:412,height:900}});
  await page.goto(base);await page.getByRole('radio',{name:'Comedy',exact:true}).waitFor();assert.equal(await page.getByRole('radio',{checked:true}).count(),0);
  await page.getByRole('radio',{name:'Comedy',exact:true}).check();await page.getByText('Saved to your PC.',{exact:true}).waitFor();assert.equal(JSON.parse(fs.readFileSync(path.join(folder,'Primary Genre Choices.json'))).choices[0].primaryGenre,'Comedy');
  await page.getByRole('radio',{name:'Fantasy',exact:true}).check();await page.waitForFunction(()=>document.querySelector('#progress').textContent==='1 / 1 reviewed');await page.waitForTimeout(100);
  assert.equal(await page.getByRole('radio',{checked:true}).count(),1);await page.reload();await page.getByRole('radio',{name:'Fantasy',exact:true}).waitFor();assert.equal(await page.getByRole('radio',{name:'Fantasy',exact:true}).isChecked(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:path.resolve(__dirname,'../artifacts/genre-review.png'),fullPage:true});
  const invalid=await fetch(base+'/api/choice',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({showId:1,primaryGenre:'Horror'})});assert.equal(invalid.status,400);
  const foreign=await fetch(base+'/api/choice',{method:'POST',headers:{Origin:'https://example.org','Content-Type':'application/json'},body:JSON.stringify({showId:1,primaryGenre:'Comedy'})});assert.equal(foreign.status,403);
  const wrongHost=await new Promise((resolve,reject)=>{require('node:http').get(base+'/api/review',{headers:{Host:'evil.example'}},response=>{response.resume();resolve(response.statusCode);}).on('error',reject);});assert.equal(wrongHost,403);
  assert.equal(fs.readFileSync(path.join(folder,'Watchlist Current.json'),'utf8'),source);
  await browser.close();browser=null;await new Promise(resolve=>server.close(resolve));server=createReviewServer({folder});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port;const resumed=await(await fetch(base+'/api/review')).json();assert.equal(resumed.choices[0].primaryGenre,'Fantasy');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));fs.rmSync(folder,{recursive:true,force:true});}
});
