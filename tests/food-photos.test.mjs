import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const catalog=JSON.parse(await fs.readFile('lib/nutrition/photo-catalog.json','utf8'));
test('52 références distinctes avec photographies JPEG décodables, légères et intègres',async()=>{
 assert.equal(catalog.length,52);
 assert.equal(new Set(catalog.map(p=>p.foodId)).size,catalog.length);
 assert.equal(new Set(catalog.map(p=>p.src)).size,catalog.length);
 let total=0;
 for(const p of catalog){
  assert.match(p.src,/^\/foods\/[a-z0-9-]+\.jpg$/);
  const bytes=await fs.readFile('public'+p.src);
  assert.equal(bytes.length,p.bytes);
  assert.ok(bytes.length<=48000);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),p.sha256);
  const meta=await sharp(bytes).metadata();
  assert.equal(meta.format,'jpeg');assert.ok(meta.width>0&&meta.width<=250);
  await sharp(bytes).raw().toBuffer(); // Decode pixels, not just the file header.
  total+=bytes.length;
 }
 assert.equal(total,705857);
});
test('attributions complètes et copie intégrale GFDL disponibles hors ligne',async()=>{
 const credits=await fs.readFile('public/foods/CREDITS.md','utf8');
 for(const p of catalog){
  assert.ok(credits.includes(p.foodId)&&credits.includes(p.author)&&credits.includes(p.license));
  assert.ok(credits.includes(p.sourceUrl.replaceAll(' ','%20')));
  assert.match(p.reviewedOn,/^\d{4}-\d{2}-\d{2}$/);
  assert.ok(!/[<>]/.test(p.author));
 }
 assert.equal(catalog.filter(p=>p.license==='GFDL 1.2').length,7);
 const license=await fs.readFile('public/foods/LICENSE-GFDL-1.2.txt','utf8');
 assert.ok(license.includes('Version 1.2, November 2002')&&license.includes('ADDENDUM'));
 assert.ok(credits.includes('LICENSE-GFDL-1.2.txt'));
});
test('l’importateur rejette doublons et mauvais libellés avant toute écriture',async()=>{
 const file='lib/nutrition/photo-catalog.json',before=await fs.readFile(file,'utf8');
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'diabia-photo-test-'));
 try{
  for(const change of [{}, {foodId:'ciqual:4003',expectedName:'nom incorrect',src:'/foods/ciqual-4003.jpg'}, {foodId:'ciqual:4003',expectedName:"Pomme de terre, bouillie/cuite à l'eau",src:'/foods/../escape.jpg'}]){
   const plan=path.join(dir,'rejected.json');
   await fs.writeFile(plan,JSON.stringify([{...catalog[0],inputFile:path.resolve('public'+catalog[0].src),...change}]));
   assert.throws(()=>execFileSync(process.execPath,['scripts/import-food-photos.mjs',plan],{stdio:'pipe'}));
   assert.equal(await fs.readFile(file,'utf8'),before);
  }
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
