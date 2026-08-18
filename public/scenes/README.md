# Ajouter une scène (zéro code)

1. Crée un dossier `public/scenes/<id>/` (ex. `public/scenes/le-diner/`).
2. Mets-y la vidéo de référence : `video.mp4` (9:16 de préférence, H.264).
3. Ajoute `meta.json` : `{ "title": "…", "film": "…", "credits": "…", "durationS": 42, "characters": [{ "id": "a", "name": "…" }, { "id": "b", "name": "…" }] }`.
4. Ajoute `cues.json` : les répliques `[{ "text": "…", "character": "a", "startMs": 0, "endMs": 2300 }, …]` — qui PARLE, quand.
5. Ajoute `shots.json` : les plans `[{ "character": "a", "startMs": 0, "endMs": 2500 }, …]` — qui est À L'IMAGE, quand (indépendant de qui parle : plans de réaction bienvenus).
6. Pour caler les temps sans les deviner : ouvre l'outil `/timer` dans l'app, charge ta vidéo, marque répliques et plans aux touches A/B, exporte les deux fichiers.
7. Déclare la scène dans `public/scenes/manifest.json` : ajoute son `<id>` à la liste `"scenes"`.
8. Recharge l'app : la scène apparaît dans la bibliothèque. C'est tout.
