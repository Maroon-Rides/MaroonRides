set quiet

dev:
    pnpm expo start -d

prebuild PLATFORM="ios":
    pnpm expo prebuild --platform {{PLATFORM}}

typecheck:
    pnpm tsc --noEmit

format:
    pnpm expo lint --fix