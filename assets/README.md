# Assets

`icon.png` becomes the iOS, watchOS and Android legacy launcher icon, `icon-foreground.png` and `icon-background.png` are the Android adaptive icon layers, and `splash.png` / `splash-dark.png` are the light and dark launch screens.

Regenerate the per-platform sizes with:

```sh
pnpm dlx @capacitor/assets@3 generate --ios --android \
  --iconBackgroundColor '#ffffff' --iconBackgroundColorDark '#ffffff' \
  --splashBackgroundColor '#fbffff' --splashBackgroundColorDark '#191919'
```

Three things need undoing afterwards. The generator reformats `AndroidManifest.xml` and `project.pbxproj` without changing their meaning, so revert both. It also rewrites `mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml` to inset each adaptive icon layer by 16.7%; the foreground artwork already carries its own padding, so those files intentionally reference the layers directly. Finally, it does not know about the watch target — copy `assets/icon.png` to `ios/App/MaroonRidesWatch/Assets.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png` by hand.
