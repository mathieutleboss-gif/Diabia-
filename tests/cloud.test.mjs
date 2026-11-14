import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudRoute} from '../worker/diabia-cloud.mjs';
const env={DIABIA_SUPABASE_URL:'https://provider.example.test',DIABIA_SUPABASE_KEY:'public-test-key',DIABIA_REMOTE_HEALTH_APPROVED:'true'};
function request(path,method='GET',data,headers={}){return new Request('https://diabia.example.test'+path,{method,headers:{...(method!=='GET'?{origin:'https://diabia.example.test','content-type':'application/json'}:{}),...headers},...(data?{body:JSON.stringify(data)}:{})});}
test('aucun compte ni stockage distant actif sans configuration et approbation',async()=>{
 assert.deepEqual(await(await cloudRoute(request('/api/auth/config'),{})).json(),{available:false,syncAvailable:false});
 assert.equal((await cloudRoute(request('/api/auth/login','POST',{email:'a@example.test',password:'test'}),{})).status,503);
 assert.equal((await cloudRoute(request('/api/sync'),{...env,DIABIA_REMOTE_HEALTH_APPROVED:'false'})).status,503);
});
test('les requêtes d’une autre origine et les en-têtes utilisateur falsifiés sont refusés',async()=>{
 assert.equal((await cloudRoute(request('/api/auth/login','POST',{}, {origin:'https://evil.example.test'}),env)).status,403);
 assert.equal((await cloudRoute(request('/api/cloud/session','GET',undefined,{'oai-authenticated-user-id':'someone'}),env)).status,401);
});
test('le fournisseur vérifie le mot de passe et les jetons restent dans des cookies HttpOnly',async()=>{
 const original=global.fetch;let calls=0;
 global.fetch=async(url,options)=>{calls++;assert.ok(String(url).endsWith('/auth/v1/token?grant_type=password'));assert.equal(JSON.parse(options.body).email,'a@example.test');return Response.json({access_token:'access-secret',refresh_token:'refresh-secret',expires_in:3600});};
 try{const r=await cloudRoute(request('/api/auth/login','POST',{email:'a@example.test',password:'a long password 123'}),env);assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true});const cookies=r.headers.getSetCookie();assert.equal(cookies.length,2);for(const c of cookies){assert.match(c,/HttpOnly/);assert.match(c,/Secure/);assert.match(c,/SameSite=Lax/);}assert.equal(calls,1);}finally{global.fetch=original;}
});
test('la lecture distante utilise l’identité vérifiée et ne suit jamais un user_id du navigateur',async()=>{
 const original=global.fetch;
 global.fetch=async(url)=>{if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'verified-A',email:'a@example.test'});assert.match(String(url),/user_id=eq.verified-A/);assert.ok(!String(url).includes('victim'));return Response.json([{revision:3,payload:null}]);};
 try{const r=await cloudRoute(request('/api/sync?user_id=victim','GET',undefined,{cookie:'__Host-diabia-access=token'}),env);assert.equal(r.status,200);assert.equal((await r.json()).revision,3);}finally{global.fetch=original;}
});
test('un conflit de révision n’est pas remplacé par une réussite et les tokens ne sont pas exposés',async()=>{
 const original=global.fetch;
 global.fetch=async(url,options)=>{if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'A',email:'a@example.test'});assert.ok(String(url).includes('/rpc/diabia_sync_write'));const b=JSON.parse(options.body);assert.equal(b.expected_revision,2);assert.equal(b.user_id,undefined);return Response.json({conflict:true});};
 try{const r=await cloudRoute(request('/api/sync','PUT',{revision:2,payload:{version:3,mesures:[],injections:[],journal:[],profil:{}}},{cookie:'__Host-diabia-access=token'}),env);assert.equal(r.status,409);assert.equal((await r.json()).conflict,true);}finally{global.fetch=original;}
});
test('les mots de passe trop courts sont refusés avant tout appel',async()=>{
 const original=global.fetch;global.fetch=async()=>{throw new Error('aucun réseau attendu');};try{assert.equal((await cloudRoute(request('/api/auth/signup','POST',{email:'a@example.test',password:'short'}),env)).status,400);}finally{global.fetch=original;}
});
