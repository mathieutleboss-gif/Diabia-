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
 global.fetch=async(url,options)=>{if(String(url).endsWith('/rpc/diabia_session_active'))return Response.json(true);calls++;assert.ok(String(url).endsWith('/auth/v1/token?grant_type=password'));assert.equal(JSON.parse(options.body).email,'a@example.test');return Response.json({access_token:'access-secret',refresh_token:'refresh-secret',expires_in:3600});};
 try{const r=await cloudRoute(request('/api/auth/login','POST',{email:'a@example.test',password:'a long password 123'}),env);assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true});const cookies=r.headers.getSetCookie();assert.equal(cookies.length,2);for(const c of cookies){assert.match(c,/HttpOnly/);assert.match(c,/Secure/);assert.match(c,/SameSite=Lax/);}assert.equal(calls,1);}finally{global.fetch=original;}
});
test('la lecture distante utilise l’identité vérifiée et ne suit jamais un user_id du navigateur',async()=>{
 const original=global.fetch;
 global.fetch=async(url)=>{if(String(url).endsWith('/rpc/diabia_session_active'))return Response.json(true);if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'verified-A',email:'a@example.test'});assert.match(String(url),/user_id=eq.verified-A/);assert.ok(!String(url).includes('victim'));return Response.json([{revision:3,payload:null}]);};
 try{const r=await cloudRoute(request('/api/sync?user_id=victim','GET',undefined,{cookie:'__Host-diabia-access=token','X-Diabia-Account':'verified-A'}),env);assert.equal(r.status,200);assert.equal((await r.json()).revision,3);}finally{global.fetch=original;}
});
test('un conflit de révision n’est pas remplacé par une réussite et les tokens ne sont pas exposés',async()=>{
 const original=global.fetch;
 global.fetch=async(url,options)=>{if(String(url).endsWith('/rpc/diabia_session_active'))return Response.json(true);if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'A',email:'a@example.test'});assert.ok(String(url).includes('/rpc/diabia_sync_write'));const b=JSON.parse(options.body);assert.equal(b.expected_revision,2);assert.equal(b.user_id,undefined);return Response.json({conflict:true});};
 try{const r=await cloudRoute(request('/api/sync','PUT',{revision:2,payload:{version:3,mesures:[],injections:[],journal:[],profil:{}}},{cookie:'__Host-diabia-access=token','X-Diabia-Account':'A'}),env);assert.equal(r.status,409);assert.equal((await r.json()).conflict,true);}finally{global.fetch=original;}
});
test('les mots de passe trop courts sont refusés avant tout appel',async()=>{
 const original=global.fetch;global.fetch=async()=>{throw new Error('aucun réseau attendu');};try{assert.equal((await cloudRoute(request('/api/auth/signup','POST',{email:'a@example.test',password:'short'}),env)).status,400);}finally{global.fetch=original;}
});

