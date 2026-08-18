# BACKLOG — une tâche = une session = une branche

> Règles : ordre imposé · une tâche par session · branche `rebuild/S<n>` · fini = critère d'acceptation vérifié + `npm run check` vert. Stan coche ici après relecture navigateur et merge.

## La vision (précisée le 18/08 par Stan)
Tu choisis **ton rôle** dans la scène. La vidéo finale est un **montage champ/contrechamp** : les plans où ton personnage est à l'image sont remplacés par ta prise (plein cadre), les plans de l'autre personnage restent ceux de la référence re-créée par nos comédiens. Exemple : tu joues l'invité du dîner → le résultat = la réf pour les plans de l'hôte, ta prise pour les plans de l'invité. Immersion : tu joues DANS la scène.
Piste post-v1 (S9) : incrustation du visage de l'utilisateur sur le personnage (effet « fond vert »).

## S0 — Harnais (AVANT toute fonctionnalité)
- [x] Vérifier que Node.js (LTS) et git sont disponibles sur la machine ; installer proprement ce qui manque (nvm ou brew) en expliquant ce qui est fait. *(Vérifié le 18/08 : Node v24.15.0 LTS, npm 11.12.1, git 2.50.1 déjà installés — rien à installer.)*
- [ ] Scaffold Vite + React + TypeScript, ESLint + Prettier, Vitest (1 test exemple), Playwright (1 smoke : la page charge et affiche APP_NAME).
- [ ] Script unique `npm run check` = lint + typecheck + tests + build.
- [ ] Repo GitHub créé (`gh repo create`), `main` protégée (pas de push direct), CI GitHub Actions qui lance `npm run check` sur chaque branche.
- **Accepté si** : `npm run check` vert en local et en CI, page hello sur localhost:5173.

## S1 — Design system + écrans statiques
- [ ] Tokens (couleurs, typo, espacements) depuis `DESIGN-BRIEF.md`, composants de base (bouton, carte scène, barre karaoké statique).
- [ ] 4 écrans navigables avec fausses données : Bibliothèque → Setup → Plateau (mock, sans caméra) → Dailies (mock).
- **Accepté si** : Stan navigue les 4 écrans sur mobile (`--host`) et valide la DA. Jugement esthétique = décision de Stan, pas de l'agent.

## S2 — Plateau : caméra + prise
- [ ] getUserMedia, aperçu webcam en miroir, gestion refus caméra propre.
- [ ] Décompte 3-2-1 → « ACTION », enregistrement, stop, téléchargement WebM de la prise brute.
- [ ] Test : mock de getUserMedia en e2e, décompte vérifié.
- **Accepté si** : Stan s'enregistre 10 s et récupère le fichier — sur Safari macOS ET iPhone.

## S3 — Référence + karaoké
- [ ] Format de scène : `public/scenes/<id>/` (video réf mp4, `meta.json` : titre, film parodié, crédits + **personnages**, `cues.json` : texte + start/end ms + **personnage qui parle**, `shots.json` : start/end ms + **personnage à l'image** — pilote le montage champ/contrechamp).
- [ ] Lecture de la référence avec bande karaoké synchro (réplique active en surbrillance — en jaune gaffer quand c'est TA réplique, en clair quand c'est l'autre) ; indicateur « à l'image » qui suit `shots.json`.
- [ ] 1 scène de test placeholder (vidéo muette générée + cues/shots bidon) committée.
- **Accepté si** : la scène de test défile avec karaoké calé et indicateur « à l'image » synchrone ; tests unitaires sur le moteur de cues ET de shots (état à t donné).

## S4 — Compositing + capture (la grosse session)
- [ ] Canvas unique 9:16 **montage champ/contrechamp** : la réf plein cadre quand l'autre personnage est à l'image, ta webcam miroir plein cadre quand c'est ton personnage (commutation pilotée par `shots.json`), karaoké, filigrane APP_NAME + crédits du film parodié.
- [ ] `canvas.captureStream()` + MediaRecorder (codec négocié explicitement, fallback H.264/Safari), audio mixé WebAudio : modes *Playback* (réf à 20 % pendant les répliques) et *Solo*.
- [ ] Correction durée des blobs MediaRecorder (bug connu : durée infinie).
- [ ] `tools/verify-export.sh` : ffprobe sur un export → durée, piste audio, dimensions, fps. Intégré à la doc de relecture.
- **Accepté si** : export WebM avec les deux vidéos + karaoké + filigrane, `verify-export.sh` OK. (Si 3 essais échouent sur la synchro : STOP + diagnostic.)

## S5 — Dailies
- [ ] Relecture de la prise in-app (le bug historique du proto : cette fois, test e2e de relecture), « Another take », téléchargement.
- [ ] Avertissement onglet masqué pendant la prise.
- **Accepté si** : une prise se rejoue dans l'app sur Safari, sans téléchargement préalable.

## S6 — Export MP4 + partage
- [ ] ffmpeg.wasm local : WebM → MP4 (H.264/AAC), barre de progression.
- [ ] Web Share API (partage natif iPhone), fallback téléchargement.
- **Accepté si** : le MP4 sorti se lit dans Photos iOS et s'envoie en DM.

## S7 — Bibliothèque réelle
- [ ] Grille depuis `public/scenes/manifest.json`, 2e scène placeholder pour prouver « ajouter une scène = zéro code ».
- [ ] Petit outil `/timer` : caler les cues à la barre espace en regardant la réf, export cues.json (pour préparer les vraies scènes).
- **Accepté si** : Stan ajoute une fausse scène en suivant un README de 10 lignes, sans toucher au code.

## S8 — Polish + mise en ligne
- [ ] États vides/erreurs, textes FR définitifs, favicon/OG image, page « c'est quoi » avec mention parodique + contact retrait sur demande.
- [ ] Déploiement Vercel (statique), test Lighthouse mobile.
- **Accepté si** : URL publique fonctionnelle sur l'iPhone de Stan.

## S9 — Exploration post-v1 (ne pas commencer sans décision de Stan)
- [ ] Incrustation du visage de l'utilisateur sur le personnage joué (effet « fond vert » / face overlay). À évaluer : segmentation visage temps réel côté client (type MediaPipe), coût perf mobile, rendu acceptable. Hors périmètre v1.

---

## [HUMAIN] — jamais donné à l'agent
- [ ] Trier le vivier des 8 scènes → 3 pour le lancement.
- [ ] Tourner les re-créations avec les potes acteurs (≤ 2 acteurs, 1 décor, < 60 s).
- [ ] Caler les cues des vraies scènes (outil S7) ; décider dialogues intégraux vs raccourcis/allusifs.
- [ ] Valider la DA (S1) et le nom définitif de l'app.

## Diagnostics (l'agent écrit ici quand il s'arrête à 3 essais)
*(vide)*
