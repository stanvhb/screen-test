# DESIGN-BRIEF — DA propre à SCREEN TEST

> Décision du 18/08 : l'app a **sa propre identité**, pensée jouet viral grand public. Ce n'est PAS la charte Le Studio (nuit/crème, Instrument Serif, stripe quadricolore) — le Studio n'apparaît qu'en signature discrète (filigrane, crédits, page « c'est quoi »). Ce brief est une direction proposée : **S1 la matérialise, Stan tranche en la voyant.**

## Direction : « PLATEAU »
L'app emprunte ses codes au tournage, pas au cinéma-patrimoine : clap, décompte, REC, timecode, dailies. Énergie de plateau, pas musée. Tout est pensé pour être filmé/screené : chaque écran doit être beau DANS une story.

## Tokens de départ
- **Fond** : noir plateau `#0A0A0B` · surfaces `#161618`.
- **Encre** : blanc cassé `#F4F1EA`.
- **Accent unique** : rouge REC `#FF3B30` — décompte, point d'enregistrement, CTA principal. Aucun autre accent en v1.
- **Utilitaire** : jaune gaffer `#FFC833` réservé aux marques de karaoké (réplique active), comme un surligneur.
- **Typo** : display **Archivo Black** (titres, « ACTION », gros CTA) · texte/UI **Archivo** · timecodes et métadonnées **JetBrains Mono**. Google Fonts, self-hostées (pas de CDN au runtime).
- Coins : 12 px cartes, boutons pleins très larges (pouce, usage à bout de bras). Touch targets ≥ 48 px.

## Principes d'écran
- **Mobile-first 9:16 strict.** Desktop = le même écran centré, bandes latérales noires. On ne dessine jamais pour desktop d'abord.
- Une action principale par écran, en rouge, en bas, atteignable au pouce.
- **Plateau** : plein écran caméra, chrome minimal, décompte 3-2-1 énorme (Archivo Black, pulsation), point REC + timecode en haut, karaoké en bande basse sur fond noir 70 %.
- **Karaoké** : réplique active en jaune gaffer, la suivante en gris 50 % — lisible à 2 m de l'objectif.
- **Dailies** : la prise plein cadre, actions en overlay (Another take / Export / Partager), ambiance « salle de projo ».
- Micro-animations sèches et courtes (< 200 ms) ; le seul moment théâtral autorisé : le décompte → ACTION.
- **Filigrane export** : `APP_NAME` en Archivo Black + crédit du film parodié en JetBrains Mono, coin bas, opacité ~85 %, taille proportionnelle à la vidéo. Mention « parodie » dans les crédits de fin d'export.

## Ton (UX writing)
Français, tutoiement, vocabulaire de tournage : « Moteur… », « ACTION », « Coupez ! », « Une autre ? », « Tes dailies ». Jamais de jargon technique à l'écran (pas de « WebM », « codec », « blob » — dire « ta vidéo »).

## Anti-références
Pas de dégradés violets IA, pas de glassmorphism, pas d'emoji dans l'UI, pas de skeuomorphisme pellicule/VHS (c'est le territoire de la charte Studio — on n'y touche pas).
