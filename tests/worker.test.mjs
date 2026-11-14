import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler,sessionUtilisateur} from '../worker/handler.mjs';
const assets={'/index.html':{type:'text/html',body:btoa('<h1>Accueil</h1>')},'/account/index.html':{type:'text/html',body:btoa('Compte')},'/404.html':{type:'text/html',body:btoa('Absent')}};
test('la session requiert une identité serveur complète et ne se met pas en cache',async()=>{
 const app=createHandler(assets);let r=await app.fetch(new Request('https://site.test/api/session'));assert.equal(r.status,401);assert.equal(r.headers.get('Cache-Control'),'private, no-store');
 r=await app.fetch(new Request('https://site.test/api/session',{headers:{'oai-authenticated-user-id':'A','oai-authenticated-user-email':'exemple@example.test','oai-authenticated-user-full-name':'Pr%C3%A9nom','oai-authenticated-user-full-name-encoding':'percent-encoded-utf-8'}}));assert.equal(r.status,200);assert.equal((await r.json()).user.name,'Prénom');
 assert.equal(sessionUtilisateur(new Request('https://site.test/',{headers:{'oai-authenticated-user-id':'A'}})),null);
 assert.equal((await app.fetch(new Request('https://site.test/api/session',{method:'POST'}))).status,405);
});
test('les ressources exactes, redirections et erreurs sont servies sans fallback trompeur',async()=>{
 const app=createHandler(assets);assert.equal(await (await app.fetch(new Request('https://site.test/'))).text(),'<h1>Accueil</h1>');
 const redirect=await app.fetch(new Request('https://site.test/account'));assert.equal(redirect.status,308);assert.equal(redirect.headers.get('location'),'https://site.test/account/');
 assert.equal((await app.fetch(new Request('https://site.test/absent'))).status,404);assert.equal((await app.fetch(new Request('https://site.test/account/',{method:'HEAD'}))).body,null);assert.equal((await app.fetch(new Request('https://site.test/api/assistant'))).status,503);
});
