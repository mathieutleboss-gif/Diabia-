import { convertirEnMgDl, type GlucoseUnit } from '../glucoseUnits';

export type Category = 'pompe' | 'capteur' | 'plateforme' | 'automatisation';
export type Provider = { id: string; nom: string; categories: Category[]; documentation: string; capacites: string; autorisation: string };
const verifier = 'Accès officiel, consentement et périmètre à confirmer auprès du fournisseur.';
export const providers: Provider[] = [
  {id:'medtronic',nom:'Medtronic',categories:['pompe','capteur','automatisation'],documentation:'https://www.medtronicdiabetes.com/',capacites:'Pompes, capteurs et systèmes automatisés ; API tierce à vérifier.',autorisation:verifier},
  {id:'insulet',nom:'Insulet / Omnipod',categories:['pompe','automatisation'],documentation:'https://www.omnipod.com/',capacites:'Pompes et systèmes automatisés ; API tierce à vérifier.',autorisation:verifier},
  {id:'tandem',nom:'Tandem',categories:['pompe','automatisation'],documentation:'https://www.tandemdiabetes.com/',capacites:'Pompes et systèmes automatisés ; API tierce à vérifier.',autorisation:verifier},
  {id:'ypsomed',nom:'mylife / YpsoPump',categories:['pompe','automatisation'],documentation:'https://www.mylife-diabetescare.com/',capacites:'Pompe et solutions de gestion ; API tierce à vérifier.',autorisation:verifier},
  {id:'roche',nom:'Roche',categories:['pompe','plateforme'],documentation:'https://www.accu-chek.com/',capacites:'Dispositifs et plateforme de suivi ; accès tiers à vérifier.',autorisation:verifier},
  {id:'kaleido',nom:'Kaleido',categories:['pompe'],documentation:'https://www.hellokaleido.com/',capacites:'Pompe à insuline ; accès tiers à vérifier.',autorisation:verifier},
  {id:'sooil',nom:'SOOIL / Dana',categories:['pompe'],documentation:'https://www.sooil.com/',capacites:'Pompes Dana ; accès tiers à vérifier.',autorisation:verifier},
  {id:'betabionics',nom:'Beta Bionics',categories:['pompe','automatisation'],documentation:'https://www.betabionics.com/',capacites:'Système automatisé ; accès tiers à vérifier.',autorisation:verifier},
  {id:'diabeloop',nom:'Diabeloop',categories:['automatisation'],documentation:'https://www.diabeloop.com/',capacites:'Algorithmes de gestion automatisée ; accès tiers à vérifier.',autorisation:verifier},
  {id:'dexcom',nom:'Dexcom',categories:['capteur'],documentation:'https://developer.dexcom.com/',capacites:'Le programme développeur documente l’accès à des données de capteurs pour les partenaires autorisés.',autorisation:'Candidature, autorisation du partenaire et de la personne ; disponibilité régionale à confirmer.'},
  {id:'abbott',nom:'Abbott / FreeStyle Libre',categories:['capteur','plateforme'],documentation:'https://www.freestyle.abbott/',capacites:'Capteurs et LibreView ; accès officiel tiers et périmètre à confirmer.',autorisation:verifier},
  {id:'ascensia',nom:'Ascensia',categories:['capteur'],documentation:'https://www.ascensia.com/',capacites:'Solutions de mesure du glucose ; accès tiers à vérifier.',autorisation:verifier},
  {id:'tidepool',nom:'Tidepool',categories:['plateforme'],documentation:'https://dev-docs.tidepool.org/',capacites:'Plateforme de données et documentation API.',autorisation:'Accès et autorisation du compte selon les conditions Tidepool ; à confirmer.'},
  {id:'glooko',nom:'Glooko',categories:['plateforme'],documentation:'https://glooko.com/',capacites:'Plateforme de données de diabète ; accès tiers à vérifier.',autorisation:verifier},
  {id:'nightscout',nom:'Nightscout',categories:['plateforme'],documentation:'https://nightscout.github.io/',capacites:'Plateforme communautaire auto-hébergée ; API et configuration propres à l’instance.',autorisation:'Autorisation explicite du propriétaire de l’instance et sécurité à vérifier.'},
];

export type Kind = 'glucose' | 'bolus' | 'basal' | 'repas';
export type RawEvent = { source: string; externalId: string; instant: string; timezone: string; kind: Kind; value: number; unit: GlucoseUnit | 'U' | 'U/h' | 'g' };
export type Event = { source: string; externalId: string; instant: string; timezone: string; kind: Kind; value: number; unit: 'mg/dL' | 'U' | 'U/h' | 'g' };
export function normaliser(e: RawEvent): Event {
  if (!e || !e.source?.trim() || !e.externalId?.trim() || !Number.isFinite(e.value) || e.value < 0) throw new Error('Événement invalide');
  const dateMatch = /^(\d{4})-(\d\d)-(\d\d)T\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:\d\d)$/.exec(e.instant);
  if (!dateMatch || !Number.isFinite(Date.parse(e.instant))) throw new Error('Date avec décalage obligatoire');
  const [,year,month,day]=dateMatch; const calendar=new Date(Date.UTC(Number(year),Number(month)-1,Number(day)));
  if (calendar.getUTCFullYear()!==Number(year)||calendar.getUTCMonth()!==Number(month)-1||calendar.getUTCDate()!==Number(day)) throw new Error('Date impossible');
  try { new Intl.DateTimeFormat('fr', {timeZone:e.timezone}).format(0); } catch { throw new Error('Fuseau horaire invalide'); }
  const allowed: Record<Kind,string[]> = {glucose:['mg/dL','mmol/L','g/L'],bolus:['U'],basal:['U/h'],repas:['g']};
  if (!allowed[e.kind]?.includes(e.unit)) throw new Error('Type ou unité invalide');
  const value = e.kind === 'glucose' ? convertirEnMgDl(e.value,e.unit as GlucoseUnit) : e.value;
  return {...e,source:e.source.trim(),externalId:e.externalId.trim(),instant:new Date(e.instant).toISOString(),value,unit:e.kind === 'glucose' ? 'mg/dL' : e.unit as 'U'|'U/h'|'g'};
}
export function fusionner(existing: Event[], incoming: Event[]): Event[] {
  const result = new Map(existing.map(e=>[JSON.stringify([e.source,e.externalId]),e]));
  for (const e of incoming) { const key=JSON.stringify([e.source,e.externalId]); const old=result.get(key); if (old && JSON.stringify(old)!==JSON.stringify(e)) throw new Error('Identifiant déjà utilisé avec des données différentes'); result.set(key,e); }
  return [...result.values()];
}
export interface ReadOnlyConnector { readonly status: 'simulation'; lire(): Promise<RawEvent[]> }
export const simulation: ReadOnlyConnector = {status:'simulation',async lire(){return [{source:'simulation',externalId:'exemple-1',instant:'2026-01-15T12:00:00+01:00',timezone:'Europe/Paris',kind:'glucose',value:6.1,unit:'mmol/L'}];}};
