# SCREEN TEST — instructions pour Claude Code

## Le projet
Web app « jouet viral » : l'utilisateur rejoue des scènes cultes françaises **re-créées par nos comédiens** (références dont nous avons tous les droits), en synchro face caméra avec bande karaoké, puis exporte une vidéo filigranée. La vidéo exportée EST le marketing.

- **100 % côté client.** Aucun backend, aucune donnée qui quitte l'appareil, aucun secret dans ce repo — jamais.
- Stack : Vite + React + TypeScript. Déploiement statique Vercel. Mobile-first, format 9:16.
- Le propriétaire du projet (Stan) n'est pas développeur : il valide dans le navigateur. Tes explications sont sans jargon, en français, 5 lignes max.
- Design : suivre `DESIGN-BRIEF.md`. Nom de l'app dans une constante unique `APP_NAME`.

## Méthode — règles dures
1. **Une seule tâche par session**, prise dans `BACKLOG.md`, dans l'ordre. Ne jamais commencer la suivante.
2. **Branche par session** : `rebuild/S<n>`. Ne jamais commit directement sur `main`, ne jamais merger toi-même sauf demande explicite.
3. **La tâche n'est finie que si son critère d'acceptation est vérifié** et `npm run check` est vert (lint + tests + build).
4. **Règle des 3 essais** : si un test ou un bug résiste après 3 tentatives, ARRÊTE-TOI. Écris un diagnostic honnête dans `BACKLOG.md` (section Diagnostics) et rends la main. Interdiction absolue de désactiver, skipper ou affaiblir un test pour passer au vert.
5. Ne touche pas aux fichiers hors du périmètre de la tâche. Pas de refactor opportuniste.
6. Fin de session : commit clair, puis un résumé en 5 lignes sans jargon : ce qui est fait, comment le tester sur localhost:5173, ce qui reste.

## Commandes
- `npm run dev` — serveur local (5173) · `npm run dev -- --host` pour test iPhone
- `npm run check` — lint + typecheck + tests unitaires + build (à créer en S0, doit rester LA commande unique de vérité)
- `npm run test:e2e` — smoke Playwright

## Points techniques imposés (issus du prototype précédent — leçons, pas du code)
- Composition de chaque frame sur un **unique `<canvas>`** (vidéo réf + webcam miroir + karaoké + filigrane + crédits), capture via `canvas.captureStream()` + MediaRecorder, audio mixé en WebAudio → synchro A/V garantie par construction, filigrane inarrachable.
- Vérification objective des exports par script ffprobe (S4) — pas « ça a l'air bon ».
- Safari/iOS est le terrain principal : codecs MediaRecorder à vérifier explicitement (pas de VP9 supposé), durée des blobs MediaRecorder à corriger (bug connu de durée infinie), autoplay uniquement muted/après geste utilisateur.
- Onglet masqué pendant une prise = enregistrement mort → avertir l'utilisateur (S5).
- Bibliothèque pilotée par `public/scenes/manifest.json` : ajouter une scène = un dossier + une entrée, zéro code.
