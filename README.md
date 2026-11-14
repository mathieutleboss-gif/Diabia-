# Diabia

Application Next.js pour saisir/importer des mesures glycémiques, consulter des analyses informatives et tenir un journal. Les données restent dans le localStorage du navigateur. Les analyses et le score n'ont pas fait l'objet d'une validation clinique ; leur qualification réglementaire dépend de la finalité réelle du produit, pas d'une simple mention « non médical ».

## Installation

Node.js 20+ :

```bash
npm ci
cp .env.example .env.local
npm run dev
```

L'adresse `http://localhost:3000` fonctionne sur l'ordinateur qui exécute l'application. Ce dépôt ne contient aucune adresse de production vérifiée.

## Assistant Mistral : migration préparée, accès limité à une démonstration

Ollama n'est plus nécessaire dans cette version. L'intégration Mistral est un prototype pour tester une offre gratuite disponible au compte. Aucun test réel de qualité, de disponibilité du modèle ni de quota du compte n'a encore été réalisé avec une clé. Le modèle est configurable ; `mistral-small-latest` sert de valeur initiale et doit être vérifié dans le compte.

**Les données de santé réelles sont bloquées.** La route accepte seulement trois identifiants de questions prédéfinies. Le serveur construit des exemples statistiques fictifs sans unité ; aucune question libre, mesure, note, journal ou profil n'est transmis. Le navigateur ne lit pas le stockage personnel sur la page Assistant.

### Plafonds

- 10 appels sur 24 heures glissantes et 2 sur 60 secondes par compte authentifié ; les échecs et annulations consomment aussi une demande.
- Plafond global toutes instances confondues : minimum des quotas de requêtes et de tokens, avec 20 % de marge (sauf plafond de requêtes égal à 1) et réservation pessimiste de 4096 tokens par appel (réponse limitée à 600 tokens ; prompts fixes courts).
- Les quatre limites réelles doivent être renseignées. Fenêtres glissantes de 60 secondes et 24 heures pour protéger aussi les fenêtres calendaires du fournisseur.
- Réservation atomique Redis, persistante après redémarrage, avant tout appel fournisseur. Pas de repli sur un compteur mémoire si Redis est indisponible. `429` et `Retry-After` lorsque le plafond est atteint.
- Aucun retry automatique, fournisseur alternatif ni bascule payante. Utiliser un projet/compte API dédié : les appels effectués ailleurs ne sont pas comptabilisés par Diabia.
- La configuration ne remplace pas les contrôles de facturation du fournisseur : vérifier le mode gratuit, désactiver toute recharge automatique et conserver des plafonds internes. Si Redis gratuit est épuisé, l'assistant se bloque.

### Prérequis d'activation (non inclus dans l'application actuelle)

1. Créer le compte Mistral en mode gratuit, vérifier l'accès au modèle et ses quotas ; renseigner `.env.local` **sur le serveur uniquement**. Désactiver l'utilisation des données pour l'entraînement dans les réglages API (séparés du Chat).
2. Raccorder un Redis REST dédié, durable, sans éviction des clés de quota, partagé par toutes les instances. Ne jamais vider/restaurer un ancien compteur tant que la même clé fournisseur reste active dans la fenêtre des dernières 24 heures.
3. Ajouter une authentification et une passerelle serveur. La passerelle vérifie la session réelle, retire tous les en-têtes `x-diabia-*` fournis par le client et injecte `x-diabia-user` (identifiant stable), `x-diabia-timestamp` (millisecondes) et `x-diabia-signature` (HMAC-SHA256 hex de `timestamp + '\n' + user`, avec `ASSISTANT_AUTH_SECRET`). Renouveler les en-têtes à chaque requête, jamais côté navigateur. L'API refuse les signatures de plus de 60 secondes. Aucun identifiant localStorage/cookie libre ni IP déclarée par le client n'est accepté comme compte.
4. Vérifier le comportement avec deux comptes et plusieurs instances avant ouverture. Tant que cette connexion manque, toute demande valide reste bloquée (401). Tant que la configuration manque, aucun appel IA ne part (503).

La création de comptes ne suffit pas à garantir une équité parfaite (comptes multiples), mais le plafond global protège le quota partagé.

## Bilan et cadre réglementaire

Voir [docs/ETAT-DIABIA.md](docs/ETAT-DIABIA.md) pour les fonctionnalités présentes, le reste à faire et les sources vérifiées le 14 novembre 2026. L'offre gratuite Mistral n'est **pas validée pour le traitement médical de Diabia**. Une offre européenne ou une désactivation de l'entraînement ne constitue pas une certification HDS ni une conformité RGPD globale.

## Vérifications

```bash
npm test
npx tsc --noEmit
npm run build
```

Architecture : `app/` pages et API ; `lib/analyses/` règles statistiques ; `lib/storage.ts` stockage, migration, export et suppression ; `lib/ia/cloud.ts` identité et quotas ; `tests/` régressions.
