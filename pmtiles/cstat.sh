#!/bin/bash

BASEMAP="https://build.protomaps.com/20260112.pmtiles"

pmtiles extract \
  $BASEMAP \
  cstat_8_16.pmtiles \
  --bbox=-96.525584,30.510059,-96.200881,30.720020 \
  --minzoom=12 \
  --maxzoom=16 \

pmtiles extract \
  $BASEMAP \
  cstat_0_8.pmtiles \
  --bbox=-96.604156,30.321781,-96.135035,30.868760 \
  --minzoom=0 \
  --maxzoom=11 \

pmtiles merge cstat_0_8.pmtiles cstat_8_16.pmtiles cstat.pmtiles