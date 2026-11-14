import type { Mesure } from "./analyses/types";
import { obtenirTimestamp } from "./dates";
import { lireDoseInsuline } from "./insuline";

/** Même instant, glycémie, dose et note : probable réimport du même enregistrement. */
export function fusionnerMesures(actuelles: Mesure[], nouvelles: Mesure[]) {
  const cle = (m: Mesure) => {
    const temps = obtenirTimestamp(m);
    return temps === null ? null : JSON.stringify([temps, Number(m.glycemie), lireDoseInsuline(m.insuline), m.note?.trim() || ""]);
  };
  const connues = new Set(actuelles.map(cle).filter(c => c !== null));
  const resultat = [...actuelles]; let doublons = 0;
  for (const mesure of nouvelles) {
    const key = cle(mesure);
    if (key !== null && connues.has(key)) { doublons++; continue; }
    resultat.push(mesure); if (key !== null) connues.add(key);
  }
  return { mesures: resultat, ajoutees: resultat.length - actuelles.length, doublons };
}
function cellule(value: string | number | undefined) {
  const text = String(value ?? "");
  const protege = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${protege.replace(/"/g, '""')}"`;
}
export function exporterMesuresCSV(mesures: Mesure[], injections: import("./analyses/types").InjectionInsuline[] = []): string {
  const rows = mesures.map(m => {
    const temps = obtenirTimestamp(m);
    const date = temps === null ? m.date || "" : new Date(temps).toLocaleDateString("fr-FR");
    const heure = temps === null ? m.heure || "" : new Date(temps).toLocaleTimeString("fr-FR", {hour:"2-digit", minute:"2-digit",second:"2-digit"});
    const dose = lireDoseInsuline(m.insuline);
    return [m.glycemie,date,heure,dose === null ? "" : dose,m.note].map(cellule).join(";");
  });
  for (const i of injections) rows.push(["",i.date,i.heure,i.dose,i.note].map(cellule).join(";"));
  return "\uFEFFglycémie;date;heure;insuline;note\r\n" + rows.join("\r\n");
}

export function fusionnerInjections(actuelles: import("./analyses/types").InjectionInsuline[], nouvelles: import("./analyses/types").InjectionInsuline[], mesures: Mesure[] = []) {
  const cle=(i:{timestamp?:string;date?:string;heure?:string;dose:number;note?:string})=>JSON.stringify([obtenirTimestamp(i),i.dose,i.note?.trim()||""]);
  const exacte=(i:import("./analyses/types").InjectionInsuline)=>`${cle(i)}:${i.type||"non_precise"}`;
  const connus=new Set(actuelles.map(exacte));
  const anciens=new Map<string,number>();
  for(const m of mesures){const dose=lireDoseInsuline(m.insuline);if(dose===null)continue;const key=cle({...m,dose});anciens.set(key,(anciens.get(key)||0)+1);}
  const resultat=[...actuelles];let doublons=0;
  for(const i of nouvelles){const key=cle(i);if(connus.has(exacte(i))){doublons++;continue;}if((anciens.get(key)||0)>0){anciens.set(key,anciens.get(key)!-1);doublons++;continue;}resultat.push(i);connus.add(exacte(i));}
  return {injections:resultat,ajoutees:resultat.length-actuelles.length,doublons};
}

export function exporterInjectionsCSV(injections:import("./analyses/types").InjectionInsuline[]) {
  return "\uFEFFdate;heure;insuline;type_insuline;note;timestamp\r\n"+injections.map(i=>[i.date,i.heure,i.dose,i.type||"non_precise",i.note,i.timestamp].map(cellule).join(";" )).join("\r\n");
}
