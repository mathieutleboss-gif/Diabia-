import {rename,mkdir,rm,stat} from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),api=path.join(root,'app/api'),scratch=path.join(root,'.sites-build'),hidden=path.join(scratch,'api'),tests=path.join(root,'tests');
try {await stat(scratch);throw new Error('Récupérer les fichiers de .sites-build avant de construire. Aucun fichier n’a été supprimé.');} catch(e){if(e.code!=='ENOENT')throw e;}
let moved=false,testsMoved=false;
try {
  try {await stat(api);await mkdir(scratch);await rename(api,hidden);moved=true;} catch(e){if(e.code!=='ENOENT')throw e;}
  // Les tests serveur restent dans la source, mais ne font pas partie de l'export navigateur.
  if(moved)try{await stat(tests);await rename(tests,path.join(scratch,'tests'));testsMoved=true;}catch(e){if(e.code!=='ENOENT')throw e;}
  const result=spawnSync(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'build'],{stdio:'inherit',env:{...process.env,DIABIA_SITE_EXPORT:'1'}});
  if(result.status!==0)throw new Error('Échec de la construction Next.js');
} finally {
  if(testsMoved)await rename(path.join(scratch,'tests'),tests);
  if(moved){await rename(hidden,api);await rm(scratch,{recursive:true,force:true});}
}
const result=spawnSync(process.execPath,[path.join(root,'scripts/build-worker.mjs')],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
