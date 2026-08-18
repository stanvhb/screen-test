# Ajouter une scène (zéro code)

1. Crée un dossier `public/scenes/<id>/` (ex. `public/scenes/le-diner/`).
2. Mets-y la vidéo de référence : `video.mp4` (9:16 de préférence, H.264).
3. Ajoute `meta.json` : `{ "title": "…", "film": "…", "credits": "…", "durationS": 42, "characters": [{ "id": "a", "name": "…" }, { "id": "b", "name": "…" }] }`.
4. Ajoute `cues.json` : les répliques `[{ "text": "…", "character": "a", "startMs": 0, "endMs": 2300 }, …]` — qui PARLE, quand.
5. Ajoute `shots.json` : les plans `[{ "character": "a", "startMs": 0, "endMs": 2500 }, …]` — qui est À L'IMAGE, quand (indépendant de qui parle : plans de réaction bienvenus).
6. **Le tout-automatique** : `npm run analyze -- ta-video.mp4 --scene=<id>` fait les étapes 1 à 5 et 7 d'un coup — plans détectés, répliques transcrites, **voix séparées et attribuées a/b**, plans préremplis par « le plan montre qui parle », dossier créé, manifest mis à jour. La scène est jouable immédiatement. Reste à toi : compléter `meta.json` (titre, film, noms des personnages), relire les textes de `cues.json`, et vérifier dans `/timer` (bouton « Permuter A↔B » si les voix sont inversées, corriger les plans de réaction). Pour les scènes cultes, donne `cues.json` à Claude : il attribue les répliques d'après les dialogues connus du film.
7. Déclare la scène dans `public/scenes/manifest.json` : ajoute son `<id>` à la liste `"scenes"`.
8. Recharge l'app : la scène apparaît dans la bibliothèque. C'est tout.
