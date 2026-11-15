# Réinitialisation du mot de passe

Correction préparée sur la branche `codex/mistral-demo-quotas`, sans fusion ni déploiement.

## Constats

L'authentification déployée est servie par le Worker Sites, avec Supabase Auth et cookies HttpOnly. Le serveur Next standard ne fournit pas les routes Auth du Worker. Le callback précédent ne lisait que `?code=`, et reconnaissait une récupération via un cookie de dix minutes. Il ignorait erreurs fournisseur, fragments et hashes OTP. Un retour hors callback était pris en charge par l'écran de connexion avant de traiter les paramètres. Le dernier e-mail de récupération examiné contient bien un lien Supabase de type recovery avec redirect_to vers `/account/callback/` : le template de ce message n'est pas un simple lien vers SiteURL. La cause précise d'un retour initial à la racine reste non confirmée sans les réglages Auth privés ni trace de navigation : l'autorisation de la redirection reste à vérifier.

## Correction

Page publique `/account/reset-password/`, confirmation du mot de passe, vérification de la preuve par Supabase au moment de l'enregistrement. Une session ordinaire ne suffit plus à appeler le point de réinitialisation. Le compte provient exclusivement de la session retournée par la vérification `type: recovery` ou de l'échange PKCE lié à la demande initiale. Aucun identifiant cible n'est accepté. La session de récupération ne devient pas une session de navigation ; après succès les sessions du compte récupéré sont révoquées et les cookies locaux effacés. Un échec de fermeture des sessions est signalé sans masquer le succès de l'enregistrement.

Le format token_hash recommandé ci-dessous fonctionne également dans un autre navigateur. Le PKCE historique reste lié au navigateur initial et au cookie valable dix minutes. Les anciens liens implicites contenant access_token ne sont pas acceptés : demander un nouveau lien. Une erreur après consommation de la preuve nécessite également un nouveau lien. Les preuves restent uniquement en mémoire et dans les requêtes de vérification, sans localStorage, logs applicatifs ou outil d'analyse. Le fragment recommandé évite de placer la preuve dans la requête HTTP d'ouverture de page.

## Réglages externes à vérifier après autorisation de publication

Dans [Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/wavyfrzhsxeltflpkufh/auth/url-configuration) :

- Site URL : `https://diabia-demo.validpika65.chatgpt.site`
- Redirect URLs : conserver `https://diabia-demo.validpika65.chatgpt.site/account/callback/`
- Ajouter exactement `https://diabia-demo.validpika65.chatgpt.site/account/reset-password/`

Dans Authentication → Email Templates → Reset Password (selon le tableau de bord, sous Notifications/Email), remplacer uniquement le lien de réinitialisation par :

```html
<a href="https://diabia-demo.validpika65.chatgpt.site/account/reset-password/#token_hash={{ .TokenHash }}&amp;type=recovery">Créer un nouveau mot de passe</a>
```

Ne pas remplacer les autres templates et ne pas utiliser un simple lien vers SiteURL. Ne faire ce changement qu'une fois la nouvelle page et l'API publiées ensemble. Les réglages privés ne sont pas accessibles via les outils de configuration disponibles ; ils n'ont pas été modifiés. Les clés administratives ne sont pas nécessaires pour cette correction.

## Recette après publication

1. Utiliser un compte de test, demander un nouveau lien, ouvrir l'e-mail et vérifier le titre Nouveau mot de passe et les deux champs.
2. Essayer des mots de passe différents : aucun changement. Puis enregistrer un nouveau mot de passe de 12 caractères minimum.
3. Se reconnecter avec le nouveau mot de passe ; vérifier que l'ancien échoue. Réouvrir le même lien : échec clair, proposition d'un nouveau lien.
4. Avec le template token_hash, ouvrir un nouveau lien dans une fenêtre privée : le compte du lien seul doit être concerné, même si un autre compte est ouvert ailleurs.
5. Essayer un lien expiré et une ouverture sans preuve : aucun changement possible.

Tests automatisés : routes Worker avec Supabase simulé et fonctions URL/protection de routes. Aucun véritable e-mail ni essai visuel sur appareils n'a été effectué dans ce chantier ; ces vérifications restent à réaliser après publication autorisée. Sources : [Supabase mots de passe](https://supabase.com/docs/guides/auth/passwords), [templates](https://supabase.com/docs/guides/auth/auth-email-templates), [URLs](https://supabase.com/docs/guides/auth/redirect-urls).
