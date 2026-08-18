// Merges your workbench.colorCustomizations into a standalone theme file.
// Syntax highlighting is inherited from base-dark_vs.json via "include",
// so this only has to emit workbench colors. Re-run after editing overrides.json.
const fs = require('fs');

const overrides = JSON.parse(fs.readFileSync('overrides.json', 'utf8'));

// "default" means "fall back to the base theme's value", so drop those keys.
const applied = Object.fromEntries(
  Object.entries(overrides).filter(([, v]) => v !== 'default')
);

const theme = {
  name: 'Deep Ocean',
  type: 'dark',
  include: './base-dark_vs.json',
  colors: applied,
};

fs.writeFileSync(
  'themes/deep-ocean-color-theme.json',
  JSON.stringify(theme, null, 2) + '\n'
);

const dropped = Object.keys(overrides).length - Object.keys(applied).length;
console.log(
  `Wrote themes/deep-ocean-color-theme.json — ` +
    `${Object.keys(applied).length} colors ` +
    `(${dropped} left to the base theme), syntax inherited from base-dark_vs.json.`
);
