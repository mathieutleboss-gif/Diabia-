# Synchronisation Supabase — vérifications du 15 novembre 2026

## Existant et fonctionnement

Comptes Supabase email/mot de passe, cookies serveur HttpOnly, espace local distinct par identité. La table persistante `diabia_snapshots` stocke un instantané versionné (profil, mesures, injections, journal) par compte. La fonction RPC atomique `diabia_sync_write` refuse une révision ancienne. Une suppression distante conserve un marqueur de révision pour éviter qu'un appareil hors ligne réimporte silencieusement une ancienne version. La table distincte `diabia_sync_tests` ne contient qu'un marqueur fictif et sa révision.

RLS activées sur les deux tables : identité propriétaire **et session active** exigées en lecture/écriture, WITH CHECK empêchant la réattribution du compte. Les jetons de sessions révoquées sont refusés même avant leur expiration JWT. Les clés administratives ne sont pas ajoutées au navigateur ni au script de test.

## Corrections

- Permissions réelles trop larges découvertes, dont TRUNCATE qui échappe à RLS. Migration additive `20261115163130_diabia_sync_least_privilege.sql` appliquée au projet existant : seules SELECT, INSERT, UPDATE restent accordées à authenticated ; aucune permission aux visiteurs anonymes. DELETE/TRUNCATE/TRIGGER/REFERENCES retirées, sans aucune suppression de ligne.
- Historique des fichiers de migration aligné sur les versions déjà appliquées dans Supabase : correction du nom du fichier initial, ajout des fichiers de test fictif et de révocation auparavant présents uniquement comme schémas déclaratifs. Ces trois versions ne sont pas réappliquées au projet existant. Leur exécution sur une base locale vierge reste à vérifier ; le CLI Supabase n'est pas installé dans ce chantier.
- Envoi initial d'un historique local non vide mis en file d'attente après lecture de la révision distante. Lors d'un retour sur l'application, une version distante plus récente est récupérée automatiquement uniquement si le contenu local correspond encore à sa dernière empreinte sauvegardée. Des modifications divergentes restent en conflit explicite.
- Retour en ligne : vérification initiale si aucune version distante connue, ou nouvelle mise en file des changements locaux. Aucun effacement automatique lors d'un conflit ou d'une suppression locale. Les contrôles de génération/compte et des modifications pendant une requête restent actifs.

## Essais réels exécutés

Deux comptes temporaires `@example.invalid`, uniquement créés pour cette vérification, sans inscription email ni message envoyé. Deux sessions indépendantes pour le premier compte et une session pour le second. Appels au Worker en processus local avec le vrai Supabase Auth et la vraie base ; le drapeau d'écriture du test ne modifie pas l'environnement du site publié.

Huit groupes de contrôles réussis : connexion des trois sessions ; sauvegarde persistante fictive retrouvée par l'autre session ; isolation RLS en lecture, insertion et réattribution refusées, accès anonyme refusé ; conflit de révision puis récupération de la nouvelle version ; onglet portant la mauvaise identité refusé ; déconnexion globale et refus de l'ancien JWT par la route et par RLS directement ; déconnexion locale ; reconnexion retrouvant les données persistées.

Les deux comptes temporaires et leurs propres données synthétiques ont ensuite été retirés. Les données existant avant le chantier n'ont pas été supprimées ni modifiées : état avant/après identique (0 instantané, 1 marqueur fictif existant). Les tests n'ont jamais exécuté TRUNCATE : les privilèges ont été contrôlés par `has_table_privilege` en lecture seule.

Reproduction réservée au développement : provisionner deux **nouveaux** comptes synthétiques puis transmettre `{url,key,fixtures:[{id,email,password},...]}` au script `scripts/test-supabase-sync.mjs` via stdin caché, jamais arguments ni fichier de secrets. Node 24 derrière le proxy de cet environnement nécessite `node --use-env-proxy scripts/test-supabase-sync.mjs`. Sans ce drapeau les deux premiers essais n'ont pas pu joindre Auth ; ils n'ont envoyé aucun e-mail. Le script ne nettoie pas lui-même les comptes : les retirer explicitement par leurs identifiants de test après vérification, sans toucher aux comptes existants. Ne jamais utiliser de véritables données de santé.

## Limites et actions restantes

La synchronisation des vrais historiques reste **désactivée sur le site publié** (`DIABIA_REMOTE_HEALTH_APPROVED=false`) : l'activer ferait partir les données locales existantes, ce qui n'est pas autorisé par ce chantier. Le test de marqueur fictif existant reste disponible dans Compte. La base et les RPC ont été réellement testées, mais les corrections d'interface sont uniquement enregistrées sur GitHub ; aucune publication de cette version n'est effectuée ici.

Pour poursuivre : vérifier les écrans sur deux navigateurs/appareils avec des espaces ne contenant que des données fictives ; publier le code après accord ; réserver une configuration explicitement fictive pour une recette complète de l'interface sans envoyer l'historique médical local. Avant de recevoir de vraies données, valider la chaîne d'hébergement, les contrats, la protection des données et le périmètre médical applicable. Aucune conformité HDS/RGPD ni certification n'est revendiquée.

Le contrôle Supabase conserve une alerte sur la [protection contre les mots de passe compromis](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), non activée ; aucun passage à une offre payante n'a été effectué. Aucun projet supplémentaire, vraie pompe ou fournisseur d'IA n'a été connecté. Aucun outil de navigateur pilotable n'a permis un essai visuel réel sur plusieurs appareils.
