# Hébergement, IA et documents à finaliser

Vérification documentaire du 14 novembre 2026. Ce dossier est une préparation technique, pas un avis juridique, une preuve de certification ou une validation clinique.

## Hébergement des données médicales

La chaîne actuelle est Sites pour le Worker et Supabase Paris pour Auth et le test fictif. Aucune preuve de couverture HDS de l’ensemble de cette chaîne n’a été obtenue. Les mesures, doses et profils médicaux restent locaux. L’offre gratuite actuelle ne doit pas être présentée comme conforme à un usage médical distant.

Pour comparer des hébergeurs : partir de la [liste ANS des hébergeurs certifiés](https://esante.gouv.fr/produits-services/hds/liste-des-hebergeurs-certifies), demander le certificat en cours et les activités couvertes, la région, les sous-traitants, les responsabilités d’exploitation et sauvegarde, les contrats et les coûts. Une infrastructure certifiée ne certifie pas automatiquement l’application et ses exploitants. [Périmètre et obligations HDS — ANS/G_NIUS](https://gnius.esante.gouv.fr/fr/reglementation/fiches-reglementation/hebergement-des-donnees-de-sante-hds).

Le compte utilise de vraies données personnelles (email et sessions), même si le contenu du test est fictif. Il faut finaliser les obligations RGPD propres à ce traitement. [Questions CNIL pour les applications de santé](https://www.cnil.fr/fr/applications-mobiles-en-sante-et-protection-des-donnees-personnelles-les-questions-se-poser).

## IA gratuite : correction de la piste Mistral

La [documentation actuelle Mistral sur les limites](https://docs.mistral.ai/admin/billing-usage/usage-limits) indique que le mode gratuit n’inclut pas l’API et que celle-ci nécessite activation de la facturation. L’ancienne proposition de clé API Mistral gratuite n’est donc plus retenue. Aucun abonnement n’a été activé.

Groq publie des [limites de plan gratuit](https://console.groq.com/docs/rate-limits) et son [accord de services](https://console.groq.com/docs/legal/services-agreement) prévoit l’intégration dans une application. Ce même accord indique que les modèles ne doivent pas servir de conseils médicaux ou autres conseils professionnels. La [politique de données](https://console.groq.com/docs/your-data) doit être examinée avec les exceptions de rétention et les sous-traitants. Cela ne prouve ni conformité HDS ni adéquation à l’interprétation de données médicales.

L’adaptateur retenu est uniquement une démonstration de statistiques fictives, bloquée sans clé gratuite confirmée et quotas réels. Aucun flux personnel n’est activé, aucune performance clinique ou amélioration mesurée n’est annoncée. Le modèle et la licence doivent être recontrôlés dans le compte avant activation. Le passage ultérieur à une solution médicale est un nouveau choix contractuel et technique.

## Brouillon de notice : informations à compléter

- Responsable du traitement/éditeur : [nom ou raison sociale, statut, pays, adresse professionnelle].
- Contact support et exercice des droits, DPO si désigné : [coordonnées].
- Finalités et public : [suivi descriptif/journal ou finalité médicale précisément qualifiée ; pays/âge].
- Traitements : compte/email/sessions ; test fictif ; données médicales si et seulement si ultérieurement autorisées.
- Bases légales articles 6 et 9 selon les traitements : [à déterminer et valider]. Ne pas présenter un clic générique comme une solution universelle.
- Destinataires, prestataires et transferts hors EEE : [contrats et garanties réels].
- Conservation : [durées par catégorie, journaux, comptes inactifs, sauvegardes et suppression].
- Droits et modalités, réclamation auprès de la CNIL : [contact et procédure opérationnels].
- Mesures de sécurité et limites : chiffrement en transit, secrets serveur, RLS/sessions ; stockage local et exports non chiffrés par Diabia.

Ces champs ne sont pas des mentions légales publiables en l’état. Les conditions d’utilisation doivent aussi préciser les fonctions, limites, disponibilité, responsabilité applicable et modalités de fermeture du compte après validation appropriée.
