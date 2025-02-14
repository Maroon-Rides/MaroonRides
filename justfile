set quiet

dev:
    npx expo start --go

prebuild PLATFORM="ios":
    npx expo prebuild --platform {{PLATFORM}}

typecheck:
    npx tsc --noEmit