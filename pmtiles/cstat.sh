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
