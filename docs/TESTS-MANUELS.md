# Parcours de recette — exemples fictifs uniquement

1. Ouvrir le site sans données, charger l’exemple, retrouver 140 mesures et 84 doses.
2. Actualiser l’exemple : aucune duplication et conservation d’une dose fictive déjà modifiée, y compris zéro.
3. Ajouter une glycémie de 6 mmol/L avec une dose de 2,25 U, puis vérifier la conversion, la date/heure et la dose dans l’historique.
4. Ajouter une mesure sans insuline : afficher « non renseignée ». Ajouter zéro : afficher « 0 U ».
5. Importer un CSV en fusion, puis le même CSV : le deuxième import ne doit pas augmenter les doses. Un changement d’unité invalide l’aperçu et impose une nouvelle lecture.
6. Essayer une date impossible et une dose invalide : la ligne doit être rejetée et expliquée.
7. Choisir remplacer puis annuler : aucun changement. Confirmer seulement dans un navigateur de test.
8. Rechercher une note, filtrer les doses positives, exporter la sélection ; vérifier que les doses absentes restent vides dans le CSV.
9. Exporter un JSON complet, modifier un champ, sélectionner le JSON : aucun remplacement avant confirmation. Annuler puis recommencer et confirmer.
10. Tenter un JSON de version inconnue ou contenant une dose négative : refuser le fichier intégralement.
11. Parcourir les formulaires et confirmations au clavier : focus dans le dialogue, annulation avec Échap, retour du focus après fermeture.
12. Tester sur mobile, zoom 200 %, Chrome, Firefox et Safari. Les tests automatiques ne remplacent pas ces essais.
13. Effacer le stockage uniquement dans un navigateur de test : aucun reliquat de profil, mesures ou journal.
14. Avec un backend réel, deux comptes distincts doivent rester isolés ; dépasser le plafond individuel et le plafond partagé doit bloquer tout appel supplémentaire au fournisseur.

15. Ouvrir Compte : vérifier la session ChatGPT. Copier l’ancien historique uniquement s’il appartient à l’utilisateur. Vérifier qu’un autre espace n’affiche pas les données du premier.
16. Importer un CSV fictif avec une ligne d’injection sans glycémie et une dose à zéro : vérifier leur conservation et les totaux.
17. Réimporter le même fichier et vérifier qu’aucune dose n’est recomptée. Ne jamais choisir une colonne en U/h comme dose.
18. Exporter/restaurer un JSON version 3 puis un ancien JSON version 2 : les injections doivent être conservées dans le premier cas et vides dans le second, sans perte de mesures.
