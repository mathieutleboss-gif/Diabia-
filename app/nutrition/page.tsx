"use client";
import {useEffect,useState} from 'react';
import {ciqualSource} from '../../lib/nutrition/ciqual';
import {glucides,poidsEnGrammes,type Food} from '../../lib/nutrition/core';
import {GlassPanel,PageHero,PageShell,fieldClassName} from '../components/PageShell';
const fmt=(v:number)=>v.toLocaleString('fr-FR',{maximumFractionDigits:2});
export default function Nutrition(){
 const [query,setQuery]=useState(''),[portion,setPortion]=useState('100');
 const [results,setResults]=useState<Food[]>([]),[selected,setSelected]=useState<Food|null>(null);
 const [status,setStatus]=useState<'idle'|'loading'|'ready'|'error'>('idle');
 useEffect(()=>{let active=true;if(query.trim().length<2){setResults([]);setStatus('idle');return;}
 setStatus('loading');const timer=setTimeout(()=>{ciqualSource.rechercher(query).then(rows=>{if(active){setResults(rows);setStatus('ready');}}).catch(()=>{if(active){setResults([]);setStatus('error');}});},180);
 return()=>{active=false;clearTimeout(timer);};},[query]);
 const weight=poidsEnGrammes(portion),total=selected&&weight!==null?glucides(selected,weight):null;
 return <PageShell><PageHero eyebrow="Alimentation" title="Calculateur de glucides" description="Trouve le bon aliment, vérifie sa préparation et indique la quantité consommée. Le calcul se met à jour immédiatement."/>
 <div className="grid items-start gap-5 lg:grid-cols-2"><GlassPanel>
 <h2 className="text-lg font-semibold text-slate-900">1. Choisir un aliment</h2>
 <label className="mt-4 block text-sm font-semibold" htmlFor="food-search">Rechercher dans Ciqual</label>
 <input id="food-search" type="search" maxLength={100} autoComplete="off" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Riz, pâtes, pomme, banane, pain…" className={`${fieldClassName} mt-2`} aria-describedby="food-search-help"/>
 <p id="food-search-help" className="mt-2 text-xs leading-5 text-slate-500">Aliments génériques français · ANSES, Ciqual 2025 · Disponible sans connexion réseau après chargement de la page.</p>
 <div role="status" aria-live="polite" className="mt-4 text-sm text-slate-600">{status==='loading'?'Recherche…':status==='error'?'La base alimentaire n’a pas pu être consultée. Recharge la page pour réessayer.':status==='ready'?results.length?`${results.length} suggestions${results.length===30?' (affine la recherche pour plus de précision)':''}`:'Aucun aliment trouvé. Essaie un nom plus simple ou vérifie l’orthographe.':'Saisis au moins deux caractères pour afficher les suggestions.'}</div>
 <ul aria-label="Aliments trouvés" className="mt-3 max-h-[32rem] space-y-2 overflow-y-auto">{results.map(f=><li key={f.id}><button onClick={()=>setSelected(f)} aria-pressed={selected?.id===f.id} className={`w-full rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${selected?.id===f.id?'border-blue-400 bg-blue-50':'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}><span className="block text-sm font-semibold text-slate-900">{f.nom}</span><span className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-600"><span>{f.etat} · Ciqual 2025</span><span>{f.glucidesPour100g===null?'Valeur non quantifiée':`${fmt(f.glucidesPour100g)} g de glucides / 100 g`}</span></span></button></li>)}</ul>
 </GlassPanel><div className="space-y-4"><GlassPanel>
 <h2 className="text-lg font-semibold text-slate-900">2. Indiquer le poids consommé</h2>
 {!selected?<p className="mt-4 text-sm leading-6 text-slate-500">Sélectionne un résultat. Vérifie notamment la différence entre le poids cru et le poids cuit.</p>:<>
 <div className="mt-4 rounded-2xl bg-slate-50 p-4"><p className="font-semibold text-slate-900">{selected.nom}</p><p className="mt-2 text-sm text-slate-600">Préparation : {selected.etat}</p><a href={selected.sourceUrl} className="mt-2 inline-block text-xs font-semibold text-blue-700 underline">{selected.source}</a><p className="mt-2 text-sm">{selected.glucidesPour100g===null?`Glucides non quantifiés dans la source (${selected.valeurSource}). Aucun calcul exact disponible.`:`${fmt(selected.glucidesPour100g)} g de glucides pour 100 g.`}</p></div>
 <label htmlFor="food-weight" className="mt-5 block text-sm font-semibold">Poids consommé, en grammes</label><input id="food-weight" type="text" inputMode="decimal" autoComplete="off" maxLength={12} value={portion} onChange={e=>setPortion(e.target.value)} aria-invalid={weight===null} aria-describedby="weight-help" className={`${fieldClassName} mt-2`}/><p id="weight-help" className={`mt-2 text-xs ${weight===null?'text-rose-700':'text-slate-500'}`}>{weight===null?'Saisis un poids supérieur à 0 et inférieur ou égal à 2 000 g.':'Exemple : 150 ou 150,5. Limite de saisie : 2 000 g.'}</p>
 <div className="mt-5 rounded-2xl bg-blue-600 p-5 text-white" role="status" aria-live="polite"><p className="text-sm text-blue-100">Glucides pour cette portion</p><p className="mt-2 text-4xl font-semibold">{total===null?'—':`≈ ${fmt(total)} g`}</p>{total!==null&&weight!==null&&selected.glucidesPour100g!==null&&<p className="mt-3 text-xs text-blue-100">{fmt(selected.glucidesPour100g)} × {fmt(weight)} ÷ 100</p>}</div>
 </>}
 </GlassPanel><div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs leading-6 text-slate-600"><p>Valeurs indicatives : elles varient selon l’aliment, la recette et la préparation. Les glucides ne sont pas la seule valeur « dont sucres ». Ce calcul ne détermine aucune dose d’insuline.</p><p className="mt-3">Source : <a className="font-semibold text-blue-700 underline" href="https://doi.org/10.57745/RDMHWY">ANSES — Table Ciqual 2025</a>, réutilisée sous <a className="underline" href="https://www.etalab.gouv.fr/licence-ouverte-open-licence/">Licence Ouverte 2.0</a>. Libellés et colonne glucides extraits du fichier officiel.</p><p className="mt-3">Produits de marque et codes-barres : Open Food Facts n’est pas connecté dans cette version, son API étant inaccessible lors de la vérification. Vérifie l’étiquette du produit pour ces aliments.</p></div></div></div>
 </PageShell>;
}
