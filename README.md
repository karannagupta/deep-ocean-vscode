# Deep Ocean

A dark VS Code theme with deep blue backgrounds (`#122738` / `#193549` / `#1f4662`)
and amber accents (`#ffc600`).

Syntax highlighting is inherited from VS Code's built-in **Dark (Visual Studio)**
theme (`themes/base-dark_vs.json`, MIT, © Microsoft), so this theme only defines
workbench colors.

## Editing colors

`themes/deep-ocean-color-theme.json` is generated — don't edit it by hand.
Change `overrides.json` instead, then run:

```
node build-theme.js
```

A value of `"default"` in `overrides.json` means "keep the base theme's value".

## Previewing

Open this folder in VS Code and press `F5` to launch an Extension Development
Host, then pick **Deep Ocean** from the theme picker.
