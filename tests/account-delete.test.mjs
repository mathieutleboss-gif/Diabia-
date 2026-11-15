import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccountDeleteHandler} from '../supabase/functions/diabia-account-delete/handler.mjs';
const config={url:'https://provider.example.test',publicKey:'publishable',adminKey:'sb_secret_test'};
const uid='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const input={password:'Fictitious-password-123!',confirmation:'SUPPRIMER'};
function req(data=input,token='valid-access-token-long-enough'){return new Request('https://provider.example.test/functions/v1/diabia-account-delete',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(data)});}
test('la suppression refuse les appels anonymes et toute cible fournie par le client',async()=>{
 let calls=0;const handler=createAccountDeleteHandler(config,async()=>{calls++;throw Error('unexpected');});
 assert.equal((await handler(req(input,''))).status,401);
 assert.equal((await handler(req({...input,user_id:'victim'}))).status,400);assert.equal(calls,0);
});
test('un mauvais mot de passe ne révoque ni ne supprime le compte',async()=>{
 const paths=[];const handler=createAccountDeleteHandler(config,async url=>{paths.push(url);return url.endsWith('/user')?Response.json({id:uid,email:'fiction@example.invalid'}):Response.json({}, {status:400});});
 assert.equal((await handler(req())).status,401);assert.equal(paths.length,2);assert.ok(paths.every(p=>!p.includes('admin/users')&&!p.includes('logout')));
});
test('la suppression revérifie le propriétaire, révoque toutes les sessions puis supprime seulement son compte',async()=>{
 const paths=[];const handler=createAccountDeleteHandler(config,async(url,options)=>{paths.push(url);
 if(url.endsWith('/auth/v1/user'))return Response.json({id:uid,email:'fiction@example.invalid'});
 if(url.includes('grant_type=password')){assert.equal(JSON.parse(options.body).email,'fiction@example.invalid');return Response.json({user:{id:uid},access_token:'fresh-token'});}
 if(url.includes('/logout?scope=global')){assert.equal(options.headers.Authorization,'Bearer fresh-token');return new Response(null,{status:204});}
 assert.ok(url.endsWith('/admin/users/'+uid));assert.equal(options.method,'DELETE');assert.equal(options.headers.apikey,config.adminKey);assert.equal(options.headers.Authorization,undefined);assert.deepEqual(JSON.parse(options.body),{should_soft_delete:false});return Response.json({});
 });const r=await handler(req());assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true,deleted:true});assert.ok(paths[2].includes('logout'));assert.ok(paths[3].includes('/admin/users/'));
});
test('une identité différente après réauthentification ne permet pas la suppression',async()=>{
 const handler=createAccountDeleteHandler(config,async url=>url.endsWith('/user')?Response.json({id:uid,email:'fiction@example.invalid'}):Response.json({user:{id:'another-user'},access_token:'token'}));assert.equal((await handler(req())).status,401);
});
test('une révocation impossible bloque la suppression ; un échec de suppression ne se présente pas comme un succès',async()=>{
 for(const step of ['logout','delete']){let deletion=false;const handler=createAccountDeleteHandler(config,async url=>{
 if(url.endsWith('/user'))return Response.json({id:uid,email:'fiction@example.invalid'});
 if(url.includes('grant_type=password'))return Response.json({user:{id:uid},access_token:'fresh-token'});
 if(url.includes('logout'))return new Response(null,{status:step==='logout'?503:204});
 deletion=true;return Response.json({},{status:503});});const r=await handler(req());assert.equal(r.status,503);const data=await r.json();assert.equal(data.deleted,undefined);assert.equal(deletion,step==='delete');if(step==='delete')assert.equal(data.sessionsClosed,true);}
});
