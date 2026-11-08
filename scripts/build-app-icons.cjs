// Regenerate the approved code-native icon; no network resources or AI generation.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'..');
(async()=>{const template=fs.readFileSync(path.join(root,'design/app-icon-metallic-gold/icon-source.html'),'utf8'),font=fs.readFileSync(path.join(root,'public/fonts/instrument-serif-normal-400.woff2')).toString('base64');
 const browser=await chromium.launch({channel:'msedge',headless:true});try{const page=await browser.newPage({viewport:{width:600,height:600},deviceScaleFactor:1});await page.setContent(template.replace('{{FONT_DATA}}','data:font/woff2;base64,'+font));await page.evaluate(()=>document.fonts.ready);
 for(const [name,size,small,fullBleed] of [['nightfall-gold-192.png',192,false,false],['nightfall-gold-512.png',512,false,false],['nightfall-gold-maskable.png',512,false,true],['nightfall-gold-apple.png',180,false,true],['nightfall-gold-32.png',32,true,false],['nightfall-gold-16.png',16,true,false]]){
  await page.evaluate(({size,small,fullBleed})=>{const stage=document.querySelector('#stage');stage.replaceChildren();stage.style.width=size+'px';stage.style.height=size+'px';const variants=document.querySelector('#variants').firstElementChild,icon=variants.children[small?2:0].cloneNode(true);icon.style.transform='scale('+(size/(small?32:120))+')';icon.style.transformOrigin='top left';if(fullBleed){icon.style.borderRadius='0';icon.style.boxShadow='none';}stage.append(icon);},{size,small,fullBleed});
  await page.locator('#stage').screenshot({path:path.join(root,'public/icons',name),omitBackground:true});
 }console.log('Generated six approved metallic-gold icon assets.');}finally{await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
