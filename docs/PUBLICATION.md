# Diabia — état et passage à une bêta

Mis à jour le 14 novembre 2026. Ce document décrit l’état technique ; il ne certifie ni conformité juridique ni efficacité clinique.

## Disponible dans la démonstration privée

- Saisie, édition, suppression, historique et graphiques des mesures.
- Doses d’insuline en U, totaux renseignés, histogramme et dernières doses.
- Profil modernisé, préférences de saisie, journal chronologique.
- Exemple fictif de 140 mesures et 84 doses, sans remplacement d’un historique personnel.
- Import CSV avec aperçu, unités explicites, rejet des doses invalides, fusion par défaut et doublons stricts ignorés. Le remplacement demande une confirmation supplémentaire.
- Recherche, filtre des doses et export CSV de la sélection ; export JSON complet depuis Profil.
- Restauration JSON validée avant écriture et confirmée, contrôle des versions, identifiants uniques ; tentative de retour aux anciennes clés en cas d’échec d’écriture.
- Gestion des erreurs de stockage, signalement des données JSON corrompues et refus de les écraser lors d’une saisie ordinaire.
- Guide d’utilisation, page sur le traitement local des données, dialogues natifs accessibles au clavier.
- Indicateur Diabia présenté comme expérimental, sans validation clinique.
- Dépendances mises à jour ; vérifications automatiques préparées dans `.github/workflows/verify.yml`.

Le site de consultation reste privé : https://diabia-demo.validpika65.chatgpt.site . La copie Sites est statique. La route IA serveur existe dans la proposition GitHub, mais n’est pas exécutée sur cette copie.

## Ce qui reste à décider ou fournir par le porteur du projet

| Sujet | Ce qu’il faut fournir ou faire | Ce qui pourra ensuite être réalisé techniquement |
| --- | --- | --- |
| Éditeur du service | Nom/raison sociale, statut, pays et contact professionnel ; public cible et pays visés | Renseigner les mentions légales et le contact sans informations inventées |
| Finalité | Valider la proposition : suivi descriptif et journal, sans diagnostic ni recommandation de dose ; préciser si une finalité médicale est prévue | Ajuster les fonctions et textes au périmètre validé |
| Cadre santé | Faire évaluer la qualification du logiciel, le score et les analyses par des personnes compétentes ; déterminer les obligations applicables | Appliquer les exigences vérifiables et les retours de l’évaluation |
| Données | Valider le choix stockage local seul ou synchronisation ; encadrer les traitements réels (bases légales, droits, rétention, contrats, transferts, AIPD si nécessaire) | Préparer la conservation, la suppression, les sauvegardes et les contrôles d’accès correspondant au choix |
| Hébergement | Pour un traitement serveur de données réelles, sélectionner le prestataire et faire vérifier le périmètre HDS applicable et les contrats ; l’offre Sites ne constitue pas une preuve HDS | Déployer le backend et tester la chaîne complète sur cet hébergement |
| IA | Créer/activer le compte fournisseur en mode gratuit, confirmer les droits d’usage, les paramètres d’entraînement/rétention et les quotas réels ; configurer la clé via les secrets du serveur, jamais en message ni dans le code | Tester le modèle et la clé, raccorder les limites et mesurer qualité/latence. L’IA sur les données personnelles reste bloquée tant que son cadre n’est pas validé |
| Compteur | Activer un compte Redis REST ou un compteur durable adapté au backend et configurer les secrets | Tester les plafonds sur les instances de production et leurs redémarrages |
| Identité | Choisir l’accès des futurs utilisateurs : connexion ChatGPT proposée par Sites ou comptes autonomes sur un hébergement adapté | Raccorder l’identité serveur vérifiée aux comptes et aux quotas. Les en-têtes d’identité de navigateur ne doivent jamais être acceptés sans validation |
| Adresse | Choisir/réserver un domaine si souhaité | Raccorder le DNS et vérifier HTTPS ; un domaine personnalisé n’est pas indispensable à une bêta |
| Validation terrain | Organiser des essais sur téléphones et navigateurs réels et, pour les fonctions concernées, une évaluation par des professionnels | Corriger les problèmes observés avant ouverture progressive |

L’assistant ne peut pas signer les contrats, attester une certification, accepter des conditions au nom d’un professionnel, déclarer l’efficacité médicale, ni disposer de comptes et secrets non fournis. Il peut intégrer les services une fois leurs accès et leur cadre établis.

## Limites à conserver visibles

- Le stockage local n’est pas une sauvegarde distante. Changer de navigateur ou d’adresse de site ne transfère pas les données. L’application ne chiffre pas le localStorage ni les exports.
- Le total d’insuline est partiel si des doses ne sont pas renseignées ; les événements de journal non structurés ne comptent pas comme injections.
- Les doublons d’import sont reconnus uniquement pour des enregistrements identiques : même instant, glycémie, dose et note. Deux mesures proches ne sont pas supprimées automatiquement.
- Une restauration ou une suppression confirmée est destructive ; conserver un export avant de continuer. Une panne persistante du stockage peut empêcher aussi un retour arrière.
- Le contrôle des dépendances ne remplace pas un audit de sécurité complet.
- Aucun test navigateur visuel n’a été effectué : les outils de navigateur de cet environnement ne sont pas disponibles.
- L’IA du prototype n’a pas été évaluée avec une clé réelle ni validée pour les données de santé.

## Vérifications à exécuter avant chaque livraison

```bash
npm ci
npm test
npx tsc --noEmit
npm run build
npm audit --omit=dev
```

Tester aussi une importation puis un réimport sans doublement des doses, le choix des unités, les heures locales, l’export/restauration, l’effacement confirmé et le refus d’écriture par le navigateur. En production serveur : tester l’isolation entre deux comptes, les quotas globaux en concurrence et la récupération après panne. Ne pas ouvrir les données de santé réelles sur la seule base d’une compilation réussie.

## Sources de référence

- ANS / G_NIUS, [hébergement des données de santé](https://gnius.esante.gouv.fr/fr/reglementation/fiches-reglementation/hebergement-des-donnees-de-sante-hds).
- CNIL, [IA et santé](https://www.cnil.fr/fr/ia-et-sante-developper-et-evaluer-des-systemes-ia-conformes).
- Mistral, [politique d’usage](https://legal.mistral.ai/terms/usage-policy/) et paramètres de confidentialité du compte API, à recontrôler au moment de l’activation.
