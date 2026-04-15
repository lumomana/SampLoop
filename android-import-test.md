# Test Android — import audio hors ligne Samploop Mobile

Ce test a pour but de valider la **version mobile stable actuelle** dans son scénario le plus critique : importer un fichier audio sur téléphone Android, le copier localement dans l’application, l’assigner à une piste, puis confirmer qu’il reste lisible **sans réseau**.

## Préparation

| Élément | Attendu |
| --- | --- |
| Appareil | Téléphone Android avec l’application Samploop Mobile ouverte |
| Fichier à importer | Un fichier audio simple, par exemple `.wav` ou `.mp3`, déjà présent sur le téléphone |
| Réseau | Connexion active au départ, puis coupure réseau pendant le test |

## Procédure

| Étape | Action à faire | Résultat attendu |
| --- | --- | --- |
| 1 | Ouvrir l’application mobile. | La bibliothèque locale et la console 9 pistes apparaissent correctement. |
| 2 | Appuyer sur **Importer un son**. | Le sélecteur de documents Android s’ouvre. |
| 3 | Choisir un fichier audio local du téléphone. | L’import se termine sans message d’erreur. |
| 4 | Revenir à la bibliothèque. | Le son importé apparaît dans la bibliothèque, en priorité avant les sons embarqués. |
| 5 | Toucher une piste vide, puis toucher le son importé dans la bibliothèque. | Le son est assigné à la piste sélectionnée. |
| 6 | Appuyer sur **Play** sur cette piste. | Le son démarre. |
| 7 | Couper complètement le réseau du téléphone, idéalement **mode avion + Wi‑Fi coupé**. | Le téléphone est hors ligne. |
| 8 | Revenir dans l’application et relancer la lecture du son importé. | Le son se relit toujours correctement sans réseau. |
| 9 | Fermer puis rouvrir l’application si vous voulez pousser le test. | Le son importé reste présent dans la bibliothèque locale. |

## Ce qu’il faut me confirmer

| Point | Réponse attendue |
| --- | --- |
| Sélection de fichier | Le sélecteur Android s’est-il bien ouvert ? |
| Import | Le fichier est-il apparu dans la bibliothèque ? |
| Priorité bibliothèque | Le son importé est-il bien remonté avant les sons embarqués ? |
| Assignation | Le son a-t-il pu être placé sur une piste ? |
| Lecture hors ligne | La relecture a-t-elle fonctionné après coupure du réseau ? |
| Persistance | Le son reste-t-il visible après fermeture/réouverture de l’app ? |
| Erreur éventuelle | Y a-t-il eu un message d’erreur, un blocage, ou une absence de son ? |

## Format de retour conseillé

Vous pouvez me répondre avec un message très simple sous cette forme :

| Champ | Exemple |
| --- | --- |
| Sélecteur | OK |
| Import | OK |
| Bibliothèque prioritaire | OK |
| Assignation piste | OK |
| Lecture hors ligne | KO — plus de son après mode avion |
| Persistance après relance | OK |
| Détail libre | Le fichier était un mp3 de 8 secondes |

Dès votre retour, je pourrai soit **clore cette étape comme version stable validée**, soit diagnostiquer précisément le flux d’import Android si un maillon échoue.
