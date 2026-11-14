const H={"Content-Type":"application/json;charset=utf-8","Cache-Control":"private, no-store","Vary":"Cookie","X-Content-Type-Options":"nosniff"};
const AT='__Host-diabia-access',RT='__Host-diabia-refresh',PK='__Host-diabia-pkce',FLOW='__Host-diabia-flow';
function json(data,status=200,cookies=[]){const headers=new Headers(H);for(const c of cookies)headers.append('Set-Cookie',c);return new Response(JSON.stringify(data),{status,headers});}
function cookie(name,value,age){return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${age}; Secure; HttpOnly; SameSite=Lax`;}
function cookiesOf(request){return Object.fromEntries((request.headers.get('cookie')||'').split(';').flatMap(c=>{const i=c.indexOf('=');if(i<0)return[];try{return [[c.slice(0,i).trim(),decodeURIComponent(c.slice(i+1))]];}catch{return[];}}));}
function clear(){return[cookie(AT,'',0),cookie(RT,'',0),cookie(PK,'',0),cookie(FLOW,'',0)];}
function conf(env){if(!env?.DIABIA_SUPABASE_URL||!env?.DIABIA_SUPABASE_KEY)return null;try{const url=new URL(env.DIABIA_SUPABASE_URL);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)return null;return {url:url.origin,key:env.DIABIA_SUPABASE_KEY,sync:env.DIABIA_REMOTE_HEALTH_APPROVED==='true'};}catch{return null;}}
async function backend(c,path,{method='GET',body,token,timeout=12000}={}){return fetch(c.url+path,{method,headers:{apikey:c.key,...(token?{Authorization:`Bearer ${token}`}:{}) ,'Content-Type':'application/json'},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(timeout),cache:'no-store'});}
function tokens(data){if(typeof data.access_token!=='string'||typeof data.refresh_token!=='string')throw new Error('Session invalide');return [cookie(AT,data.access_token,Math.min(3600,Math.max(60,Number(data.expires_in)||3600))),cookie(RT,data.refresh_token,2592000)];}
async function verifiedSession(c,user,token,set){const r=await backend(c,'/rest/v1/rpc/diabia_session_active',{method:'POST',token,body:{}});if(!r.ok)throw new Error('Vérification de session indisponible');if(await r.json()!==true)return null;return{user:{id:user.id,email:user.email,name:typeof user.user_metadata?.name==='string'?user.user_metadata.name.slice(0,200):user.email},token,set};}
async function identity(request,c){const cs=cookiesOf(request);let token=cs[AT],set=[];
 if(token){const r=await backend(c,'/auth/v1/user',{token});if(r.ok){const u=await r.json();if(typeof u.id==='string'&&typeof u.email==='string')return verifiedSession(c,u,token,set);}else if(r.status>=500)throw new Error('Service indisponible');}
 if(cs[RT]){const r=await backend(c,'/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:cs[RT]}});if(r.ok){const data=await r.json();set=tokens(data);token=data.access_token;const check=await backend(c,'/auth/v1/user',{token});if(check.ok){const u=await check.json();if(typeof u.id==='string'&&typeof u.email==='string')return verifiedSession(c,u,token,set);}}else if(r.status>=500)throw new Error('Service indisponible');}
 return null;
}
async function body(request,max=16000){const reader=request.body?.getReader();if(!reader)throw new Error('Corps absent');const chunks=[];let size=0;while(true){const{value,done}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new Error('Requête trop volumineuse');}chunks.push(value);}const all=new Uint8Array(size);let offset=0;for(const v of chunks){all.set(v,offset);offset+=v.length;}const data=JSON.parse(new TextDecoder().decode(all));if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Format invalide');return data;}
function email(value){return typeof value==='string'&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);}
function password(value){return typeof value==='string'&&value.length>=12&&value.length<=256;}
function b64(bytes){return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
async function challenge(){const verifier=b64(crypto.getRandomValues(new Uint8Array(32)));const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));return{verifier,challenge:b64(new Uint8Array(hash))};}
function validSnapshot(d){return d&&typeof d==='object'&&!Array.isArray(d)&&[1,2,3].includes(d.version)&&Array.isArray(d.mesures)&&Array.isArray(d.journal)&&(d.injections===undefined||Array.isArray(d.injections))&&d.profil&&typeof d.profil==='object'&&!Array.isArray(d.profil);}
const AI_QUESTIONS={moyenne:"Explique comment calculer une moyenne sur la série fictive 80, 100, 120, sans interprétation médicale.",dispersion:"Explique la dispersion de la série fictive 80, 100, 120, sans interprétation médicale.",limites:"Explique pourquoi trois valeurs fictives ne suffisent pas à conclure sur une tendance."};
const AI_SYSTEM="Réponds en français, en moins de 250 mots. Démonstration de statistiques sur des nombres fictifs sans unité. Aucun patient, aucun avis de santé, aucun diagnostic ni conseil de traitement. N'interprète jamais ces valeurs médicalement.";
const AI_QUOTA_SCRIPT=`
local nowParts = redis.call('TIME')
local now = tonumber(nowParts[1])*1000 + math.floor(tonumber(nowParts[2])/1000)
local windows = {60000,86400000,60000,86400000}
for i=1,4 do
  redis.call('ZREMRANGEBYSCORE',KEYS[i],'-inf',now-windows[i])
  if redis.call('ZCARD',KEYS[i]) >= tonumber(ARGV[i]) then
    local oldest = redis.call('ZRANGE',KEYS[i],0,0,'WITHSCORES')
    return {0,math.max(1,math.ceil((tonumber(oldest[2])+windows[i]-now)/1000))}
  end
end
for i=1,4 do
  redis.call('ZADD',KEYS[i],now,ARGV[5])
  redis.call('PEXPIRE',KEYS[i],windows[i]+1000)
end
return {1,0}
`;
function assistantConf(env){
 const positive=name=>{const n=Number(env[name]);if(!Number.isSafeInteger(n)||n<1)throw Error('Quota absent');return n;};
 if(env.ASSISTANT_FREE_PLAN_CONFIRMED!=='true'||!env.GROQ_API_KEY||!env.UPSTASH_REDIS_REST_TOKEN||!env.UPSTASH_REDIS_REST_URL?.startsWith('https://'))throw Error('Configuration absente');
 const rpm=Math.min(Math.max(1,Math.floor(positive('GROQ_QUOTA_RPM')*.8)),Math.floor(positive('GROQ_QUOTA_TPM')*.8/4096));
 const rpd=Math.min(Math.max(1,Math.floor(positive('GROQ_QUOTA_RPD')*.8)),Math.floor(positive('GROQ_QUOTA_TPD')*.8/4096));
 if(rpm<1||rpd<1)throw Error('Quota insuffisant');
 return {rpm,rpd,model:'llama-3.3-70b-versatile'};
}
async function assistantRoute(request,c,env){
 let config;try{config=assistantConf(env);}catch{}
 if(request.method==='GET')return json({disponible:!!config,fournisseur:'Groq',mode:'demo',limites:{parJour:10,parMinute:2}});
 if(request.method!=='POST')return json({error:'Méthode non autorisée.'},405);
 const d=await body(request,4096);
 if(Object.keys(d).length!==1||typeof d.questionId!=='string'||!Object.hasOwn(AI_QUESTIONS,d.questionId))return json({error:'Seules les questions fixes fictives sont acceptées. Aucun rapport ou donnée personnelle.'},400);
 if(!config)return json({error:'Assistant désactivé : clé gratuite et quotas non configurés.'},503);
 const session=await identity(request,c);if(!session)return json({error:'Connexion Diabia requise.'},401,clear());
 const hashed=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(session.user.id)))).map(v=>v.toString(16).padStart(2,'0')).join('');
 const prefix='diabia:{assistant}:';
 const keys=[prefix+'global:minute',prefix+'global:day',prefix+hashed+':minute',prefix+hashed+':day'];
 const quota=await fetch(env.UPSTASH_REDIS_REST_URL,{method:'POST',headers:{Authorization:'Bearer '+env.UPSTASH_REDIS_REST_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(['EVAL',AI_QUOTA_SCRIPT,'4',...keys,config.rpm,config.rpd,2,10,crypto.randomUUID()]),signal:AbortSignal.timeout(5000),cache:'no-store'});
 if(!quota.ok)return json({error:'Compteur indisponible : aucun appel IA effectué.'},503,session.set);
 const limit=await quota.json();if(limit.error||!Array.isArray(limit.result)||limit.result.length!==2||![0,1].includes(limit.result[0])||!Number.isFinite(limit.result[1]))return json({error:'Compteur invalide : aucun appel IA effectué.'},503,session.set);
 if(limit.result[0]===0){const r=json({error:'Limite de demandes atteinte. Réessaie plus tard.'},429,session.set);r.headers.set('Retry-After',String(Math.max(1,limit.result[1])));return r;}
 const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+env.GROQ_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:config.model,temperature:0.1,max_tokens:600,messages:[{role:'system',content:AI_SYSTEM},{role:'user',content:AI_QUESTIONS[d.questionId]}]}),signal:AbortSignal.timeout(30000),cache:'no-store'});
 if(!r.ok){const result=json({error:r.status===429?'Quota fournisseur atteint.':'Fournisseur temporairement indisponible.'},r.status===429?429:502,session.set);if(r.status===429)result.headers.set('Retry-After','60');return result;}
 const data=await r.json(),answer=data.choices?.[0]?.message?.content;
 return typeof answer==='string'&&answer.trim()?json({reponse:answer,mode:'demo'},200,session.set):json({error:'Réponse vide.'},502,session.set);
}

/** Aucun en-tête d'identité du navigateur n'est utilisé : le fournisseur vérifie le jeton. */
export async function cloudRoute(request,env){
 const url=new URL(request.url),p=url.pathname,c=conf(env);
 if(p==='/api/auth/config')return request.method==='GET'?json({available:!!c,syncAvailable:!!c?.sync}):json({error:'Méthode non autorisée'},405);
 if(!p.startsWith('/api/auth/')&&p!=='/api/cloud/session'&&p!=='/api/sync'&&p!=='/api/sync-test'&&p!=='/api/assistant'&&!p.startsWith('/api/account/'))return null;
 if(!c)return json({error:'Comptes Diabia en attente de configuration du service de connexion.'},503);
 if(request.method!=='GET'&&request.headers.get('origin')!==url.origin)return json({error:'Origine non autorisée.'},403);
 try{
  if(p==='/api/assistant')return await assistantRoute(request,c,env);
  if(p==='/api/account/export'||p==='/api/account/delete'){
   const exporting=p.endsWith('/export');if(request.method!==(exporting?'GET':'POST'))return json({error:'Méthode non autorisée.'},405);
   const session=await identity(request,c);if(!session)return json({error:'Connexion Diabia requise.'},401,clear());
   if(exporting){
    const path=`user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`;
    const [snapshot,test]=await Promise.all([backend(c,`/rest/v1/diabia_snapshots?${path}&select=revision,payload,updated_at`,{token:session.token}),backend(c,`/rest/v1/diabia_sync_tests?${path}&select=revision,updated_at`,{token:session.token})]);
    if(!snapshot.ok||!test.ok)return json({error:'Export distant incomplet : réessaie plus tard.'},503,session.set);
    const result=json({version:1,exportedAt:new Date().toISOString(),account:session.user,remoteSnapshots:await snapshot.json(),syncTests:await test.json()},200,session.set);
    result.headers.set('Content-Disposition','attachment; filename="diabia-compte.json"');return result;
   }
   if(env.DIABIA_ACCOUNT_DELETE_ENABLED!=='true')return json({error:'Suppression du compte en attente de configuration.'},503,session.set);
   const d=await body(request,2000);
   if(d.confirmation!=='SUPPRIMER'||typeof d.password!=='string'||!d.password||d.password.length>256||Object.keys(d).some(k=>!['password','confirmation'].includes(k)))return json({error:'Mot de passe et confirmation SUPPRIMER requis.'},400,session.set);
   const r=await backend(c,'/functions/v1/diabia-account-delete',{method:'POST',token:session.token,body:{password:d.password,confirmation:d.confirmation},timeout:30000});
   const result=await r.json();if(!r.ok)return json({error:result.error||'Suppression non confirmée.'},[400,401,413,429].includes(r.status)?r.status:503,result.sessionsClosed?clear():session.set);
   if(result.deleted!==true)return json({error:'Suppression non confirmée.'},503,session.set);
   return json({ok:true,deleted:true},200,clear());
  }
  if(p==='/api/auth/logout-all'&&request.method==='POST'){
   const session=await identity(request,c);if(!session)return json({error:'Connexion requise.'},401,clear());
   const r=await backend(c,'/auth/v1/logout?scope=global',{method:'POST',token:session.token});
   return r.ok?json({ok:true},200,clear()):json({error:'Déconnexion globale non confirmée. Réessaie plus tard.'},503,session.set);
  }
  if(p==='/api/sync-test'){
   if(env.DIABIA_SYNC_TEST_ENABLED!=='true')return json({error:'Le test de synchronisation n’est pas activé.'},503);
   if(request.method!=='GET'&&request.method!=='POST')return json({error:'Méthode non autorisée'},405);
   const s=await identity(request,c);if(!s)return json({error:'Connexion Diabia requise.'},401,clear());
   const example={fictif:true,glycemieMgDl:112,insulineUnites:4};
   if(request.method==='GET'){
    const r=await backend(c,`/rest/v1/diabia_sync_tests?user_id=eq.${encodeURIComponent(s.user.id)}&select=revision,updated_at&limit=1`,{token:s.token});
    if(!r.ok)return json({error:'Lecture du test indisponible.'},503,s.set);
    const rows=await r.json();return json(rows[0]?{...rows[0],example}:{revision:0,example:null},200,s.set);
   }
   const d=await body(request,1000);
   if(Object.keys(d).length!==1||!Number.isSafeInteger(d.revision)||d.revision<0)return json({error:'Seule la révision du test est acceptée. Aucun fichier ou donnée personnelle ne peut être sauvegardé ici.'},400,s.set);
   const r=await backend(c,'/rest/v1/rpc/diabia_sync_test_write',{method:'POST',token:s.token,body:{expected_revision:d.revision}});
   if(!r.ok)return json({error:'Enregistrement du test impossible.'},503,s.set);
   const data=await r.json();return data.conflict?json({error:'Un autre appareil a enregistré un test. Clique sur Actualiser le test avant de réessayer.'},409,s.set):json({...data,example},200,s.set);
  }
  if(p==='/api/cloud/session'){
   if(request.method!=='GET')return json({error:'Méthode non autorisée'},405);
   const session=await identity(request,c);return session?json({authenticated:true,user:session.user,provider:'diabia',syncAvailable:c.sync},200,session.set):json({authenticated:false,provider:'diabia'},401,clear());
  }
  if(p==='/api/auth/logout'&&request.method==='POST'){const s=await identity(request,c);if(s)await backend(c,'/auth/v1/logout?scope=local',{method:'POST',token:s.token});return json({ok:true},200,clear());}
  if(p==='/api/auth/login'&&request.method==='POST'){
   const d=await body(request);if(!email(d.email)||typeof d.password!=='string'||d.password.length>256)return json({error:'Adresse e-mail ou mot de passe invalide.'},400);
   const r=await backend(c,'/auth/v1/token?grant_type=password',{method:'POST',body:{email:d.email.trim(),password:d.password}});if(!r.ok)return json({error:r.status===429?'Trop de tentatives. Réessaie plus tard.':'Connexion impossible. Vérifie tes identifiants et la confirmation de ton adresse.'},r.status===429?429:401);
   const data=await r.json();return json({ok:true},200,tokens(data));
  }
  if((p==='/api/auth/signup'||p==='/api/auth/recover')&&request.method==='POST'){
   const d=await body(request);if(!email(d.email)||p.endsWith('signup')&&!password(d.password))return json({error:'Adresse e-mail valide et mot de passe d’au moins 12 caractères requis.'},400);
   const pk=await challenge(),redirect=`${url.origin}/account/callback/`,recover=p.endsWith('recover');
   const r=await backend(c,`/auth/v1/${recover?'recover':'signup'}?redirect_to=${encodeURIComponent(redirect)}`,{method:'POST',body:{email:d.email.trim(),...(!recover?{password:d.password}:{}),code_challenge:pk.challenge,code_challenge_method:'s256'}});
   if(!r.ok)return json({error:r.status===429?'Limite d’envoi atteinte. Réessaie plus tard.':'Le service n’a pas pu traiter la demande. Vérifie sa configuration.'},r.status===429?429:502);
   const data=await r.json();if(data.access_token)return json({ok:true,confirmationRequired:false},200,tokens(data));
   return json({ok:true,confirmationRequired:true,recovery:recover},200,[cookie(PK,pk.verifier,600),cookie(FLOW,recover?"recovery":"signup",600)]);
  }
  if(p==='/api/auth/exchange'&&request.method==='POST'){
   const d=await body(request),verifier=cookiesOf(request)[PK];if(typeof d.code!=='string'||d.code.length>2048||!verifier)return json({error:'Lien expiré ou ouvert dans un autre navigateur. Relance la demande.'},400);
   const r=await backend(c,'/auth/v1/token?grant_type=pkce',{method:'POST',body:{auth_code:d.code,code_verifier:verifier}});if(!r.ok)return json({error:'Lien invalide ou expiré. Relance la demande.'},400,[cookie(PK,'',0)]);
   return json({ok:true,recovery:cookiesOf(request)[FLOW]==='recovery'},200,[...tokens(await r.json()),cookie(PK,'',0),cookie(FLOW,'',0)]);
  }
  if(p==='/api/auth/password'&&request.method==='POST'){
   const s=await identity(request,c);if(!s)return json({error:'Connexion requise.'},401,clear());const d=await body(request);if(!password(d.password))return json({error:'Choisis au moins 12 caractères.'},400);
   const r=await backend(c,'/auth/v1/user',{method:'PUT',token:s.token,body:{password:d.password}});return r.ok?json({ok:true},200,s.set):json({error:'Modification impossible. Reconnecte-toi et réessaie.'},400,s.set);
  }
  if(p==='/api/sync'){
   if(!c.sync)return json({error:'Le stockage distant des données de santé n’est pas activé.'},503);
   const s=await identity(request,c);if(!s)return json({error:'Connexion Diabia requise.'},401,clear());
   if(request.method==='GET'){
    const r=await backend(c,`/rest/v1/diabia_snapshots?user_id=eq.${encodeURIComponent(s.user.id)}&select=revision,payload,updated_at&limit=1`,{token:s.token});if(!r.ok)return json({error:'Lecture distante indisponible.'},503,s.set);const rows=await r.json();const row=rows[0];return json(row?{...row,deleted:row.payload===null}:{revision:0,payload:null,deleted:false},200,s.set);
   }
   if(request.method!=='PUT'&&request.method!=='DELETE')return json({error:'Méthode non autorisée'},405);
   const d=await body(request,2100000);if(!Number.isSafeInteger(d.revision)||d.revision<0||request.method==='PUT'&&!validSnapshot(d.payload))return json({error:'Sauvegarde ou révision invalide.'},400,s.set);
   if(request.method==='PUT'&&new TextEncoder().encode(JSON.stringify(d.payload)).length>2000000)return json({error:'La sauvegarde dépasse 2 Mo. Aucune donnée distante n’a été remplacée.'},413,s.set);
   const r=await backend(c,'/rest/v1/rpc/diabia_sync_write',{method:'POST',token:s.token,body:{expected_revision:d.revision,new_payload:d.payload??null,erase:request.method==='DELETE'}});if(!r.ok)return json({error:'Enregistrement distant impossible.'},503,s.set);const data=await r.json();return data.conflict?json({error:'Un autre appareil a modifié les données. Récupère la version distante avant de continuer.',conflict:true},409,s.set):json(data,200,s.set);
  }
  return json({error:'Méthode ou route non autorisée.'},405);
 }catch{if(p==='/api/auth/logout')return json({ok:true,warning:'Déconnexion locale effectuée ; révocation distante non confirmée.'},200,clear());return json({error:'Service indisponible ou requête invalide. Aucune nouvelle tentative automatique.'},503);}
}
