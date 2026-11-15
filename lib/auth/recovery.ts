/** URL handling only: never persist or log a recovery proof. */
export function isRecoveryPage(path:string){return ['/account/callback','/account/reset-password'].includes(path.replace(/\/$/,''));}
export function recoveryDestination(url:URL):string|null {
 if(isRecoveryPage(url.pathname))return null;
 const fragment=new URLSearchParams(url.hash.slice(1));
 if(url.searchParams.has('token_hash'))return '/account/reset-password/'+url.search+url.hash;
 if(url.searchParams.has('error_code')||fragment.has('error_code')||url.searchParams.get('error')==='access_denied'||fragment.get('error')==='access_denied')return '/account/callback/'+url.search+url.hash;
 if(fragment.get('type')==='recovery'||url.searchParams.get('type')==='recovery')return '/account/reset-password/'+url.search+url.hash;
 if(url.searchParams.has('code'))return '/account/callback/'+url.search;
 return null;
}
export function readRecoveryLink(url:URL){
 const q=url.searchParams,h=new URLSearchParams(url.hash.slice(1));
 if(q.has('error')||h.has('error'))return {error:'Ce lien est invalide ou expiré. Demande un nouveau lien.'};
 if(h.has('access_token')||q.has('access_token'))return {error:'Ce lien utilise un ancien format. Demande un nouveau lien après la mise à jour du service.'};
 const hash=q.get('token_hash')||h.get('token_hash')||'',code=q.get('code')||'';
 if(hash&&code||q.getAll('code').length>1||q.getAll('token_hash').length+h.getAll('token_hash').length>1)return {error:'Lien ambigu. Demande un nouveau lien.'};
 if(hash&&(q.get('type')||h.get('type'))!=='recovery')return {error:'Ce lien n’est pas un lien de récupération.'};
 if(!hash&&!code)return {error:'Le lien de récupération est absent. Demande un nouveau lien.'};
 return {code,token_hash:hash};
}
