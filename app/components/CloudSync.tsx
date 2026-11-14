"use client";
import {createContext,useContext,useEffect,useRef,useState} from "react";
import {useSessionDiabia} from "./SessionProvider";
import {espaceCompteActif,exporterDonneesLocales,lireValeurLocale,restaurerDonneesLocales,sauvegarderLocal} from "../../lib/storage";
import {sauvegardeValide} from "../../lib/sauvegarde";
type Snapshot=ReturnType<typeof exporterDonneesLocales>;
type Remote={revision:number;payload:Snapshot|null;deleted?:boolean};
type SyncState={status:string;error:string;busy:boolean;conflict:boolean;enabled:boolean;save:()=>Promise<void>;download:()=>Promise<void>;check:()=>Promise<void>};
const Context=createContext<SyncState>({status:"Synchronisation non activée",error:"",busy:false,conflict:false,enabled:false,save:async()=>{},download:async()=>{},check:async()=>{}});
export function useCloudSync(){return useContext(Context);}
function signature(d:Snapshot){return JSON.stringify({version:d.version,mesures:d.mesures,injections:d.injections,journal:d.journal,profil:d.profil});}
async function empreinte(value:string){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(b)).map(v=>v.toString(16).padStart(2,"0")).join("");}
function vide(d:Snapshot){return !d.mesures.length&&!d.injections.length&&!d.journal.length&&!Object.values(d.profil).some(Boolean);}
export default function CloudSync({children}:{children:React.ReactNode}){
 const{user,provider,syncAvailable}=useSessionDiabia();const enabled=provider==='diabia'&&syncAvailable&&!!user;
 const[status,setStatus]=useState("Synchronisation non activée"),[error,setError]=useState(""),[busy,setBusy]=useState(false),[conflict,setConflict]=useState(false);
 const state=useRef({active:false,generation:0,running:false,paused:false,dirty:false,saved:'',remote:null as Remote|null});
 const edits=useRef(0);
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const namespace=user?`diabia:${user.id}`:'';
 function valid(generation:number){return enabled&&state.current.active&&state.current.generation===generation&&espaceCompteActif(namespace);}
 function pause(message:string){state.current.paused=true;state.current.dirty=true;setConflict(true);setStatus(message);clearTimeout(timer.current);}
 function clean(message:string){state.current.paused=false;state.current.dirty=false;setConflict(false);setStatus(message);}
 async function mark(revision:number,value:string,generation:number){const digest=await empreinte(value);if(valid(generation))sauvegarderLocal('diabia_sync_meta',{revision,digest},{notifier:false});}
 async function request(method='GET',data?:object):Promise<Remote>{
  const r=await fetch('/api/sync',{method,credentials:'same-origin',cache:'no-store',headers:{'X-Diabia-Account':user?.id||'',...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(15000)});
  const d=await r.json();if(!r.ok){if(d.accountMismatch)window.dispatchEvent(new Event('diabia:session-invalidated'));else if(r.status===409)pause('Versions différentes : aucune donnée écrasée');throw Error(d.error||'Synchronisation impossible.');}
  if(!Number.isSafeInteger(d.revision)||d.revision<0)throw Error('Réponse distante invalide. Les données locales sont conservées.');return d;
 }
 async function check(){
  const s=state.current,g=s.generation;if(!valid(g)||s.running)return;s.running=true;setBusy(true);setError('');
  try{const before=signature(exporterDonneesLocales()),version=edits.current;const r=await request();if(!valid(g))return;s.remote=r;const local=exporterDonneesLocales(),current=signature(local);
   if(r.payload&&!sauvegardeValide(r.payload))throw Error('La sauvegarde distante est invalide. Les données locales sont conservées.');
   // Une saisie ou un effacement pendant la lecture ne doit pas être remplacé par son résultat.
   if(current!==before||edits.current!==version||s.paused){pause('Modifications locales conservées : choisis la version à garder');return;}
   if(r.payload&&vide(local)){if(!restaurerDonneesLocales(r.payload))throw Error('Restauration impossible.');s.saved=signature(exporterDonneesLocales());await mark(r.revision,s.saved,g);if(valid(g)){if(signature(exporterDonneesLocales())===s.saved)clean('Données récupérées depuis ton compte');else pause('Modifications locales conservées après récupération');}}
   else if(r.payload&&signature(r.payload)===current){s.saved=current;await mark(r.revision,current,g);if(valid(g)){if(signature(exporterDonneesLocales())===s.saved)clean('Données à jour');else pause('Modifications locales en attente');}}
   else if(!r.revision){s.dirty=current!==s.saved;setStatus('Prêt à sauvegarder tes données sur ton compte');}
   else{let meta:{revision?:number;digest?:string}={};try{meta=JSON.parse(lireValeurLocale('diabia_sync_meta','{}'));}catch{}const digest=await empreinte(current);if(!valid(g))return;
    if(meta.revision===r.revision&&meta.digest===digest){s.saved=current;clean('Données à jour');}else pause(r.deleted?'La sauvegarde distante a été supprimée':'Versions différentes sur les appareils');}
  }catch(e){if(valid(g))setError(e instanceof Error?e.message:'Synchronisation impossible.');}
  finally{if(valid(g)){s.running=false;setBusy(false);}}
 }
 function queue(){clearTimeout(timer.current);timer.current=setTimeout(()=>{if(state.current.dirty&&!state.current.paused)void actions.current.save();},1200);}
 async function save(force=false){
  const s=state.current,g=s.generation;if(!valid(g)||s.running||s.remote===null||(!force&&s.paused))return;s.running=true;setBusy(true);setError('');if(force){s.paused=false;setConflict(false);}
  try{const payload=exporterDonneesLocales();if(payload.mesures.some(m=>m.id?.startsWith('demo-')))throw Error('L’exemple intégré n’est pas envoyé automatiquement au stockage médical.');
   const r=await request('PUT',{revision:s.remote.revision,payload});if(!valid(g))return;s.remote={...r,payload};s.saved=signature(payload);await mark(r.revision,s.saved,g);if(!valid(g))return;
   if(s.paused)return;s.dirty=signature(exporterDonneesLocales())!==s.saved;setStatus(s.dirty?'Modifications récentes en attente de sauvegarde':'Sauvegarde en ligne effectuée');if(s.dirty)queue();
  }catch(e){if(valid(g))setError(e instanceof Error?e.message:'Sauvegarde impossible.');}
  finally{if(valid(g)){s.running=false;setBusy(false);}}
 }
 async function download(){
  const s=state.current,g=s.generation;if(!valid(g)||s.running)return;s.running=true;setBusy(true);setError('');
  try{const before=signature(exporterDonneesLocales()),version=edits.current;const r=await request();if(!valid(g))return;if(signature(exporterDonneesLocales())!==before||edits.current!==version){pause('Les données ont changé pendant la récupération. Réessaie après avoir choisi la version à garder.');return;}
   if(!r.payload)throw Error('Aucune sauvegarde distante à récupérer. Les données locales sont conservées.');if(!sauvegardeValide(r.payload)||!restaurerDonneesLocales(r.payload))throw Error('Restauration impossible.');
   s.remote=r;s.saved=signature(exporterDonneesLocales());await mark(r.revision,s.saved,g);if(valid(g)){if(signature(exporterDonneesLocales())===s.saved)clean('Version distante récupérée');else pause('Modifications locales conservées après récupération');}
  }catch(e){if(valid(g))setError(e instanceof Error?e.message:'Récupération impossible.');}
  finally{if(valid(g)){s.running=false;setBusy(false);}}
 }
 const actions=useRef({save:()=>save(false),check});actions.current={save:()=>save(false),check};
 useEffect(()=>{
  state.current={active:enabled,generation:state.current.generation+1,running:false,paused:false,dirty:false,saved:'',remote:null};setBusy(false);setConflict(false);setError('');if(!enabled){setStatus('Synchronisation non activée');return;}
  void actions.current.check();
  function change(event:Event){edits.current++;if(event instanceof CustomEvent&&event.detail?.action==='clear-local'){pause('Données locales effacées : synchronisation mise en pause');return;}try{state.current.dirty=signature(exporterDonneesLocales())!==state.current.saved;if(state.current.dirty&&!state.current.running)queue();}catch{}}
  function storage(event:StorageEvent){const prefix=`diabia:compte:${encodeURIComponent(namespace)}:`;if(event.key!==null&&!event.key.startsWith(prefix))return;if(event.key?.endsWith('diabia_sync_meta')||event.key?.endsWith('diabia_storage_probe'))return;if(event.newValue===null){edits.current++;pause('Données effacées dans un autre onglet : synchronisation mise en pause');return;}change(event);}
  function focus(){if(!state.current.dirty&&!state.current.paused)void actions.current.check();}
  window.addEventListener('diabia:storage',change);window.addEventListener('storage',storage);window.addEventListener('focus',focus);window.addEventListener('online',focus);
  return()=>{state.current.active=false;state.current.generation++;clearTimeout(timer.current);window.removeEventListener('diabia:storage',change);window.removeEventListener('storage',storage);window.removeEventListener('focus',focus);window.removeEventListener('online',focus);};
 },[enabled,user?.id]);
 return <Context.Provider value={{status,error,busy,conflict,enabled,save:()=>save(true),download,check}}>{children}</Context.Provider>;
}