test('le test fictif reste séparé du stockage médical et exige une connexion',async()=>{
 const testEnv={...env,DIABIA_REMOTE_HEALTH_APPROVED:'false',DIABIA_SYNC_TEST_ENABLED:'true'};
 assert.equal((await cloudRoute(request('/api/sync-test'),env)).status,503);
 assert.equal((await cloudRoute(request('/api/sync-test'),testEnv)).status,401);
 assert.equal((await cloudRoute(request('/api/sync'),testEnv)).status,503);
 assert.equal((await cloudRoute(request('/api/sync-test','POST',{revision:0},{origin:'https://evil.example.test'}),testEnv)).status,403);
});
test('le test rejette tout payload personnel avant un appel de stockage',async()=>{
 const original=global.fetch;let calls=0;
 global.fetch=async(url)=>{if(String(url).endsWith('/rpc/diabia_session_active'))return Response.json(true);calls++;assert.ok(String(url).endsWith('/auth/v1/user'));return Response.json({id:'test-A',email:'a@example.test'});};
 try{const r=await cloudRoute(request('/api/sync-test','POST',{revision:0,payload:{profil:{nom:'Personne'}}},{cookie:'__Host-diabia-access=token','X-Diabia-Account':'test-A'}),{...env,DIABIA_SYNC_TEST_ENABLED:'true'});assert.equal(r.status,400);assert.equal(calls,1);}finally{global.fetch=original;}
});
test('deux sessions du même compte retrouvent le même test fixe, une autre identité reste isolée',async()=>{
 const original=global.fetch;const rows=new Map();const testEnv={...env,DIABIA_REMOTE_HEALTH_APPROVED:'false',DIABIA_SYNC_TEST_ENABLED:'true'};
 global.fetch=async(url,options)=>{if(String(url).endsWith('/rpc/diabia_session_active'))return Response.json(true);
  const token=options.headers.Authorization;const id=token==='Bearer device-B'?'other-user':'same-user';
  if(String(url).endsWith('/auth/v1/user'))return Response.json({id,email:id+'@example.test'});
  if(String(url).includes('/rpc/diabia_sync_test_write')){assert.deepEqual(JSON.parse(options.body),{expected_revision:0});rows.set(id,{revision:1,updated_at:'2026-11-14T12:00:00Z'});return Response.json(rows.get(id));}
  assert.ok(String(url).includes('/diabia_sync_tests?user_id=eq.'+id));return Response.json(rows.has(id)?[rows.get(id)]:[]);
 };
 try{const write=await cloudRoute(request('/api/sync-test','POST',{revision:0},{cookie:'__Host-diabia-access=device-A1','X-Diabia-Account':'same-user'}),testEnv);const saved=await write.json();assert.equal(write.status,200);assert.deepEqual(saved.example,{fictif:true,glycemieMgDl:112,insulineUnites:4});const read=await cloudRoute(request('/api/sync-test','GET',undefined,{cookie:'__Host-diabia-access=device-A2','X-Diabia-Account':'same-user'}),testEnv);assert.deepEqual(await read.json(),saved);const other=await cloudRoute(request('/api/sync-test','GET',undefined,{cookie:'__Host-diabia-access=device-B','X-Diabia-Account':'other-user'}),testEnv);assert.deepEqual(await other.json(),{revision:0,example:null});}finally{global.fetch=original;}
});
test('deux écritures concurrentes du test renvoient un conflit explicite',async()=>{
 const original=global.fetch;global.fetch=async url=>String(url).endsWith('/rpc/diabia_session_active')?Response.json(true):String(url).endsWith('/auth/v1/user')?Response.json({id:'A',email:'a@example.test'}):Response.json({conflict:true});
 try{assert.equal((await cloudRoute(request('/api/sync-test','POST',{revision:1},{cookie:'__Host-diabia-access=token','X-Diabia-Account':'A'}),{...env,DIABIA_SYNC_TEST_ENABLED:'true'})).status,409);}finally{global.fetch=original;}
});

test('une session révoquée est refusée même si son jeton identifie encore un utilisateur',async()=>{
 const original=global.fetch;global.fetch=async url=>String(url).endsWith('/auth/v1/user')?Response.json({id:'A',email:'a@example.test'}):Response.json(false);
 try{assert.equal((await cloudRoute(request('/api/cloud/session','GET',undefined,{cookie:'__Host-diabia-access=still-signed-token'}),env)).status,401);}finally{global.fetch=original;}
});
test('l’export ne lit que les enregistrements du compte vérifié et reste disponible sans synchronisation médicale',async()=>{
 const original=global.fetch;global.fetch=async url=>{
 if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'owner-A',email:'a@example.test'});
 if(String(url).endsWith('/rpc/diabia_session_active'))return Response.json(true);
 assert.ok(String(url).includes('user_id=eq.owner-A'));assert.ok(!String(url).includes('victim'));return Response.json([]);
 };try{const r=await cloudRoute(request('/api/account/export?user_id=victim','GET',undefined,{cookie:'__Host-diabia-access=token','X-Diabia-Account':'owner-A'}),{...env,DIABIA_REMOTE_HEALTH_APPROVED:'false'});assert.equal(r.status,200);assert.match(r.headers.get('Content-Disposition'),/attachment/);const d=await r.json();assert.deepEqual(d.remoteSnapshots,[]);assert.deepEqual(d.syncTests,[]);assert.equal(d.account.id,'owner-A');}finally{global.fetch=original;}
});
test('la suppression exige la confirmation et ne considère que la réponse confirmée du service',async()=>{
 const original=global.fetch;let deletions=0;global.fetch=async(url,options)=>{
 if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'A',email:'a@example.test'});
 if(String(url).endsWith('/rpc/diabia_session_active'))return Response.json(true);
 assert.ok(String(url).includes('/functions/v1/diabia-account-delete'));assert.deepEqual(Object.keys(JSON.parse(options.body)).sort(),['confirmation','password']);deletions++;return Response.json({deleted:true});
 };const e={...env,DIABIA_ACCOUNT_DELETE_ENABLED:'true'};const h={cookie:'__Host-diabia-access=token','X-Diabia-Account':'A'};
 try{assert.equal((await cloudRoute(request('/api/account/delete','POST',{password:'test',confirmation:'non'},h),e)).status,400);assert.equal(deletions,0);const r=await cloudRoute(request('/api/account/delete','POST',{password:'test',confirmation:'SUPPRIMER'},h),e);assert.equal(r.status,200);assert.equal((await r.json()).deleted,true);assert.ok(r.headers.getSetCookie().every(c=>c.includes('Max-Age=0')));}finally{global.fetch=original;}
});

