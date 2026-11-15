# Calculateur — interface, persistance et recette

## Implémenté

Page Alimentation réorganisée : recherche locale pendant la saisie, catégories officielles Ciqual et raccourcis, filtres cru/cuit, liste paginée avec vignettes 60 px, sélection au clavier ou au toucher, favoris, récents et récapitulatif multi-aliments. Interface claire, styles uniquement dans `.nutrition-*`, disposition en deux colonnes puis une colonne sous 800 px, poids en saisie décimale mobile, annonces accessibles, libellés, état favori et erreur. Les transitions respectent la préférence système de réduction des animations. Le reste de l'application ne possède pas de thème sombre fonctionnel : le calculateur conserve le thème clair existant.

52 photographies réelles et inspectées, optimisées par les vignettes Commons (705 857 octets au total), chargées à la demande depuis l'application ; pas de requête vers le photographe quand l'utilisateur recherche un aliment. Le riz cru et le riz cuit possèdent deux photographies distinctes. Les références non couvertes affichent un emplacement neutre. Chaque photo est associée par identifiant ET libellé exacts ; aucune photo d'un aliment cuit n'illustre un aliment cru. Les crédits et licences sont consultables dans l'interface et `public/foods/CREDITS.md`. Voir `docs/FOOD_PHOTOS.md` pour l'importation progressive des prochains lots.

Les catégories sont extraites des colonnes D/E du classeur officiel déjà utilisé, en conservant exactement les identifiants, libellés et glucides. Le générateur est reproductible. Un contrôle SHA-256 du sous-ensemble nutritionnel garantit que les 3484 anciennes valeurs et leurs libellés n'ont pas changé.

## Persistance

Favoris et récents stockés sous `diabia_nutrition_preferences_v1` via l'espace local existant du compte (ou invité). Les comptes ne partagent pas leurs listes. Seuls les identifiants Ciqual sont persistés, pas les poids ; les récents sont dédupliqués et limités à 12, les favoris à 200. Les versions invalides/corrompues ne sont pas remplacées silencieusement. Une erreur d'écriture est visible et conserve les anciennes préférences. Les autres onglets rafraîchissent leurs listes lors d'un événement de stockage.

Ces préférences ne sont pas ajoutées à la synchronisation des historiques médicaux ni aux exports existants. Elles restent propres à cet appareil. Le récapitulatif est temporaire, limité à 20 aliments, vidé lorsqu'on quitte ou recharge la page ; les autres données utilisateur ne sont jamais supprimées par le calculateur.

## Calcul

Chaque ligne utilise son aliment exact, son état cru/cuit et son poids en grammes. Limite existante : 0 < poids <= 2000 g par ligne ; décimales point ou virgule. Valeur absente ou poids invalide : pas de total prétendument complet. Le total est obtenu par addition des valeurs non arrondies, puis arrondi final à deux décimales. Les lignes affichent elles aussi deux décimales : leur somme affichée peut donc différer d'un centième du total. Aucune conversion implicite cru/cuit, aucune confusion avec les sucres, aucune photo analysée ni calcul de dose.

## Vérifications et limites

Tests automatisés de recherche, catégories, filtre de préparation, favoris, récents, persistance entre lectures, isolation A/B, stockage corrompu, sélection unique, retrait, modification des portions, limites, valeur absente et arrondi du total. Contrôle des 52 fichiers JPEG par décodage réel, taille, SHA-256, crédits, correspondance exacte et absence de repli sur une autre photo. Inspection réelle des vignettes ; d'autres images candidates ont été écartées avant enregistrement car inadaptées. L'importateur rejette les doublons, mauvais libellés et chemins non autorisés avant toute écriture.

Résultats : `npm test` réussit avec 135 tests (86 TypeScript, 49 modules JavaScript), `npm run build`, `tsc --noEmit` et `npm run build:site` réussissent. Un test visuel interactif et un essai sur téléphone réel n'ont pas pu être exécutés : aucun outil de navigateur pilotable n'est disponible dans cette session. La compilation et les tests ne prouvent donc pas une perfection visuelle. Rien n'est déployé dans ce chantier.

Recette avant publication : à 320, 375, 768 et 1280 px, rechercher riz puis pomme, filtrer une catégorie et la préparation, ajouter et retirer un favori, changer de compte puis revenir, recharger pour vérifier la persistance ; sélectionner plusieurs aliments, corriger les portions et en retirer un ; saisir une valeur invalide et vérifier que le total ne reste pas affiché comme valide. Bloquer une image pour vérifier le remplacement neutre ; naviguer au clavier et vérifier lisibilité/zoom 200 %. Vérifier également la connexion et le parcours de récupération sur la version de recette.

Fichiers : `app/nutrition/page.tsx`, `app/nutrition/FoodPhoto.tsx`, `app/globals.css`, `lib/nutrition/core.ts`, `lib/nutrition/ciqual.ts`, `lib/nutrition/ciqual-2025.json`, `lib/nutrition/preferences.ts`, `lib/nutrition/meal.ts`, `lib/nutrition/photos.ts`, `scripts/import-ciqual.py`, `tests/nutrition-workspace.test.ts`, `public/foods/banane-crue.jpg`, `public/foods/pomme-crue.jpg`, `public/foods/orange-crue.jpg`, `public/foods/CREDITS.md`, `ROADMAP_DIABIA.md`, `docs/CALCULATEUR-GLUCIDES.md`, ce document.
