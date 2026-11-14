const JSON_HEADERS = {"Content-Type":"application/json;charset=utf-8","Cache-Control":"private, no-store","Vary":"Cookie","X-Content-Type-Options":"nosniff"};
/** Ce module est réservé à l'entrée Sites : l'identité est injectée par son proxy authentifié. */
export function sessionUtilisateur(request) {
  const id=request.headers.get("oai-authenticated-user-id"),email=request.headers.get("oai-authenticated-user-email");
  if(!id||!email||id.length>256||email.length>512)return null;
  let name=request.headers.get("oai-authenticated-user-full-name")||"";
  if(request.headers.get("oai-authenticated-user-full-name-encoding")==="percent-encoded-utf-8")try{name=decodeURIComponent(name);}catch{name="";}
  return {id,email,name:name.slice(0,200)||email};
}
export function createHandler(assets) {
 return {async fetch(request) {
  const url=new URL(request.url);
  if(url.pathname==="/api/session"){
   if(request.method!=="GET")return new Response(JSON.stringify({error:"Méthode non autorisée"}),{status:405,headers:{...JSON_HEADERS,Allow:"GET"}});
   const user=sessionUtilisateur(request);
   return new Response(JSON.stringify(user?{authenticated:true,user,provider:"chatgpt",storage:"local"}:{authenticated:false,provider:"chatgpt"}),{status:user?200:401,headers:JSON_HEADERS});
  }
  if(url.pathname.startsWith("/api/"))return new Response(JSON.stringify({error:"Ce service n’est pas encore configuré sur la démonstration."}),{status:503,headers:JSON_HEADERS});
  if(request.method!=="GET"&&request.method!=="HEAD")return new Response("Méthode non autorisée",{status:405,headers:{Allow:"GET, HEAD"}});
  let path;try{path=decodeURIComponent(url.pathname);}catch{return new Response("Adresse invalide",{status:400});}
  if(!path.endsWith("/")&&assets[`${path}/index.html`]){url.pathname+="/";return Response.redirect(url.toString(),308);}
  const route=path.endsWith("/")?`${path}index.html`:path;
  const entry=assets[route]||assets["/404.html"]||assets["/404/index.html"];
  if(!entry)return new Response("Page introuvable",{status:404});
  const bytes=Uint8Array.from(atob(entry.body),c=>c.charCodeAt(0));
  return new Response(request.method==="HEAD"?null:bytes,{status:assets[route]?200:404,headers:{"Content-Type":entry.type,"Cache-Control":route.startsWith("/_next/static/")?"public, max-age=31536000, immutable":"private, max-age=0, must-revalidate","X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin","Permissions-Policy":"camera=(), microphone=(), geolocation=()","Content-Security-Policy":"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'"}});
 }};
}
