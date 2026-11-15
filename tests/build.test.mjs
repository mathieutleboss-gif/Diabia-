import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const script=path.resolve('scripts/build-site.mjs');
test('un échec de build ne perd pas les routes API de la source',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'diabia-build-'));
 try{await mkdir(path.join(root,'app/api'),{recursive:true});await writeFile(path.join(root,'app/api/original.txt'),'source à préserver');await mkdir(path.join(root,'tests'),{recursive:true});await writeFile(path.join(root,'tests/keep.txt'),'tests à préserver');await mkdir(path.join(root,'node_modules/next/dist/bin'),{recursive:true});await writeFile(path.join(root,'node_modules/next/dist/bin/next'),'process.exit(1)');const r=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});assert.notEqual(r.status,0);assert.equal(await readFile(path.join(root,'app/api/original.txt'),'utf8'),'source à préserver');assert.equal(await readFile(path.join(root,'tests/keep.txt'),'utf8'),'tests à préserver');}finally{await rm(root,{recursive:true,force:true});}
});
test('un build interrompu exige une récupération sans supprimer les fichiers API restants',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'diabia-build-'));
 try{await mkdir(path.join(root,'.sites-build/api'),{recursive:true});await writeFile(path.join(root,'.sites-build/api/original.txt'),'à récupérer');const r=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});assert.notEqual(r.status,0);assert.equal(await readFile(path.join(root,'.sites-build/api/original.txt'),'utf8'),'à récupérer');}finally{await rm(root,{recursive:true,force:true});}
});
