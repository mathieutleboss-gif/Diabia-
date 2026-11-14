# Comptes Diabia et synchronisation

## État

Implémentation préparée, service distant non provisionné et non activé. Sans configuration, la connexion ChatGPT et les espaces locaux existants restent utilisés. La publication de ce code ne crée pas de comptes, de base ni de synchronisation effective.

## Architecture

Le Worker Sites sert les routes `/api/auth/*`, `/api/cloud/session` et `/api/sync`. Il vérifie les sessions auprès de Supabase Auth. Les jetons restent dans des cookies Secure, HttpOnly et SameSite=Lax ; ils ne sont jamais retournés au JavaScript du navigateur. Les mutations vérifient l'origine. L'identité n'est jamais acceptée depuis un en-tête fourni par le navigateur.

Les données locales sont isolées sous l'identifiant du compte Diabia. L'utilisateur peut transférer explicitement les anciennes données locales depuis Compte. La synchronisation sauvegarde un instantané du profil, des glycémies, des injections et du journal. Une révision atomique protège contre l'écrasement entre appareils ; un conflit exige une décision explicite. Une suppression locale suspend les envois automatiques.

## Activation pour tests fictifs

1. Installer et connecter le plug-in Supabase, puis sélectionner ou créer un projet gratuit. Aucun abonnement payant n'est requis par le code ; vérifier les limites actuelles du fournisseur.
2. Appliquer `supabase/migrations/202611140001_diabia_sync.sql` au projet de test. Vérifier réellement avec deux comptes que chacun ne peut lire ou modifier que sa ligne, et qu'une ancienne révision reçoit un conflit.
3. Dans Supabase Auth, activer email/mot de passe et confirmation email. Ajouter l'URL du site et l'URL de redirection exacte `https://diabia-demo.validpika65.chatgpt.site/account/callback/`. Configurer l'envoi d'emails autorisé : le service d'essai peut limiter les destinataires et les volumes. La confirmation et la récupération PKCE doivent être ouvertes dans le même navigateur que la demande, sous dix minutes.
4. Configurer les variables d'exécution Sites suivantes (ne pas les committer) :
   - `DIABIA_SUPABASE_URL` : origine HTTPS du projet.
   - `DIABIA_SUPABASE_KEY` : clé publishable ou anon. Ne jamais utiliser service_role ou une clé secrète administrateur.
   - `DIABIA_REMOTE_HEALTH_APPROVED` : `false` par défaut. La synchronisation reste bloquée. Pour un environnement exclusivement fictif, activer explicitement `true` après configuration et validation.
5. Redéployer et tester inscription, confirmation, connexion, récupération, déconnexion, expiration/rafraîchissement de session, deux appareils, mode hors ligne, conflits et suppression locale. L'accès privé externe à Sites reste en place : ce n'est pas encore une application ouverte au public.

## Avant de vraies données de santé

L'offre gratuite de Supabase ne prouve pas une conformité HDS ni l'adéquation juridique du traitement. Ne pas activer de collecte médicale réelle sur cette seule base. Il reste à qualifier le traitement et les obligations applicables (RGPD, contrats de sous-traitance, localisation/transferts, hébergement HDS si applicable), valider tous les hébergeurs impliqués, la conservation, les sauvegardes, les droits et la suppression de compte/données, la sécurité et les procédures d'incident. Les fonctionnalités médicales doivent aussi faire l'objet d'une qualification réglementaire.

Les tests automatisés utilisent un fournisseur simulé ; aucun test réel d'email, de base ou de synchronisation entre deux appareils n'est encore validé. Le serveur Next standard ne sert pas ces nouvelles routes : elles sont implémentées dans le Worker produit par `npm run build:site`.

Documentation fournisseur : https://supabase.com/pricing et https://supabase.com/docs/guides/auth/passwords et https://supabase.com/docs/guides/database/postgres/row-level-security
