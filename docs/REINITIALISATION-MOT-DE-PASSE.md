# Récupération et limites e-mail — diagnostic du 15 novembre 2026

## Résultats réels, sans nouvel envoi d'e-mail

- Fournisseur : Supabase Auth via le Worker Sites. L'origine publique vérifiée est `https://diabia-demo.validpika65.chatgpt.site`.
- Un ancien e-mail contenait `redirect_to=http://localhost:3000`. Le dernier e-mail examiné pointe maintenant vers la bonne page publique `/account/reset-password/` et utilise encore une preuve PKCE. Sa vérification Supabase a renvoyé HTTP 303 : le lien atteint bien le fournisseur, mais sa poursuite dépend du navigateur d'origine. L'erreur locale « absent ou invalide » peut ensuite être renvoyée lorsque les cookies PKCE manquent ; ce n'est pas une preuve que l'e-mail était mal adressé.
- Les erreurs réelles de récupération puis d'inscription sont HTTP 429, code `over_email_send_rate_limit`, notamment entre 16:46 et 16:48, heure de Paris. Changer d'adresse ne contourne pas cette limite de projet.
- Service e-mail intégré gratuit : **2 envois par heure pour le projet**, toutes adresses et opérations d'envoi confondues. La documentation indique aussi un délai utilisateur **par défaut de 60 secondes** entre demandes de récupération/confirmation. Ce second réglage privé n'a pas été lu directement.
- Aucun `Retry-After` n'est présent dans les erreurs observées. L'heure exacte de déblocage n'est pas exposée ; ne pas annoncer une minute garantie à partir du dernier e-mail. Attendre une heure sans nouvelle tentative est une précaution, pas une lecture du compteur serveur.
- Lecture réelle de `/auth/v1/settings` : fournisseur email activé, inscriptions autorisées, `mailer_autoconfirm=false` : la confirmation email reste requise. Aucun réglage fournisseur modifié, aucun abonnement ni nouvel e-mail de test.
- Le service e-mail intégré peut également limiter les destinataires aux adresses autorisées de l'organisation. C'est une restriction distincte du quota ; l'application affiche une erreur de livraison si le fournisseur la signale.

Sources : [limites Supabase](https://supabase.com/docs/guides/auth/rate-limits), [service e-mail intégré](https://supabase.com/docs/guides/auth/auth-smtp), [champs JWT et méthodes de récupération](https://supabase.com/docs/guides/auth/jwt-fields).

## Correction préparée, non déployée

Les nouvelles demandes de récupération utilisent le lien de récupération standard Supabase, sans PKCE. Le modèle d'e-mail gratuit peut ainsi rester inchangé. Après vérification du lien par Supabase, le navigateur reçoit une session dans le **fragment** de l'URL (`#...&type=recovery`). Cela permet d'ouvrir un nouveau lien sur un autre appareil sans demander de modifier le modèle, de payer Pro ou d'ajouter SMTP. L'inscription conserve PKCE et sa confirmation email.

Le fragment est lu en mémoire puis retiré de l'URL. Le refresh token éventuel n'est pas conservé. L'access token de récupération est uniquement transmis par POST au serveur pour le changement, jamais dans une query string, localStorage, cookie de navigation ordinaire ou journal applicatif. La page utilise no-referrer et n'a pas d'analyseur tiers.

Le serveur valide le jeton auprès de Supabase `/user` **avant de lire et faire confiance aux claims** ; il exige l'adresse email confirmée, le sujet identifié, l'émetteur du projet, une expiration future, une méthode AMR `recovery` ou `otp` datant d'au plus une heure et une session active. Le [code officiel de Supabase verifyGet](https://github.com/supabase/auth/blob/master/internal/api/verify.go) émet ses sessions implicites de récupération avec la méthode `OTP` : exiger exclusivement `recovery` casserait ce format. L'autorité acceptée est une authentification email récente vérifiée par le fournisseur ; un jeton OTP valide du même compte (par exemple une connexion par lien email) satisfait aussi cette preuve. Un simple champ navigateur `type=recovery`, une adresse non confirmée ou une session password-only ne suffit pas. La nouvelle valeur doit faire de 12 à 256 caractères et correspondre à la confirmation. Le fournisseur modifie exclusivement le compte du jeton. Après succès, déconnexion globale et effacement des cookies locaux ; un échec de révocation est signalé distinctement.

Les anciens codes PKCE et les modèles personnalisés token_hash restent acceptés selon leurs validations précédentes. Les codes PKCE restent liés au navigateur initial : un ancien e-mail ne se transforme pas en lien multi-appareil après la publication.

Les erreurs 429 distinguent quota e-mail de projet et délai court. Si un Retry-After réel est fourni, il est propagé. Sinon, la réponse indique explicitement une attente **estimée** de 3600 secondes pour le quota email ou de 60 secondes pour une autre limitation. Aucun compte à rebours inventé n'est présenté comme une heure garantie de réouverture. Le formulaire applique une pause partagée entre inscription et récupération sur le navigateur, conservée entre rechargements via un timestamp seul, sans adresse ni preuve. Les connexions restent possibles et aucun retry automatique n'est effectué. Cette pause locale ne remplace pas le quota du fournisseur.

## Configuration

Le code fixe l'origine publique avec `DIABIA_PUBLIC_APP_URL` et refuse localhost/URL mal formée. Cela ne contourne pas une mauvaise configuration fournisseur. Dans [Supabase → URL Configuration](https://supabase.com/dashboard/project/wavyfrzhsxeltflpkufh/auth/url-configuration), conserver :

- Site URL : `https://diabia-demo.validpika65.chatgpt.site`
- Redirect URLs : `https://diabia-demo.validpika65.chatgpt.site/account/reset-password/` et `https://diabia-demo.validpika65.chatgpt.site/account/callback/`

Le dernier e-mail confirme que la destination reset-password publique est désormais utilisée. Il n'est plus nécessaire d'éditer le modèle standard pour la nouvelle récupération. Aucun service payant, custom SMTP ou contournement de confirmation email n'est activé dans cette correction. Le plafond intégré ne peut pas être relevé uniquement par le code applicatif.

## Vérification après publication autorisée

1. Attendre la fin de la limitation sans multiplier les demandes ; demander **un seul nouvel e-mail** après publication. Les anciens liens restent de l'ancien format.
2. Ouvrir ce nouvel e-mail dans Safari/iPhone, y compris si la demande a été faite sur un autre appareil. Le formulaire Nouveau mot de passe doit afficher deux champs.
3. Essayer des mots de passe différents : aucune modification ; puis enregistrer deux valeurs identiques. Vérifier reconnexion avec le nouveau et refus de l'ancien.
4. Réutiliser le lien, essayer sans preuve, une preuve expirée et une session ordinaire : refus. Le lien de vérification email est à usage unique ; un scanner d'e-mail peut le consommer avant ouverture, auquel cas il faut un nouveau lien après le délai.
5. Vérifier que la connexion reste possible pendant une pause des envois ; inscription et récupération doivent partager la pause locale. Tester changement d'onglet et rechargement.

Tests automatisés : fournisseur simulé, signature refusée par Auth, claims non-recovery, expiration, mauvais sujet/émetteur, session révoquée, récupération sans cookies, ancien PKCE, token_hash, quotas et délai réel/estimé. Pas de test sur iPhone/Safari réel ni de nouvel e-mail envoyé pendant le diagnostic. La validation de bout en bout sur le service réel reste à faire après publication autorisée et déblocage des envois.
