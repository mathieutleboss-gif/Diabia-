# Bilan initial de Diabia — 14 novembre 2026

Ce bilan conserve l’état de l’audit initial. Pour l’état actuel, les améliorations livrées et les tâches restantes, consulter [PUBLICATION.md](PUBLICATION.md).

Bilan établi à partir du code du dépôt mathieutleboss-gif/Diabia-, base 6cc8211. « Présent dans le code » ne signifie ni déployé ni validé cliniquement.

## Présent avant cette modification

- Accueil, présentation, navigation et états d'erreur.
- Import CSV, saisie manuelle, conversion d'unités et validation des mesures.
- Liste des mesures et tableau de bord avec graphiques.
- Statistiques, score, tendances, variations, plages horaires, corrélations et indications de confiance.
- Journal (événements et contexte), profil.
- Stockage local versionné, migration, export, restauration et suppression des données.
- Assistant Ollama llama3.2:3b avec rapport personnel, validation et limite en mémoire de 10 appels/minute par adresse déclarée.
- Tests des analyses, unités, CSV et de certaines erreurs API.

## Préparé dans cette modification

- Remplacement de la route Ollama par Mistral, sans dépendance au modèle local.
- Mode démonstration limité côté serveur à des questions fixes de statistiques fictives ; aucune donnée de santé envoyée au fournisseur.
- Authentification de l'identité provenant d'une passerelle serveur par HMAC et timestamp ; aucune connexion utilisateur complète n'est encore fournie.
- 10 appels/24 h et 2/minute par compte ; plafonds globaux requêtes ET tokens avec marge de 20 % (sauf plafond de requêtes égal à 1).
- Compteur partagé Redis atomique ; arrêt en cas de configuration ou compteur indisponible ; pas de relance automatique ou de bascule payante.
- Interface et documentation indiquant les limites et l'état réel de l'intégration.

## À faire pour rendre la démonstration utilisable

- Retrouver ou établir un hébergement et une URL publique ; aucun déploiement GitHub ni Site accessible n'a été retrouvé pendant cet audit.
- Configurer une clé de compte gratuit Mistral, confirmer l'accès au modèle et recopier les quotas réels. Comparer la qualité avec l'ancien modèle sur des cas fictifs avant d'affirmer un gain de performance.
- Configurer Redis partagé et les contrôles de facturation de chaque offre.
- Mettre en place une vraie connexion utilisateur et la passerelle de signature serveur.
- Tester de bout en bout avec l'hébergement, le compte fournisseur et Redis réels, y compris dépassement des plafonds, concurrence et redémarrages.

## À faire avant des utilisateurs et données de santé réels

- Définir la finalité exacte : visualisation, information générale, aide au diagnostic ou au traitement. Faire évaluer la qualification de logiciel dispositif médical selon les fonctions effectives ; un avertissement ne dispense pas de cette évaluation.
- Définir les bases légales RGPD (articles 6 et 9), information, droits, durée de conservation, registre, sécurité et contrats de sous-traitance (article 28), transferts éventuels. Évaluer la nécessité d'une AIPD ; elle est obligatoire si les critères de risque élevé sont réunis.
- Examiner le périmètre HDS pour tous les hébergeurs/sous-traitants concernés et les activités couvertes par leurs certificats, y compris la chaîne IA si applicable. Aucune preuve de couverture HDS du service Mistral gratuit n'a été obtenue.
- Obtenir des conditions fournisseur compatibles avec la finalité et les données réelles : l'offre gratuite ne suffit pas à prouver cette compatibilité. Vérifier résidence, rétention, sous-traitants, confidentialité et usage pour l'entraînement.
- Évaluer les règles applicables du règlement IA selon la qualification et le calendrier ; faire valider les fonctions médicales, la qualité clinique et les alertes par des professionnels qualifiés.
- Revoir les recommandations de l'ancien prompt, notamment « conseils personnalisés » et causes probables. Le prompt historique n'est plus utilisé par la route cloud.
- Ajouter ensuite un flux personnel minimisé, avec information utilisateur appropriée et contrôles vérifiables. Remplacer un nom par un identifiant ou supprimer des dates n'anonymise pas automatiquement les données de santé.

L'absence actuelle d'utilisateurs permet les essais fictifs ; elle ne dispense pas des obligations dès que des données personnelles réelles sont traitées, même celles du créateur.

## Sources officielles consultées

- [Conditions Gemini](https://ai.google.dev/gemini-api/terms) : usage clinique/conseils médicaux interdits ; services payants requis pour mettre un client API à disposition dans l'EEE. Gemini gratuit écarté pour ce projet.
- [Politique d'usage Mistral](https://legal.mistral.ai/terms/usage-policy/) : pas de conseil professionnel sans qualification appropriée, incluant diagnostic et recommandations de santé. La démonstration retenue se limite à des nombres fictifs sans interprétation médicale.
- [Offres Mistral](https://mistral.ai/pricing/) et [documentation abonnements](https://docs.mistral.ai/admin/billing-usage/subscriptions) : offre gratuite limitée ; les quotas réellement attribués doivent être contrôlés dans le compte, pas inventés.
- [Données et entraînement Mistral](https://help.mistral.ai/en/articles/347617-do-you-use-my-user-data-to-train-your-artificial-intelligence-models), [désactivation](https://help.mistral.ai/en/articles/455207-can-i-opt-out-of-my-input-or-output-data-being-used-for-training) : des données du mode gratuit peuvent servir à l'entraînement ; réglage API à vérifier.
- [Zéro rétention Mistral](https://help.mistral.ai/en/articles/347612-can-i-activate-zero-data-retention-zdr) : proposé seulement en pay-as-you-go pour certains appels, distinct du réglage d'entraînement.
- [HDS — G_NIUS / ANS](https://gnius.esante.gouv.fr/fr/reglementation/fiches-reglementation/hebergement-des-donnees-de-sante-hds) : périmètre des activités d'hébergement de données de santé recueillies dans la prévention, le diagnostic, les soins et le suivi.
- [IA et santé — CNIL](https://www.cnil.fr/fr/ia-et-sante-developper-et-evaluer-des-systemes-ia-conformes) : obligations pour le développement et l'évaluation de systèmes d'IA en santé.

Ce bilan constitue une analyse technique initiale et ne vaut pas validation juridique ou clinique du produit.
