// Usage: node scripts/import-food-photos.mjs /path/to/approved-entries.json
// Each entry explicitly contains foodId, expectedName, inputFile, src,
// author, license, licenseUrl, sourceUrl and reviewedOn (YYYY-MM-DD).
// Never infers a food match or changes nutritional data.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const catalogFile=path.join(root,'lib/nutrition/photo-catalog.json');
const data=JSON.parse(await fs.readFile(path.join(root,'lib/nutrition/ciqual-2025.json'),'utf8'));
const byId=new Map(data.foods.map(f=>['ciqual:'+f.id,f]));
const allowed=new Set(['CC0','Public domain','CC BY 2.0','CC BY 2.5','CC BY 3.0','CC BY 4.0','CC BY-SA 2.0','CC BY-SA 2.5','CC BY-SA 3.0','CC BY-SA 4.0','GFDL 1.2']);
if(!process.argv[2])throw Error('Supply an explicitly reviewed JSON plan');
const approved=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
const existing=JSON.parse(await fs.readFile(catalogFile,'utf8'));
const ids=new Set(existing.map(p=>p.foodId));
const paths=new Set(existing.map(p=>p.src));
const ready=[];
// Validate the entire batch before writing. Never overwrite an existing asset.
for(const entry of approved){
 const {inputFile,...p}=entry;
 if(ids.has(p.foodId)||paths.has(p.src))throw Error('Duplicate association or asset');
 if(!byId.has(p.foodId)||byId.get(p.foodId).nom!==p.expectedName)throw Error('Ciqual identifier/name mismatch');
 if(!/^\/foods\/ciqual-[0-9]+\.jpg$/.test(p.src))throw Error('Unsafe asset path');
 if(!p.author?.trim()||/[<>]/.test(p.author)||!allowed.has(p.license))throw Error('Missing attribution or unsupported license');
 if(!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(p.sourceUrl))throw Error('Commons source required');
 const expectedLicense=p.license==='Public domain'?p.sourceUrl:p.license==='CC0'?'https://creativecommons.org/publicdomain/zero/1.0/':p.license==='GFDL 1.2'?'https://www.gnu.org/licenses/old-licenses/fdl-1.2.html':`https://creativecommons.org/licenses/${p.license.includes('BY-SA')?'by-sa':'by'}/${p.license.split(' ').at(-1)}/`;
 if(p.licenseUrl.replace(/\/$/,'')!==expectedLicense.replace(/\/$/,''))throw Error('License link mismatch');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(p.reviewedOn))throw Error('Visual review date required');
 const bytes=await fs.readFile(inputFile);
 if(bytes.length<4||bytes.readUInt16BE(0)!==0xffd8||bytes.length>48000)throw Error('Expected a JPEG thumbnail under 48 KB');
 const target=path.join(root,'public',p.src);
 try{await fs.access(target);throw Error('Asset already exists');}catch(e){if(e.code!=='ENOENT')throw e;}
 ids.add(p.foodId);paths.add(p.src);
 ready.push({target,bytes,photo:{...p,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}});
}
for(const item of ready)await fs.writeFile(item.target,item.bytes,{flag:'wx'});
const photos=[...existing,...ready.map(x=>x.photo)];
await fs.writeFile(catalogFile,JSON.stringify(photos,null,2)+'\n');
const credits=`# Photographies du calculateur\n\n${photos.length} références Ciqual possèdent une photographie explicitement vérifiée. Vignettes Wikimedia Commons (250 pixels au plus en largeur), servies localement, sans retouche locale. Chargement différé ; aucune requête à Wikimedia pendant la consultation. Les photographies illustrent les aliments, jamais une portion pesée. Les fruits entiers peuvent illustrer la partie comestible décrite par Ciqual. Aucun autre état de cuisson ni aliment voisin ne reçoit automatiquement leur photographie.\n\nChaque fichier conserve sa licence propre. Les mentions « Public domain » reprennent le statut documenté sur la page source, sans les transformer en CC0. Les images GFDL sont réutilisées sous GFDL 1.2, sans sections invariantes ni textes de couverture ; une [copie intégrale de la licence](LICENSE-GFDL-1.2.txt) accompagne les fichiers et les originaux sont accessibles par les liens ci-dessous. Les licences des images ne modifient pas celle du code ou des données Ciqual. Aucune affiliation ou validation des photographes n'est revendiquée.\n\n| Fichier | Référence et libellé vérifiés | Auteur | Licence | Source originale |\n|---|---|---|---|---|\n${photos.map(p=>`| ${p.src.split('/').at(-1)} | ${p.foodId} — ${p.expectedName.replaceAll('|','\\|')} | ${p.author.replaceAll('|','\\|')} | [${p.license}](${p.licenseUrl}) | [Original](${p.sourceUrl.replaceAll(' ','%20')}) |`).join('\n')}\n\nLe manifeste lib/nutrition/photo-catalog.json contient aussi les empreintes SHA-256, tailles des fichiers et dates de vérification. Pour poursuivre l'enrichissement, suivre docs/FOOD_PHOTOS.md.\n`;
await fs.writeFile(path.join(root,'public/foods/CREDITS.md'),credits);
console.log(`Imported ${ready.length}; total ${existing.length+ready.length} explicitly reviewed food photographs.`);
