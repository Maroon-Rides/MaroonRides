#!/bin/bash
set -euo pipefail

BASEMAP="https://build.protomaps.com/20260112.pmtiles"
BBOX="-96.604156,30.321781,-96.135035,30.868760"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT="$SCRIPT_DIR/../static/map/cstat.pmtiles"

mkdir -p "$(dirname "$OUTPUT")"

pmtiles extract \
  "$BASEMAP" \
  "$OUTPUT" \
  --bbox="$BBOX" \
  --minzoom=0 \
  --maxzoom=15

ASSETS_BASE="https://protomaps.github.io/basemaps-assets"
MAP_DIR="$SCRIPT_DIR/../static/map"

SPRITE_THEMES=(light dark)
SPRITE_FILES=(".json" ".png" "@2x.json" "@2x.png")

for theme in "${SPRITE_THEMES[@]}"; do
  mkdir -p "$MAP_DIR/sprites"
  for file in "${SPRITE_FILES[@]}"; do
    curl -fsSL "$ASSETS_BASE/sprites/v4/$theme$file" -o "$MAP_DIR/sprites/$theme$file"
  done
done

FONTS=("Noto Sans Regular" "Noto Sans Medium" "Noto Sans Italic")
# Basic Latin, Latin-1, Latin Extended A/B, IPA, combining diacritics, general punctuation, currency/letterlike symbols
GLYPH_RANGES=(0-255 256-511 512-767 768-1023 8192-8447 8448-8703)

for font in "${FONTS[@]}"; do
  mkdir -p "$MAP_DIR/fonts/$font"
  for range in "${GLYPH_RANGES[@]}"; do
    curl -fsSL "$ASSETS_BASE/fonts/${font// /%20}/$range.pbf" -o "$MAP_DIR/fonts/$font/$range.pbf"
  done
done
