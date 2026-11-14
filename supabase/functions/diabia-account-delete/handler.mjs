const headers={'Content-Type':'application/json;charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
// Les seuls identifiants utilisables viennent d'Auth. Aucun identifiant cible n'est accepté.
export function createAccountDeleteHandler(config,transport=fetch){
 return async request=>{
  if(request.method!=='POST')return reply({error:'Méthode non autorisée.'},405);
  const authorization=request.headers.get('authorization')||'';
  if(!/^Bearer [^\s]{20,8192}$/.test(authorization))return reply({error:'Connexion requise.'},401);
  if(!config.url||!config.publicKey||!config.adminKey)return reply({error:'Service non configuré.'},503);
  let revoked=false;
  try{
   const reader=request.body?.getReader();if(!reader)return reply({error:'Confirmation requise.'},400);
   const chunks=[];let length=0;while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>2000){await reader.cancel();return reply({error:'Requête trop volumineuse.'},413);}chunks.push(value);}
   const bytes=new Uint8Array(length);let offset=0;for(const v of chunks){bytes.set(v,offset);offset+=v.length;}
   let input;try{input=JSON.parse(new TextDecoder().decode(bytes));}catch{return reply({error:'Format invalide.'},400);}
   if(!input||Object.keys(input).some(k=>!['password','confirmation'].includes(k))||input.confirmation!=='SUPPRIMER'||typeof input.password!=='string'||!input.password||input.password.length>256)return reply({error:'Mot de passe et confirmation SUPPRIMER requis.'},400);
   const call=(path,{method='GET',body,auth=authorization,admin=false}={})=>transport(config.url+path,{method,headers:{apikey:admin?config.adminKey:config.publicKey,...(auth?{Authorization:auth}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(6000),cache:'no-store'});
   const check=await call('/auth/v1/user');if(!check.ok)return reply({error:'Session expirée. Reconnecte-toi.'},401);
   const user=await check.json();if(typeof user.id!=='string'||!/^[\da-f-]{36}$/i.test(user.id)||typeof user.email!=='string')return reply({error:'Session invalide.'},401);
   const login=await call('/auth/v1/token?grant_type=password',{method:'POST',auth:null,body:{email:user.email,password:input.password}});
   if(!login.ok)return reply({error:login.status===429?'Trop de tentatives. Réessaie plus tard.':'Mot de passe incorrect ou vérification impossible.'},login.status===429?429:401);
   const fresh=await login.json();if(fresh.user?.id!==user.id||typeof fresh.access_token!=='string')return reply({error:'Vérification du compte impossible.'},401);
   const logout=await call('/auth/v1/logout?scope=global',{method:'POST',auth:'Bearer '+fresh.access_token});
   if(!logout.ok)return reply({error:'Les sessions ne peuvent pas être révoquées. Aucune suppression effectuée.'},503);
   revoked=true;
   const legacy=!config.adminKey.startsWith('sb_secret_');
   const deletion=await call('/auth/v1/admin/users/'+encodeURIComponent(user.id),{method:'DELETE',admin:true,auth:legacy?'Bearer '+config.adminKey:null,body:{should_soft_delete:false}});
   if(!deletion.ok)return reply({error:'Sessions fermées, mais suppression non confirmée. Reconnecte-toi pour réessayer.',sessionsClosed:true},503);
   return reply({ok:true,deleted:true});
  }catch{return reply({error:revoked?'Sessions fermées ; suppression non confirmée. Reconnecte-toi pour vérifier.':'Service temporairement indisponible. Aucune suppression confirmée.',sessionsClosed:revoked},503);}
 };
}
