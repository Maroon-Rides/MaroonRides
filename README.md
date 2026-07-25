# Maroon Rides

[![API Canary](https://github.com/Maroon-Rides/canary/actions/workflows/canary.yml/badge.svg)](https://github.com/Maroon-Rides/canary/actions/workflows/canary.yml)

We are building the best native mobile app for the Texas A&M University bus system.

![maroonrides_header](https://github.com/user-attachments/assets/f85ba3ce-9ad9-49cc-aebc-f26d1cee1105)

## Stack

The app is a [SvelteKit](https://svelte.dev/docs/kit) app packaged for iOS and Android with [Capacitor](https://capacitorjs.com). Maps are rendered with [MapLibre](https://maplibre.org) from a [PMTiles](https://docs.protomaps.com/pmtiles/) basemap extract that is generated locally instead of served from a tile server.

The native projects in `android/` and `ios/` are checked into the repo, so build and signing settings live in the projects themselves rather than being regenerated on each build.

## Getting started

Tooling is managed with [mise](https://mise.jdx.dev):

```sh
mise install
pnpm install
```

Generate the College Station basemap extract. This writes `static/map/cstat.pmtiles`, which is git-ignored:

```sh
pnpm pmtiles
```

Then start the dev server:

```sh
pnpm dev
```

## Running on a device

Build the web assets and copy them into the native projects:

```sh
pnpm build
pnpm exec cap sync
```

Then open the native project you want to run:

```sh
pnpm exec cap open ios
pnpm exec cap open android
```

To point a native build at a running dev server instead of the bundled assets, copy `dev.config.example.ts` to `dev.config.ts` and set `server.url`.

## Checks

```sh
pnpm lint
pnpm check
```

## Releases

Versions are managed by [release-please](https://github.com/googleapis/release-please), which bumps `version` in `package.json`. The Android `versionName` is read from there at build time, and the iOS `MARKETING_VERSION` is passed in by fastlane. Publishing a GitHub release runs the `Build App and Upload` workflow, which uploads to TestFlight and the Play Store internal track.
