export function creerRapportIA(
analyse:any,
profil:any,
journal:any[]
){



return {


profil:{


diabete:
profil?.diabete || "Non renseigné",


appareil:
profil?.appareil || "Non renseigné",


objectif:
profil?.objectif || "Non renseigné"


},





glycemie:{


tempsDansCible:
analyse.cible || 0,


hyperglycemies:
analyse.hyper || 0,


hypoglycemies:
analyse.hypo || 0,


score:
analyse.score || 0


},






stabilite:{


variations:
analyse.variations?.nombre || 0,


tendance:
analyse.tendance || "Non analysée"


},






habitudes:{


journalTotal:
journal.length,


dernierEvenements:
journal.slice(-10)


},






resume:

analyse.message || 
"Pas encore de résumé disponible."


};


}