# SCREEN TEST (rebuild)

Web app « jouet viral » : rejouer des scènes cultes re-créées par nos comédiens, face caméra, avec karaoké, puis exporter une vidéo filigranée. 100 % côté client.

- Règles de travail : [CLAUDE.md](CLAUDE.md) · Tâches : [BACKLOG.md](BACKLOG.md) · Design : [DESIGN-BRIEF.md](DESIGN-BRIEF.md)

## Commandes

```bash
npm run dev        # serveur local sur http://localhost:5173
npm run check      # lint + typecheck + tests + build — LA commande de vérité
npm run test:e2e   # smoke Playwright (chromium + webkit)
```

## Mise en ligne (Vercel)

Une seule fois : sur [vercel.com/new](https://vercel.com/new), importer le dépôt GitHub `stanvhb/screen-test` (bouton « Import »), nom de projet `screen-test`, réglages par défaut (Vite est détecté). Ensuite tout est automatique : chaque branche poussée a son URL de prévisualisation https, et `main` = la production.

## Relecture d'un export

Après une prise, vérifier objectivement le fichier téléchargé (durée, piste audio, 9:16, cadence) :

```bash
tools/verify-export.sh ~/Downloads/prise-demo.mp4
```

(Nécessite ffmpeg : `brew install ffmpeg`. Les e2e déposent aussi un export dans `test-results/`.)
