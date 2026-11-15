# Calculateur de glucides — sources et vérification

## Source réellement intégrée

ANSES, Table Ciqual 2025, 3484 aliments et 74 constituants, [jeu officiel DOI 10.57745/RDMHWY](https://doi.org/10.57745/RDMHWY). Métadonnées officielles : licence `etalab 2.0` (Licence Ouverte), https://spdx.org/licenses/etalab-2.0.html ; [informations légales Ciqual](https://ciqual.anses.fr/cms/en/legal-information). Attribution affichée dans l'interface avec la source et la version. Il ne s'agit pas d'une approbation de Diabia par l'ANSES.

Extraction de `Table Ciqual 2025_FR_2025_11_03.xlsx` (fichier officiel 666260), colonnes G (identifiant), H (nom) et Q (Glucides g/100 g), jamais S (sucres). SHA-256 du classeur : `5555c572fa3735991298d832d0427788fa69a11b4fd20a5d580d58942369fbb0`. Le JSON généré conserve chaque libellé et valeur textuelle source. Aucun ajout de valeur nutritionnelle. Les 212 valeurs non numériques (valeur manquante, trace ou seuil) restent nulles, ne deviennent jamais zéro et ne permettent pas de calcul exact.

Reproduction : télécharger https://entrepot.recherche.data.gouv.fr/api/access/datafile/666260 puis exécuter `python3 scripts/import-ciqual.py /chemin/vers/le/classeur.xlsx` depuis la racine du projet. Le script vérifie les colonnes et le nombre d'aliments avant de générer `lib/nutrition/ciqual-2025.json`. La version, la provenance, la licence et l'empreinte sont incluses dans ce fichier. L'extrait conserve les glucides et labels ; les autres constituants ne sont pas copiés.

## Open Food Facts

Une requête réelle de recherche sur `world.openfoodfacts.org/cgi/search.pl` avec User-Agent Diabia a reçu HTTP 503 pendant ce chantier. Open Food Facts n'est donc pas annoncé comme connecté et aucun résultat fictif n'est substitué. La recherche actuelle couvre exclusivement les aliments génériques réels du catalogue local Ciqual ; elle ne fournit pas les produits de marque ni les codes-barres. Le fournisseur simulation reste disponible aux anciens tests, mais n'est plus importé par la page réelle.

Avant une intégration ultérieure : vérifier [documentation et limites API](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/), User-Agent identifiant Diabia, [conditions de réutilisation](https://world.openfoodfacts.org/terms-of-use) et licence ODbL (attribution, obligations de partage des bases dérivées). Les images ont leur propre licence ; aucune image n'est copiée. Garder distincts les jeux Ciqual et OFF jusqu'à examen des obligations de combinaison. Toute intégration devra gérer HTTP 429/503, validation du champ `carbohydrates_100g`, unité et base 100 g versus 100 ml, sans repli sur `sugars_100g`.

## Comportement du calculateur

Recherche locale normalisée sans accents, suggestions jusqu'à 30 résultats, libellés originaux incluant préparation, sélection explicite. Les badges cru/cuit sont extraits du libellé, sans transformer les valeurs d'un aliment en celles d'un autre. Le nom complet fait foi, notamment pour les recettes et préparations.

Poids en grammes, supérieur à zéro et au maximum 2000 g (limite de saisie du produit, pas une recommandation alimentaire), décimales point ou virgule acceptées. Formule `glucidesPour100g × poids / 100`, résultat arrondi à deux décimales, actualisé sans réseau ni enregistrement de la sélection. Les valeurs sont indicatives ; aucune dose d'insuline ni traitement n'est calculé. Aucune photo, IA ou transmission de recherche à une API externe.

## Vérification

Tests : recherche des aliments usuels, accents, absence de résultat, provenance des 3484 lignes, 212 valeurs non quantifiées, riz blanc cru et cuit (identifiants 9100/9104), portions et entrées invalides. Vérifier en navigateur : chercher « riz », sélectionner « Riz blanc, cuit, sans sel ajouté », saisir 150 g → 49,8 g ; choisir « Riz blanc, cru » → 116,25 g pour 150 g. Vérifier virgule, poids négatif ou >2000 g, nouvelle sélection et absence de résultat.

Pas de navigateur pilotable disponible dans le chantier ; essai visuel à effectuer avant publication. Ce chantier est enregistré sur la branche GitHub sans fusion ni déploiement automatique demandé.
