import {test} from 'node:test';import assert from 'node:assert/strict';
import {chromium} from 'playwright';import {sourcePage} from './fixtures/render-page.mjs';
test('stored title markup stays inert visible text',async()=>{
 const browser=await chromium.launch({headless:true,channel:"chrome"});
 try{
  const page=await browser.newPage();await page.route('https://**',r=>r.abort());
  await page.setContent(sourcePage('window.lucide={createIcons(){}};'));
  await page.evaluate(()=>{
   const bad='<img data-injected="yes" src=x onerror="window.pwned=1">';
   if(typeof renderLibrary==='function') {S.prompts=[{id:'a',title:bad,prompt:'safe',tags:'',cat:'Marketing',vars:[]}];renderLibrary();}
   else if(typeof renderLibraryView==='function')renderLibraryView({records:[{id:'a',title:bad,body:'safe',tags:[],categoryId:'cat'}],query:'',filters:{},status:'ready'});
  });
  assert.equal(await page.locator('[data-injected]').count(),0);
  assert.equal(await page.evaluate(()=>window.pwned||0),0);
  assert.match(await page.locator('#library-grid').textContent(),/<img/);
 }finally{await browser.close();}
});
