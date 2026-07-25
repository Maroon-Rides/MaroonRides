#!/bin/bash
set -euo pipefail

BASEMAP="https://build.protomaps.com/20260112.pmtiles"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT="$SCRIPT_DIR/../static/map/cstat.pmtiles"

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

pmtiles extract \
  "$BASEMAP" \
  "$WORK_DIR/cstat_8_16.pmtiles" \
  --bbox=-96.525584,30.510059,-96.200881,30.720020 \
  --minzoom=12 \
  --maxzoom=16

pmtiles extract \
  "$BASEMAP" \
  "$WORK_DIR/cstat_0_8.pmtiles" \
  --bbox=-96.604156,30.321781,-96.135035,30.868760 \
  --minzoom=0 \
  --maxzoom=11

mkdir -p "$(dirname "$OUTPUT")"
pmtiles merge "$WORK_DIR/cstat_0_8.pmtiles" "$WORK_DIR/cstat_8_16.pmtiles" "$OUTPUT"
