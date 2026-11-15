// Opt-in integration test. Credentials arrive via hidden stdin, never files or command arguments.
// Fixtures must be newly provisioned synthetic accounts; this script sends no email.
import {createInterface} from 'node:readline';
import assert from 'node:assert/strict';
import {cloudRoute} from '../worker/diabia-cloud.mjs';
const rl=createInterface({input:process.stdin});
const line=await new Promise(resolve=>rl.once('line',resolve));rl.close();
const c=JSON.parse(line);
assert.equal(c.fixtures.length,2);
assert.ok(c.fixtures.every(f=>f.email.startsWith('diabia-sync-fixture-')&&f.email.endsWith('@example.invalid')));
const env={DIABIA_SUPABASE_URL:c.url,DIABIA_SUPABASE_KEY:c.key,DIABIA_REMOTE_HEALTH_APPROVED:'true'};
// This flag applies only to this in-process test, not to the deployed application's environment.
const origin='https://diabia-sync-test.example.invalid';let checks=0;
const pass=name=>{checks++;process.stdout.write(JSON.stringify({check:name,result:'PASS'})+'\n');};
function device(f){return {fixture:f,cookies:new Map()};}
async function call(d,path,method='GET',data,expected=200,stale){
 const req=new Request(origin+path,{method,headers:{origin,'content-type':'application/json','X-Diabia-Account':d.fixture.id,cookie:stale??[...d.cookies].map(([k,v])=>`${k}=${v}`).join('; ')},...(data?{body:JSON.stringify(data)}:{})});
 const r=await cloudRoute(req,env);assert.equal(r.status,expected,`${method} ${path}`);
 for(const cookie of r.headers.getSetCookie()){const [pair]=cookie.split(';'),i=pair.indexOf('=');if(cookie.includes('Max-Age=0'))d.cookies.delete(pair.slice(0,i));else d.cookies.set(pair.slice(0,i),pair.slice(i+1));}
 return r.json();
}
const credentials=d=>({email:d.fixture.email,password:d.fixture.password});
const cookie=d=>[...d.cookies].map(([k,v])=>`${k}=${v}`).join('; ');
const token=d=>decodeURIComponent(d.cookies.get('__Host-diabia-access'));
async function rest(path,method='GET',data,access){return fetch(c.url+'/rest/v1/'+path,{method,headers:{apikey:c.key,...(access?{Authorization:'Bearer '+access}:{}),'Content-Type':'application/json',Prefer:'return=representation'},...(data?{body:JSON.stringify(data)}:{})});}
const payload={version:3,mesures:[{id:'synthetic-measure-1',date:'2026-01-01',heure:'12:00',timestamp:'2026-01-01T11:00:00.000Z',glycemie:112,note:'SYNTHETIC INTEGRATION TEST ONLY'}],injections:[{id:'synthetic-dose-1',date:'2026-01-01',heure:'12:00',timestamp:'2026-01-01T11:00:00.000Z',dose:4}],journal:[],profil:{prenom:'PERSONNAGE FICTIF'}};
const a=device(c.fixtures[0]),a2=device(c.fixtures[0]),b=device(c.fixtures[1]);
try{
 for(const d of [a,a2,b]){await call(d,'/api/auth/login','POST',credentials(d));assert.equal((await call(d,'/api/cloud/session')).user.id,d.fixture.id);}pass('two_independent_sessions_same_account_and_other_account_login');
 assert.equal((await call(a,'/api/sync')).revision,0);
 assert.equal((await call(a,'/api/sync','PUT',{revision:0,payload})).revision,1);
 assert.deepEqual((await call(a2,'/api/sync')).payload,payload);pass('persistent_snapshot_shared_between_two_sessions');
 assert.equal((await call(b,'/api/sync')).revision,0);
 const own=await rest('diabia_snapshots?select=user_id','GET',null,token(a));assert.deepEqual((await own.json()).map(r=>r.user_id),[a.fixture.id]);
 const foreign=await rest('diabia_snapshots?user_id=eq.'+a.fixture.id,'GET',null,token(b));assert.deepEqual(await foreign.json(),[]);
 const insertForeign=await rest('diabia_snapshots','POST',{user_id:b.fixture.id,revision:1,payload},token(a));assert.equal(insertForeign.status,403);
 const reassign=await rest('diabia_snapshots?user_id=eq.'+a.fixture.id,'PATCH',{user_id:b.fixture.id},token(a));assert.equal(reassign.status,403);
 const anonymous=await rest('diabia_snapshots');assert.ok([401,403].includes(anonymous.status));pass('actual_RLS_read_insert_update_and_anonymous_isolation');
 assert.equal((await call(a2,'/api/sync','PUT',{revision:0,payload},409)).conflict,true);
 const newer={...payload,mesures:[{...payload.mesures[0],glycemie:128}]};
 assert.equal((await call(a2,'/api/sync','PUT',{revision:1,payload:newer})).revision,2);
 assert.deepEqual((await call(a,'/api/sync')).payload,newer);pass('stale_revision_conflicts_and_updated_snapshot_available');
 await call(b,'/api/sync','PUT',{revision:0,payload});
 const wrong=device(b.fixture);wrong.cookies=new Map(a.cookies);await call(wrong,'/api/sync','GET',undefined,409);pass('cross_tab_account_mismatch_rejected');
 const stale=cookie(a2),raw=token(a2);await call(a,'/api/auth/logout-all','POST',{});
 await call(a2,'/api/cloud/session','GET',undefined,401,stale);
 const revoked=await rest('diabia_snapshots','GET',null,raw);assert.deepEqual(await revoked.json(),[]);pass('global_logout_revokes_other_session_and_direct_RLS_access');
 const staleB=cookie(b);await call(b,'/api/auth/logout','POST',{});await call(b,'/api/cloud/session','GET',undefined,401,staleB);pass('local_logout');
 const again=device(a.fixture);await call(again,'/api/auth/login','POST',credentials(again));assert.deepEqual((await call(again,'/api/sync')).payload,newer);await call(again,'/api/auth/logout-all','POST',{});pass('data_persists_after_logout_and_relogin');
 process.stdout.write(JSON.stringify({integration:'PASS',checks,onlySyntheticData:true,noEmailsSent:true})+'\n');
}catch(error){process.stdout.write(JSON.stringify({integration:'FAIL',checksCompleted:checks,error:error instanceof Error?error.message.split('\n')[0]:'unknown'})+'\n');process.exitCode=1;}
