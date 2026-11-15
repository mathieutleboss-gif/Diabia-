import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudRoute} from '../worker/diabia-cloud.mjs';
const env={DIABIA_SUPABASE_URL:'https://auth.example.test',DIABIA_SUPABASE_KEY:'test-publishable',DIABIA_PUBLIC_APP_URL:'https://diabia.example.test'};
const origin='https://diabia.example.test';
const password='a-new-fictional-password';
const hash='synthetic-recovery-proof-00001';
function req(path,data,cookie='',requestOrigin=origin){return new Request(origin+path,{method:'POST',headers:{origin:requestOrigin,'content-type':'application/json',cookie},body:JSON.stringify(data)});}
test('la demande utilise la page dédiée et une réponse neutre sans divulguer le compte',async()=>{
 const original=global.fetch;global.fetch=async(url,options)=>{assert.equal(new URL(url).searchParams.get('redirect_to'),origin+'/account/reset-password/');assert.equal(JSON.parse(options.body).code_challenge,undefined);return Response.json({});};
 try{const r=await cloudRoute(req('/api/auth/recover',{email:'fictif@example.test'}),env);assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true,confirmationRequired:true,recovery:true});assert.equal(r.headers.getSetCookie().length,0);}finally{global.fetch=original;}
});
test('les inscriptions conservent PKCE et la confirmation email',async()=>{
 const original=global.fetch;global.fetch=async(url,options)=>{assert.equal(new URL(url).pathname,'/auth/v1/signup');assert.ok(JSON.parse(options.body).code_challenge);return Response.json({});};try{const r=await cloudRoute(req('/api/auth/signup',{email:'fictif@example.test',password}),env);assert.equal(r.status,200);assert.equal((await r.json()).confirmationRequired,true);assert.ok(r.headers.getSetCookie().some(c=>c.includes('diabia-flow=signup')));}finally{global.fetch=original;}
});
test('le quota email est distingué du délai court, sans inventer de Retry-After exact',async()=>{
 const original=global.fetch;try{for(const code of ['over_email_send_rate_limit','over_request_rate_limit']){global.fetch=async()=>Response.json({code},{status:429});const r=await cloudRoute(req('/api/auth/recover',{email:'fictif@example.test'}),env);assert.equal(r.status,429);const d=await r.json();assert.equal(d.retryAfterSeconds,code==='over_email_send_rate_limit'?3600:60);assert.equal(d.retryDelayEstimated,true);assert.equal(r.headers.get('Retry-After'),null);}
 global.fetch=async()=>Response.json({code:'over_email_send_rate_limit'},{status:429,headers:{'Retry-After':'123'}});const r=await cloudRoute(req('/api/auth/signup',{email:'fictif@example.test',password}),env);assert.equal(r.headers.get('Retry-After'),'123');assert.equal((await r.json()).retryDelayEstimated,false);
 }finally{global.fetch=original;}
});
const recoveryJWT=(changes={})=>{const now=Math.floor(Date.now()/1000);return 'header.'+Buffer.from(JSON.stringify({sub:'recovered-owner',iss:env.DIABIA_SUPABASE_URL+'/auth/v1',exp:now+3600,amr:[{method:'otp',timestamp:now}],...changes})).toString('base64url')+'.test-signature';};
for(const method of ['otp','recovery'])test('le lien fonctionne sans cookies PKCE avec méthode vérifiée '+method,async()=>{
 const original=global.fetch;const token=recoveryJWT({amr:[{method,timestamp:Math.floor(Date.now()/1000)}]});let updated=0,active=true;global.fetch=async(url,options)=>{assert.equal(options.headers.Authorization,'Bearer '+token);if(String(url).endsWith('/rpc/diabia_session_active'))return Response.json(active);if(options.method==='GET')return Response.json({id:'recovered-owner',email:'synthetic@example.test',email_confirmed_at:'2026-01-01T00:00:00Z'});if(options.method==='PUT'){updated++;assert.deepEqual(JSON.parse(options.body),{password});return Response.json({id:'recovered-owner'});}active=false;return new Response(null,{status:204});};
 try{const data={password,confirmation:password,recovery_access_token:token};assert.equal((await cloudRoute(req('/api/auth/password',data,'__Host-diabia-access=unrelated-account'),env)).status,200);assert.equal(updated,1);assert.equal((await cloudRoute(req('/api/auth/password',data),env)).status,400);assert.equal(updated,1);}finally{global.fetch=original;}
});
test('une session OTP ne contourne jamais une adresse email non confirmée',async()=>{
 const original=global.fetch;global.fetch=async(url,options)=>{assert.equal(options.method,'GET');return Response.json({id:'recovered-owner',email:'synthetic@example.test',email_confirmed_at:null});};try{assert.equal((await cloudRoute(req('/api/auth/password',{password,confirmation:password,recovery_access_token:recoveryJWT()}),env)).status,400);}finally{global.fetch=original;}
});
test('session ordinaire, preuve expirée, sujet différent ou signature refusée ne permettent pas de reset',async()=>{
 const original=global.fetch;let updates=0;try{for(const changes of [{amr:[{method:'password',timestamp:Date.now()/1000}]},{exp:1},{sub:'another-owner'},{iss:'https://other.example.test/auth/v1'},{amr:[{method:'recovery',timestamp:1}]}]){global.fetch=async(url,options)=>{if(options.method==='PUT')updates++;return Response.json({id:'recovered-owner',email:'synthetic@example.test',email_confirmed_at:'2026-01-01T00:00:00Z'});};const r=await cloudRoute(req('/api/auth/password',{password,confirmation:password,recovery_access_token:recoveryJWT(changes)}),env);assert.equal(r.status,400);}
 global.fetch=async(url,options)=>{assert.equal(options.method,'GET');return Response.json({error:'invalid signature'},{status:401});};assert.equal((await cloudRoute(req('/api/auth/password',{password,confirmation:password,recovery_access_token:recoveryJWT()}),env)).status,400);assert.equal(updates,0);
 }finally{global.fetch=original;}
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
