"use client";
import {createContext,useContext,useEffect,useState} from "react";
import {activerEspaceCompte} from "../../lib/storage";
type User={id:string;email:string;name:string};
const Session=createContext<{user:User|null;local:boolean}>({user:null,local:false});
export function useSessionDiabia(){return useContext(Session);}
export default function SessionProvider({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null),[status,setStatus]=useState<"loading"|"ready"|"error">("loading"),[local,setLocal]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{
  if(local)return;
  let controller:AbortController|null=null;
  function verifier(){controller?.abort();const c=new AbortController();controller=c;const timer=setTimeout(()=>{if(!c.signal.aborted){setStatus("error");c.abort();}},10000);fetch("/api/session",{credentials:"same-origin",cache:"no-store",signal:c.signal}).then(async r=>{if(!r.ok)throw new Error("Session indisponible");const d=await r.json();if(d.authenticated!==true||typeof d.user?.id!=="string"||typeof d.user?.email!=="string")throw new Error("Session invalide");if(c.signal.aborted)return;activerEspaceCompte(d.user.id);setUser(d.user);setStatus("ready");}).catch(()=>{if(!c.signal.aborted)setStatus("error");}).finally(()=>clearTimeout(timer));}
  function visible(){if(document.visibilityState==="visible")verifier();}
  verifier();window.addEventListener("focus",verifier);document.addEventListener("visibilitychange",visible);
  return()=>{controller?.abort();window.removeEventListener("focus",verifier);document.removeEventListener("visibilitychange",visible);};
 },[retry,local]);
 if(status==="loading")return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><p role="status" className="text-sm text-slate-600">Ouverture de ton espace Diabia…</p></main>;
 if(status==="error")return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-lg"><span className="text-xs font-semibold uppercase tracking-widest text-blue-600">Ton espace Diabia</span><h1 className="mt-3 text-3xl font-semibold">Se connecter pour continuer.</h1><p className="mt-4 text-sm leading-7 text-slate-500">La session n’a pas pu être confirmée. Tu peux te reconnecter ou utiliser un espace local distinct, sans compte. Tes anciennes données de ce navigateur restent conservées.</p><a href="/signin-with-chatgpt?return_to=%2Faccount%2F" target="_top" className="mt-6 block rounded-2xl bg-slate-950 px-5 py-3.5 text-center text-sm font-semibold text-white">Créer un compte ou se connecter avec ChatGPT</a><button onClick={()=>{setStatus("loading");setRetry(v=>v+1);}} className="mt-3 w-full rounded-xl px-4 py-3 text-sm font-semibold text-blue-700">Réessayer la vérification</button><button onClick={()=>{activerEspaceCompte(null);setUser(null);setLocal(true);setStatus("ready");}} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600">Continuer dans l’espace local sans compte</button></section></main>;
 return <Session.Provider key={user?.id||"invite"} value={{user,local}}>{children}</Session.Provider>;
}
