# Catalogue photographique Ciqual

Le premier lot étendu couvre **52 aliments distincts sur 3 484**, soit **49 associations supplémentaires**. Les 52 JPEG locaux représentent 705 857 octets au total ; chaque fichier fait moins de 48 ko. Aucun chargement distant n'est nécessaire à l'utilisation. Les autres références conservent le placeholder neutre.

## Principes de sélection

Une photographie n'est jamais déduite du nom, d'une catégorie ou d'une recherche automatique. L'identifiant **et** le libellé Ciqual doivent correspondre exactement au manifeste. Pas de propagation d'une photographie vers les aliments cuits, séchés, surgelés ou préparés autrement. Le riz cru et le riz cuit possèdent notamment deux fichiers distincts. Les photographies illustrent l'aliment, pas le poids ni la partie comestible pesée ; les fruits entiers peuvent montrer la peau ou le noyau, à retirer selon le libellé Ciqual.

Chaque photo ajoutée a été examinée visuellement. Les noms de fichiers Commons ne sont pas une preuve : des redirections vers un chat, un papillon ou une pomme de terre mal nommée ont été écartées. Ont aussi été écartés les mélanges, les pommes de terre garnies, les photos ne permettant pas d'identifier la préparation et les images insuffisamment exploitables. La majorité présente un fond clair ; certaines prises de vue authentiques ont un fond naturel. Aucune retouche locale n'a été effectuée.

## Licences

Les auteurs, licences et pages sources sont conservés dans `lib/nutrition/photo-catalog.json`, dans `public/foods/CREDITS.md` et affichés dans les crédits de la page Alimentation. Statuts retenus : CC BY, CC BY-SA, CC0, domaine public documenté et GFDL 1.2. Les sept images GFDL de Fir0002 sont utilisées sous **GFDL 1.2**, pas sous leur alternative non commerciale. Une copie intégrale accompagne les fichiers : `public/foods/LICENSE-GFDL-1.2.txt`. Les pages originales donnent accès aux fichiers sources ; les licences propres aux photographies sont conservées. Aucun auteur ne cautionne DiabIA. Ne pas réutiliser une image sous une licence NC ou sans preuve de droits.

## Ajouter un lot

1. Préparer un tableau JSON de titres Commons exacts, puis lancer `node --use-env-proxy scripts/review-food-images.mjs /tmp/food-review /tmp/titles.json` si l'environnement utilise un proxy. Sans proxy, retirer l'option. Ce script crée une file de candidats temporaires, jamais d'associations en production.
2. Ouvrir chaque fichier ; confirmer aliment, état cru/cuit et préparation. Examiner la page originale et les obligations de licence. Rejeter les images ambiguës. Ne pas se fier uniquement au titre ni au texte généré par la recherche.
3. Préparer un tableau JSON d'entrées explicitement approuvées contenant `foodId`, `expectedName`, `inputFile`, `src` (format `/foods/ciqual-IDENTIFIANT.jpg`), `author` en texte simple, `license`, `licenseUrl`, `sourceUrl`, `reviewedOn` au format ISO. Prendre le libellé exact du catalogue ; ne jamais modifier celui-ci pour faire correspondre une photo. Pour le domaine public, `licenseUrl` renvoie à la page source attestant ce statut.
4. Lancer `node scripts/import-food-photos.mjs /tmp/approved.json`. L'importateur valide tout le lot avant écriture : correspondance exacte, doublons, chemin local, source, licence et taille. Il refuse tout écrasement, ajoute les empreintes et régénère les crédits. Il ne modifie aucune valeur nutritionnelle. Une validation humaine reste nécessaire : l'importateur ne peut pas prouver visuellement le contenu ou les droits.
5. Lancer `npm test`, `npm run build`, puis le contrôle TypeScript. Mettre à jour les compteurs de ce document et du test de couverture à chaque nouveau lot. Vérifier le rendu mobile dans un navigateur disponible avant publication.

## Vérification de ce lot

Tests : existence, unicité, taille, empreinte SHA-256, décodage JPEG, crédits, concordance des libellés et absence de repli approximatif. Le test de référence des 3 484 valeurs nutritionnelles doit conserver son empreinte initiale. Les tests existants de recherche, catégories, favoris, récents, comptes et portions restent applicables. Aucun navigateur mobile interactif n'était disponible pour ce lot ; ne pas confondre une compilation réussie avec un test Safari réel.
