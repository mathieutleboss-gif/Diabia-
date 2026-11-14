import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),assets={};
const types={'.csv':'text/csv;charset=utf-8','.html':'text/html;charset=utf-8','.js':'application/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.json':'application/json;charset=utf-8','.txt':'text/plain;charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon','.png':'image/png','.woff2':'font/woff2','.jpg':'image/jpeg','.webp':'image/webp'};
async function walk(dir){for(const f of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,f.name);if(f.isDirectory())await walk(file);else{const key='/'+path.relative(path.join(root,'out'),file).split(path.sep).join('/');assets[key]={type:types[path.extname(file)]||'application/octet-stream',body:(await readFile(file)).toString('base64')};}}}
await walk(path.join(root,'out'));
if(!assets['/index.html']||!assets['/account/index.html'])throw new Error('Export statique incomplet');
const manifest=JSON.parse(await readFile('.openai/hosting.json','utf8'));
if(manifest.static)throw new Error('La publication avec session doit utiliser le Worker, sans static.directory');
await mkdir('dist/server',{recursive:true});
const handler=await readFile('worker/handler.mjs','utf8');
await writeFile('dist/server/index.js',`${handler}\nconst embeddedAssets=${JSON.stringify(assets)};\nexport default createHandler(embeddedAssets);\n`);
console.log(`Worker généré : ${Object.keys(assets).length} ressources, identité fournie par Sites.`);
