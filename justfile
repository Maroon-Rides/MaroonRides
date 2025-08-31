set quiet

dev:
    npx expo start -d

prebuild PLATFORM="ios":
    npx expo prebuild --platform {{PLATFORM}}

typecheck:
    npx tsc --noEmit

format:
    npx expo lint --fix