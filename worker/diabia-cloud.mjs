const H={"Content-Type":"application/json;charset=utf-8","Cache-Control":"private, no-store","Vary":"Cookie","X-Content-Type-Options":"nosniff"};
const AT='__Host-diabia-access',RT='__Host-diabia-refresh',PK='__Host-diabia-pkce',FLOW='__Host-diabia-flow';
function json(data,status=200,cookies=[]){const headers=new Headers(H);for(const c of cookies)headers.append('Set-Cookie',c);return new Response(JSON.stringify(data),{status,headers});}
function cookie(name,value,age){return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${age}; Secure; HttpOnly; SameSite=Lax`;}
function cookiesOf(request){return Object.fromEntries((request.headers.get('cookie')||'').split(';').flatMap(c=>{const i=c.indexOf('=');if(i<0)return[];try{return [[c.slice(0,i).trim(),decodeURIComponent(c.slice(i+1))]];}catch{return[];}}));}
function clear(){return[cookie(AT,'',0),cookie(RT,'',0),cookie(PK,'',0),cookie(FLOW,'',0)];}
function conf(env){if(!env?.DIABIA_SUPABASE_URL||!env?.DIABIA_SUPABASE_KEY)return null;try{const url=new URL(env.DIABIA_SUPABASE_URL);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)return null;return {url:url.origin,key:env.DIABIA_SUPABASE_KEY,sync:env.DIABIA_REMOTE_HEALTH_APPROVED==='true'};}catch{return null;}}
async function backend(c,path,{method='GET',body,token}={}){return fetch(c.url+path,{method,headers:{apikey:c.key,...(token?{Authorization:`Bearer ${token}`}:{}) ,'Content-Type':'application/json'},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(12000),cache:'no-store'});}
function tokens(data){if(typeof data.access_token!=='string'||typeof data.refresh_token!=='string')throw new Error('Session invalide');return [cookie(AT,data.access_token,Math.min(3600,Math.max(60,Number(data.expires_in)||3600))),cookie(RT,data.refresh_token,2592000)];}
async function identity(request,c){const cs=cookiesOf(request);let token=cs[AT],set=[];
 if(token){const r=await backend(c,'/auth/v1/user',{token});if(r.ok){const u=await r.json();if(typeof u.id==='string'&&typeof u.email==='string')return{user:{id:u.id,email:u.email,name:typeof u.user_metadata?.name==='string'?u.user_metadata.name.slice(0,200):u.email},token,set};}else if(r.status>=500)throw new Error('Service indisponible');}
 if(cs[RT]){const r=await backend(c,'/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:cs[RT]}});if(r.ok){const data=await r.json();set=tokens(data);token=data.access_token;const check=await backend(c,'/auth/v1/user',{token});if(check.ok){const u=await check.json();if(typeof u.id==='string'&&typeof u.email==='string')return{user:{id:u.id,email:u.email,name:typeof u.user_metadata?.name==='string'?u.user_metadata.name.slice(0,200):u.email},token,set};}}else if(r.status>=500)throw new Error('Service indisponible');}
 return null;
}
async function body(request,max=16000){const reader=request.body?.getReader();if(!reader)throw new Error('Corps absent');const chunks=[];let size=0;while(true){const{value,done}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new Error('Requête trop volumineuse');}chunks.push(value);}const all=new Uint8Array(size);let offset=0;for(const v of chunks){all.set(v,offset);offset+=v.length;}const data=JSON.parse(new TextDecoder().decode(all));if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Format invalide');return data;}
function email(value){return typeof value==='string'&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);}
function password(value){return typeof value==='string'&&value.length>=12&&value.length<=256;}
function b64(bytes){return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
async function challenge(){const verifier=b64(crypto.getRandomValues(new Uint8Array(32)));const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));return{verifier,challenge:b64(new Uint8Array(hash))};}
function validSnapshot(d){return d&&typeof d==='object'&&!Array.isArray(d)&&[1,2,3].includes(d.version)&&Array.isArray(d.mesures)&&Array.isArray(d.journal)&&(d.injections===undefined||Array.isArray(d.injections))&&d.profil&&typeof d.profil==='object'&&!Array.isArray(d.profil);}
/** Aucun en-tête d'identité du navigateur n'est utilisé : le fournisseur vérifie le jeton. */
export async function cloudRoute(request,env){
 const url=new URL(request.url),p=url.pathname,c=conf(env);
 if(p==='/api/auth/config')return request.method==='GET'?json({available:!!c,syncAvailable:!!c?.sync}):json({error:'Méthode non autorisée'},405);
 if(!p.startsWith('/api/auth/')&&p!=='/api/cloud/session'&&p!=='/api/sync')return null;
 if(!c)return json({error:'Comptes Diabia en attente de configuration du service de connexion.'},503);
 if(request.method!=='GET'&&request.headers.get('origin')!==url.origin)return json({error:'Origine non autorisée.'},403);
 try{
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
