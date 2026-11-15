# Diabia : état actuel et dernière ligne droite

État au 14 novembre 2026. Les parcours de compte et le test fictif entre deux appareils ont été confirmés par le propriétaire. La démonstration reste privée.

## Livré

- Comptes Diabia email/mot de passe, confirmation, récupération, connexion/déconnexion.
- Test de synchronisation fictif séparé : aucune donnée de santé ni champ libre dans sa table.
- Export des enregistrements du compte en ligne ; export/restauration JSON et CSV locaux existants.
- Déconnexion globale avec contrôle des sessions révoquées dans le Worker et les règles RLS des deux tables.
- Suppression volontaire du compte : mot de passe revérifié, confirmation SUPPRIMER, révocation des sessions, suppression Auth et cascade des enregistrements actifs. Clé administrative uniquement dans l’environnement Supabase de la fonction dédiée. Le Worker et le navigateur n’en disposent jamais. Les fichiers téléchargés et autres navigateurs ne sont pas effacés à distance.
- Import guidé, unités, doses indépendantes, doublons, aperçu et confirmations ; fiabilité vérifiée par les tests du dépôt. Les formats des appareils réellement visés ne sont pas encore certifiés.
- Route Groq préparée pour trois questions fixes fictives. Aucun rapport médical, texte libre, nom ou profil n’est envoyé au fournisseur. Compteur Redis partagé atomique : 10 demandes/24h et 2/minute par compte, plafonds globaux requêtes et tokens avec marge, pas de retry ni bascule payante. L’IA reste désactivée sans configuration complète.
- Confidentialité réécrite pour refléter Supabase, les comptes, cookies, données locales, test fictif et droits disponibles.

## À faire dans l’ordre

1. **Éditeur et finalité** : fournir nom/raison sociale, pays, contact professionnel et contact des droits ; confirmer public/pays/âge visés et finalité. Les documents légaux restent des brouillons, sans coordonnées inventées.
2. **Traitement santé et hébergement** : faire qualifier les fonctions et les traitements ; sélectionner et contractualiser une chaîne adaptée. Vérifier les certificats HDS et leur périmètre si applicable (hébergement, exploitation, sauvegardes, sous-traitants). La localisation à Paris et le prix gratuit ne prouvent aucune conformité HDS. Sites n’est pas validé pour recevoir les données médicales.
3. **Données et exploitation** : valider bases légales, information, registre, sous-traitants/transferts, durées de conservation et AIPD si requise. Configurer les sauvegardes chiffrées, leur rétention, le plan de restauration et la procédure d’incident sur l’hébergement retenu. Ne pas inventer de durée de rétention pour les journaux des prestataires.
4. **Synchronisation réelle** : rester sur DIABIA_REMOTE_HEALTH_APPROVED=false jusqu’à validation du point précédent. Migrer si nécessaire, tester sur un environnement fictif représentatif, puis activer et vérifier deux comptes, deux appareils, conflits/hors ligne, export et suppression. Le code ne suffit pas à autoriser juridiquement cette activation.
5. **IA** : pour une démonstration gratuite non médicale, activer un compte Groq gratuit et un compteur Redis REST, vérifier conditions/modèle/quotas actuels puis configurer les secrets. La clé ne doit pas être transmise en message. Pour une analyse médicale personnelle, choisir et contractualiser une solution expressément adaptée puis faire évaluer les résultats. L’adaptateur gratuit ne l’autorise pas.
6. **Validation terrain** : fournir un export anonymisé représentatif de chaque appareil et unité visés ; vérifier avec une personne compétente les résultats et limites. Les deux premiers tests de comptes sont déjà validés par le propriétaire ; les nouveaux contrôles nécessitent une recette de l’interface sur appareils réels.
7. **Bêta puis publication** : renseigner les documents, tester restauration/incident, décider de l’audience puis ouvrir progressivement. Prévoir contact support et suivi des erreurs sans données médicales dans les logs. Une publication publique ou une boutique d’applications est une étape distincte.

## Répartition

L’agent peut développer, tester, intégrer les secrets dans les coffres et appliquer les retours. Le propriétaire choisit l’éditeur, signe les contrats et donne accès aux comptes nécessaires ; les validations juridiques et cliniques appartiennent aux personnes compétentes. Aucun abonnement payant n’est autorisé par ce document.

## Exploitation du compte

- Exporter depuis Profil pour les données locales et depuis Compte pour celles en ligne.
- Tester toute restauration sur un environnement séparé avant de remplacer des données.
- Ne jamais envoyer de mot de passe, jeton, clé, CSV personnel ou corps de requête dans les logs.
- En cas de compromission : fermer les sessions, révoquer/faire tourner les secrets concernés, vérifier les accès et appliquer la procédure d’incident validée. Les obligations de notification doivent être déterminées avec le responsable du traitement.
- Supabase signale encore que la protection contre les mots de passe compromis n’est pas activée : https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Cette option est réservée au plan Pro et supérieur selon la documentation actuelle ; aucun abonnement n’a été souscrit.
