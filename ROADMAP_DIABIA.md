# Diabia — feuille de route

État du chantier : développement local, sans publication de cette version. Les comptes et le test de synchronisation fictif existaient déjà ; les vraies données de santé restent locales et leur synchronisation distante est désactivée.

## Réalisé dans ce chantier

- Catalogue de 15 fournisseurs avec catégories, liens et accès à confirmer ; aucun partenariat ni connexion active. Le connecteur de démonstration ne lit que des données synthétiques et ne comporte aucune commande d'insuline.
- Modèle expérimental séparé pour glycémie, bolus, débit basal et glucides : unité canonique, instant UTC, fuseau IANA, provenance et identifiant externe. La fusion rejette une collision divergente et est idempotente pour un événement identique ; elle ne constitue pas encore une synchronisation persistante, transactionnelle ou multi-utilisateur.
- Abstraction IA : simulation pré-écrite ; Anthropic, Vertex, OpenAI et fournisseur compatible sont des emplacements désactivés sans appels réseau. Aucun traitement de photographie ni estimation de repas réel n'est implémenté.
- Nutrition fictive : recherche et code saisi, calcul d'une portion ; pas de caméra et pas de source réelle. Pages connexions, données, analyse IA et alimentation, sans fausse connexion.

## Audit et risques restants

- Architecture : Next.js 16, React, TypeScript, stockage local, Worker et Supabase pour les comptes ; la route Next et le Worker ont des comportements distincts à vérifier séparément. Les données locales ne sont pas chiffrées et restent accessibles à une personne accédant au navigateur.
- Sécurité : compléter une revue manuelle systématique et indépendante, analyse des menaces, vérifications des cookies, CSRF, contrôle d'accès, isolation, gestion de session, course entre onglets, XSS, limites de taille et journalisation sans données sensibles. Un audit des dépendances ne prouve pas l'absence de failles.
- Dépendances : `npm outdated` signale notamment Papa Parse 5.7.1 (5.5.4 installé), Tailwind 4.3.5 (4.3.3), React 19.3.1 (19.2.4) ainsi que des versions majeures de TypeScript, ESLint et des types Node. Mises à jour à examiner séparément avec compatibilité et régression ; aucune mise à jour aveugle.
- Sauvegardes et suppression : tester restauration, conflits, échecs réseau, révocation et suppression de toutes les copies, sauvegardes comprises, avec des comptes synthétiques et sur plusieurs appareils. Définir durées et procédure d'incident ; ne pas activer les données de santé distantes avant validation.
- Données : valider bornes cliniques sans rejeter arbitrairement des valeurs atypiques ; gérer provenance multi-appareils, corrections, suppression, événements sans identifiant stable, dates ambiguës et changement d'heure. La fusion mémoire ne résout pas les écritures concurrentes ni les doublons inter-sources.
- Connecteurs : contacter chaque fournisseur, confirmer documentation, disponibilité française, droits, consentement, quotas, types de données, règles de retrait et contrat. Développer et tester uniquement après accès officiel. Nightscout est une plateforme communautaire et nécessite une analyse spécifique de l'instance.
- IA : qualifier l'usage prévu et vérifier restrictions contractuelles, transferts, hébergement, sous-traitants, sécurité et coûts. Les fournisseurs listés sont des interfaces non opérationnelles ; aucun n'est approuvé. Valider la sécurité clinique, les refus et l'évaluation indépendante avant toute donnée réelle. Les photos et estimations exigent un projet séparé avec gestion d'incertitude et validation humaine ; aucune recommandation de dose.
- Nutrition : étudier [Open Food Facts](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/) et sa licence ODbL ainsi que [Ciqual](https://ciqual.anses.fr/cms/en/legal-information) et sa Licence Ouverte. Prévoir données manquantes, portions, provenance, date, limites, licences, attribution et vérification humaine. Aucun accès réel n'est configuré.
- Juridique : qualification éventuelle dispositif médical / marquage CE, finalité, analyse de risques, règles applicables IA ; RGPD (bases articles 6 et 9, information, droits, registre, sous-traitants, transferts, conservation et AIPD si requise) ; vérifier le périmètre HDS de toute la chaîne. Aucune conformité ni certification n'est revendiquée.

## Ordre recommandé

1. Finir l'audit de sécurité et les tests d'intégration sur des données fictives, avec tests de navigateur et appareils réels.
2. Définir la finalité, faire qualifier le produit et choisir une chaîne d'hébergement et des contrats adaptés aux données de santé.
3. Contacter les partenaires prioritaires et obtenir documentation, autorisations et conditions écrites avant d'implémenter les vrais connecteurs en lecture seule.
4. Construire une synchronisation persistante sûre et tester les conflits, la restauration et la suppression ; valider la chaîne avant activation.
5. Choisir une IA autorisée pour l'usage exact ; préparer une évaluation clinique, des tests de sécurité et un contrôle des coûts avant toute activation.
6. Vérifier licences et qualité des sources nutritionnelles, développer les recherches réelles et l'interface photo si justifié.
7. Finaliser les documents légaux et procédures, obtenir les validations nécessaires, effectuer les essais utilisateurs et décider de la publication.
