import {createAccountDeleteHandler} from './handler.mjs';
function key(map,fallback){try{return JSON.parse(Deno.env.get(map)||'{}').default||Deno.env.get(fallback)||'';}catch{return '';}}
Deno.serve(createAccountDeleteHandler({url:Deno.env.get('SUPABASE_URL'),publicKey:key('SUPABASE_PUBLISHABLE_KEYS','SUPABASE_ANON_KEY'),adminKey:key('SUPABASE_SECRET_KEYS','SUPABASE_SERVICE_ROLE_KEY')}));
