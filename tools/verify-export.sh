#!/usr/bin/env bash
# Vérification objective d'un export (S4) : durée, piste audio, dimensions, fps.
# Usage : tools/verify-export.sh <fichier> [--no-audio]
#   --no-audio : n'exige pas de piste audio (exports de test sans micro)
set -euo pipefail

file="${1:?usage: tools/verify-export.sh <fichier> [--no-audio]}"
require_audio=1
[[ "${2:-}" == "--no-audio" ]] && require_audio=0

command -v ffprobe >/dev/null 2>&1 || {
  echo "✗ ffprobe manquant — installe-le avec : brew install ffmpeg" >&2
  exit 2
}

probe() {
  ffprobe -v error "$@" "$file"
}

fail=0
check() {
  local label="$1" ok="$2" detail="$3"
  if [[ "$ok" == "1" ]]; then
    echo "✓ $label — $detail"
  else
    echo "✗ $label — $detail"
    fail=1
  fi
}

duration=$(probe -show_entries format=duration -of default=nw=1:nk=1 | head -1)
dur_ok=$(awk -v d="${duration:-0}" 'BEGIN { print (d > 0.5) ? 1 : 0 }')
check "durée" "$dur_ok" "${duration:-absente} s (doit être > 0,5 s et finie)"

video_codec=$(probe -select_streams v:0 -show_entries stream=codec_name -of default=nw=1:nk=1 | head -1)
check "piste vidéo" "$([[ -n "$video_codec" ]] && echo 1 || echo 0)" "codec ${video_codec:-absent}"

read -r width height <<<"$(probe -select_streams v:0 -show_entries stream=width,height -of csv=p=0 | head -1 | tr ',' ' ')"
dim_ok=$([[ "${width:-0}" == "720" && "${height:-0}" == "1280" ]] && echo 1 || echo 0)
check "dimensions 9:16" "$dim_ok" "${width:-?}x${height:-?} (attendu 720x1280)"

fps_raw=$(probe -select_streams v:0 -show_entries stream=avg_frame_rate -of default=nw=1:nk=1 | head -1)
fps=$(awk -F'/' -v r="$fps_raw" 'BEGIN { split(r, a, "/"); if (a[2] > 0) printf "%.1f", a[1] / a[2]; else print 0 }')
fps_ok=$(awk -v f="$fps" 'BEGIN { print (f >= 10 && f <= 61) ? 1 : 0 }')
check "cadence" "$fps_ok" "${fps} im/s (attendu entre 10 et 60)"

audio_codec=$(probe -select_streams a:0 -show_entries stream=codec_name -of default=nw=1:nk=1 | head -1)
if [[ "$require_audio" == "1" ]]; then
  check "piste audio" "$([[ -n "$audio_codec" ]] && echo 1 || echo 0)" "codec ${audio_codec:-absent}"
else
  echo "· piste audio — codec ${audio_codec:-absent} (non exigée : --no-audio)"
fi

if [[ "$fail" == "1" ]]; then
  echo "ÉCHEC : l'export ne respecte pas le contrat." >&2
  exit 1
fi
echo "OK : export conforme."