test('l’assistant hébergé reste désactivé sans clé gratuite et refuse les rapports personnels',async()=>{
 const original=global.fetch;global.fetch=async()=>{throw Error('aucun réseau attendu');};try{
 assert.equal((await(await cloudRoute(request('/api/assistant'),env)).json()).disponible,false);
 assert.equal((await cloudRoute(request('/api/assistant','POST',{questionId:'moyenne'}),env)).status,503);
 assert.equal((await cloudRoute(request('/api/assistant','POST',{questionId:'moyenne',rapport:{note:'privée'}}),env)).status,400);
 }finally{global.fetch=original;}
});
test('l’assistant réserve le quota avant Groq et aucun appel ne part quand le plafond est atteint',async()=>{
 const original=global.fetch;const e={...env,ASSISTANT_FREE_PLAN_CONFIRMED:'true',GROQ_API_KEY:'fake',UPSTASH_REDIS_REST_URL:'https://redis.invalid',UPSTASH_REDIS_REST_TOKEN:'fake',GROQ_QUOTA_RPM:'10',GROQ_QUOTA_RPD:'100',GROQ_QUOTA_TPM:'51200',GROQ_QUOTA_TPD:'512000'};
 const calls=[];global.fetch=async(url,options)=>{
 if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'A',email:'a@example.test'});
 if(String(url).endsWith('/rpc/diabia_session_active'))return Response.json(true);
 calls.push(String(url));assert.equal(String(url),'https://redis.invalid');const d=JSON.parse(options.body);assert.equal(d[0],'EVAL');assert.deepEqual(d.slice(-5,-1),[8,80,2,10]);return Response.json({result:[0,60]});
 };try{const r=await cloudRoute(request('/api/assistant','POST',{questionId:'moyenne'},{cookie:'__Host-diabia-access=token','X-Diabia-Account':'A'}),e);assert.equal(r.status,429);assert.equal(calls.length,1);}finally{global.fetch=original;}
});

test('seule une question fictive part vers Groq après la réservation, sans identifiant de compte ni rapport',async()=>{
 const original=global.fetch;const e={...env,ASSISTANT_FREE_PLAN_CONFIRMED:'true',GROQ_API_KEY:'fake',UPSTASH_REDIS_REST_URL:'https://redis.invalid',UPSTASH_REDIS_REST_TOKEN:'fake',GROQ_QUOTA_RPM:'10',GROQ_QUOTA_RPD:'100',GROQ_QUOTA_TPM:'51200',GROQ_QUOTA_TPD:'512000'};let reserved=false,calls=0;
 global.fetch=async(url,options)=>{
 if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'sensitive-account-id',email:'private@example.test'});
 if(String(url).endsWith('/rpc/diabia_session_active'))return Response.json(true);
 if(String(url)==='https://redis.invalid'){reserved=true;return Response.json({result:[1,0]});}
 assert.equal(String(url),'https://api.groq.com/openai/v1/chat/completions');assert.equal(reserved,true);calls++;const data=JSON.parse(options.body);assert.equal(data.max_tokens,600);assert.match(data.messages[1].content,/80, 100, 120/);assert.ok(!options.body.includes('sensitive-account-id')&&!options.body.includes('private@example.test'));return Response.json({choices:[{message:{content:'La moyenne fictive est 100.'}}]});
 };try{const r=await cloudRoute(request('/api/assistant','POST',{questionId:'moyenne'},{cookie:'__Host-diabia-access=token','X-Diabia-Account':'A'}),e);assert.equal(r.status,200);assert.equal(calls,1);}finally{global.fetch=original;}
});
