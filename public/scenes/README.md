# Ajouter une scène (zéro code)

1. Crée un dossier `public/scenes/<id>/` (ex. `public/scenes/le-diner/`).
2. Mets-y la vidéo de référence : `video.mp4` (9:16 de préférence, H.264).
3. Ajoute `meta.json` : `{ "title": "…", "film": "…", "credits": "…", "durationS": 42, "characters": [{ "id": "a", "name": "…" }, { "id": "b", "name": "…" }] }`.
4. Ajoute `cues.json` : les répliques `[{ "text": "…", "character": "a", "startMs": 0, "endMs": 2300 }, …]` — qui PARLE, quand.
5. Ajoute `shots.json` : les plans `[{ "character": "a", "startMs": 0, "endMs": 2500 }, …]` — qui est À L'IMAGE, quand (indépendant de qui parle : plans de réaction bienvenus).
6. Pour caler les temps sans les deviner : lance `node tools/analyze-scene.mjs ta-video.mp4` (détection automatique des plans + transcription locale des répliques), puis ouvre `/timer` dans l'app, importe les deux brouillons `.draft.json`, attribue A/B (clique une ligne puis touche A ou B) et exporte. Marquage 100 % manuel possible aussi (touches A/B tenues pendant la lecture).
7. Déclare la scène dans `public/scenes/manifest.json` : ajoute son `<id>` à la liste `"scenes"`.
8. Recharge l'app : la scène apparaît dans la bibliothèque. C'est tout.
