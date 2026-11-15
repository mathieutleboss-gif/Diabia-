import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudRoute} from '../worker/diabia-cloud.mjs';
const env={DIABIA_SUPABASE_URL:'https://auth.example.test',DIABIA_SUPABASE_KEY:'test-publishable',DIABIA_PUBLIC_APP_URL:'https://diabia.example.test'};
const origin='https://diabia.example.test';
const password='a-new-fictional-password';
const hash='synthetic-recovery-proof-00001';
function req(path,data,cookie='',requestOrigin=origin){return new Request(origin+path,{method:'POST',headers:{origin:requestOrigin,'content-type':'application/json',cookie},body:JSON.stringify(data)});}
test('la demande utilise la page dédiée et une réponse neutre sans divulguer le compte',async()=>{
 const original=global.fetch;global.fetch=async(url,options)=>{assert.equal(new URL(url).searchParams.get('redirect_to'),origin+'/account/reset-password/');assert.ok(JSON.parse(options.body).code_challenge);return Response.json({});};
 try{const r=await cloudRoute(req('/api/auth/recover',{email:'fictif@example.test'}),env);assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true,confirmationRequired:true,recovery:true});assert.ok(r.headers.getSetCookie().some(c=>c.includes('diabia-flow=recovery')&&c.includes('HttpOnly')));}finally{global.fetch=original;}
});
test('un code de récupération ancien n’est pas consommé par la page callback',async()=>{
 const original=global.fetch;global.fetch=async()=>{throw Error('pas de réseau');};try{const r=await cloudRoute(req('/api/auth/exchange',{code:'fictif'},'__Host-diabia-pkce=verifier; __Host-diabia-flow=recovery'),env);assert.equal(r.status,200);assert.equal((await r.json()).recovery,true);assert.equal(r.headers.getSetCookie().length,0);}finally{global.fetch=original;}
});
test('un hôte interne localhost ou un en-tête proxy ne devient jamais la destination email',async()=>{
 const original=global.fetch;let calls=0;global.fetch=async url=>{calls++;assert.equal(new URL(url).searchParams.get('redirect_to'),'https://diabia-demo.validpika65.chatgpt.site/account/reset-password/');return Response.json({});};
 try{const e={...env};delete e.DIABIA_PUBLIC_APP_URL;const request=new Request('http://localhost:3000/api/auth/recover',{method:'POST',headers:{origin:'http://localhost:3000','content-type':'application/json','x-forwarded-host':'evil.example.test'},body:JSON.stringify({email:'fictif@example.test'})});assert.equal((await cloudRoute(request,e)).status,200);assert.equal(calls,1);}finally{global.fetch=original;}
});
test('une URL email locale ou mal formée bloque l’envoi au lieu de générer un mauvais lien',async()=>{
 const original=global.fetch;let calls=0;global.fetch=async()=>{calls++;throw Error();};try{for(const url of ['http://localhost:3000','https://localhost','https://127.0.0.1','https://diabia.example.test/path','https://user:pass@example.test','not-a-url'])assert.equal((await cloudRoute(req('/api/auth/recover',{email:'fictif@example.test'}),{...env,DIABIA_PUBLIC_APP_URL:url})).status,503);assert.equal(calls,0);}finally{global.fetch=original;}
});
test('une adresse inconnue reçoit la même réponse neutre',async()=>{
 const original=global.fetch;try{for(const status of [200,400,404,422]){global.fetch=async()=>Response.json({}, {status});const r=await cloudRoute(req('/api/auth/recover',{email:'fictif@example.test'}),env);assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true,confirmationRequired:true,recovery:true});}}finally{global.fetch=original;}
});
test('le flow inscription ne suffit pas pour réinitialiser par PKCE',async()=>{
 const original=global.fetch;global.fetch=async()=>{throw Error('aucun réseau attendu');};try{const r=await cloudRoute(req('/api/auth/password',{password,confirmation:password,code:'synthetic'},'__Host-diabia-pkce=synthetic; __Host-diabia-flow=signup'),env);assert.equal(r.status,400);}finally{global.fetch=original;}
});
test('mot de passe et confirmation sans preuve, même connecté, sont refusés',async()=>{
 const original=global.fetch;let calls=0;global.fetch=async()=>{calls++;throw Error();};try{for(const d of [{password,confirmation:password},{password,confirmation:'autre',token_hash:hash},{password,confirmation:password,code:'code'},{password,confirmation:password,token_hash:hash,user_id:'autre'}])assert.equal((await cloudRoute(req('/api/auth/password',d,'__Host-diabia-access=unrelated-login'),env)).status,400);assert.equal(calls,0);assert.equal((await cloudRoute(req('/api/auth/password',{password,confirmation:password,token_hash:hash},'','https://evil.example.test'),env)).status,403);}finally{global.fetch=original;}
});
test('une preuve expirée ou utilisée n’entraîne aucune mise à jour du mot de passe',async()=>{
 const original=global.fetch;let calls=0;global.fetch=async url=>{calls++;assert.ok(String(url).endsWith('/verify'));return Response.json({error:'expired'},{status:403});};try{const r=await cloudRoute(req('/api/auth/password',{password,confirmation:password,token_hash:hash}),env);assert.equal(r.status,400);assert.match((await r.json()).error,/expiré/);assert.equal(calls,1);}finally{global.fetch=original;}
});
for(const flow of ['hash','pkce'])test(`récupération ${flow} : seul le compte de la preuve est modifié puis les sessions sont fermées`,async()=>{
 const original=global.fetch;let changed=false,revoked=false;
 global.fetch=async(url,options)=>{
  if(String(url).endsWith('/verify')||String(url).includes('grant_type=pkce')){const d=JSON.parse(options.body);assert.deepEqual(d,flow==='hash'?{token_hash:hash,type:'recovery'}:{auth_code:'synthetic-code',code_verifier:'synthetic-verifier'});return Response.json({access_token:'verified-recovery-token'});}
  assert.equal(options.headers.Authorization,'Bearer verified-recovery-token');
  if(options.method==='GET')return Response.json({id:'account-from-recovery-link'});
  if(options.method==='PUT'){assert.deepEqual(JSON.parse(options.body),{password});changed=true;return Response.json({id:'account-from-recovery-link'});}
  assert.ok(String(url).endsWith('/logout?scope=global'));assert.equal(changed,true);revoked=true;return new Response(null,{status:204});
 };
 try{const d={password,confirmation:password,...(flow==='hash'?{token_hash:hash}:{code:'synthetic-code'})};const r=await cloudRoute(req('/api/auth/password',d,'__Host-diabia-access=another-account; __Host-diabia-pkce=synthetic-verifier; __Host-diabia-flow=recovery'),env);assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true});assert.ok(changed&&revoked);assert.ok(r.headers.getSetCookie().every(c=>c.includes('Max-Age=0')));}finally{global.fetch=original;}
});
