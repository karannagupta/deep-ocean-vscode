// Builds themes/deep-ocean-color-theme.json from overrides.json.
//
// Syntax highlighting is inherited from base-syntax.json via "include",
// so this only has to emit workbench colors.
//
// VS Code caches parsed themes keyed by extension version, so a rebuild alone
// is not enough for the running window to pick up new colors. By default this
// also bumps the patch version, repoints the symlink in ~/.vscode/extensions,
// and updates that directory's extensions.json so the cache misses.
//
//   node build-theme.js              build + bump + relink
//   node build-theme.js --no-install just rewrite the theme file
//
// After it runs: "Developer: Reload Window" (or Cmd+Q and reopen).

const fs = require("fs");
const os = require("os");
const path = require("path");

const install = !process.argv.includes("--no-install");
const root = __dirname;
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const extensions = path.join(os.homedir(), ".vscode/extensions");

const pkgPath = path.join(root, "package.json");
const pkg = read(pkgPath);
const id = `${pkg.publisher}.${pkg.name}`;

// Every symlink this extension owns under ~/.vscode/extensions, with the path
// it currently resolves to.
function installedLinks() {
  return fs
    .readdirSync(extensions)
    .filter((e) => e.startsWith(`${id}-`))
    .map((e) => path.join(extensions, e))
    .filter((full) => fs.lstatSync(full).isSymbolicLink())
    .map((full) => ({ full, points: fs.readlinkSync(full) }));
}

// --- theme file ------------------------------------------------------------

const overrides = read(path.join(root, "overrides.json"));

// "default" means "fall back to the base theme's value", so drop those keys.
const colors = Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== "default"));

const malformed = Object.entries(colors).filter(([, v]) => !/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v));
if (malformed.length) {
  console.error("Malformed color values in overrides.json:");
  for (const [k, v] of malformed) console.error(`  ${k}: ${JSON.stringify(v)}`);
  process.exit(1);
}

fs.writeFileSync(
  path.join(root, "themes/deep-ocean-color-theme.json"),
  JSON.stringify({ name: "Deep Ocean Amber", type: "dark", include: "./base-syntax.json", colors }, null, 2) + "\n",
);

const dropped = Object.keys(overrides).length - Object.keys(colors).length;
console.log(
  `themes/deep-ocean-color-theme.json — ${Object.keys(colors).length} colors ` + `(${dropped} left to the base theme).`,
);

// A symlink recorded by an earlier build dangles as soon as this folder is
// renamed or moved, and VS Code then drops the theme without saying why.
const stale = installedLinks().filter((l) => l.points !== root);
for (const { full, points } of stale) {
  console.warn(`warning: ${path.basename(full)} points at ${points}`);
}

if (!install) {
  if (stale.length) console.warn("run without --no-install to repoint it.");
  process.exit(0);
}

// --- version bump ----------------------------------------------------------

const previous = pkg.version;
const parts = previous.split(".").map(Number);
parts[2] += 1;
pkg.version = parts.join(".");
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// --- symlink + registry ----------------------------------------------------

const folder = `${id}-${pkg.version}`;
const target = path.join(extensions, folder);

// Drop every symlink we own, stale or not, so old versions don't linger.
for (const { full } of installedLinks()) fs.unlinkSync(full);
fs.symlinkSync(root, target);

const registryPath = path.join(extensions, "extensions.json");
const registry = read(registryPath);
const entry = registry.find((e) => e.identifier && e.identifier.id === id);
const location = {
  $mid: 1,
  fsPath: target,
  external: "file://" + target.replace(/ /g, "%20"),
  path: target,
  scheme: "file",
};

if (entry) {
  entry.version = pkg.version;
  entry.location = location;
  entry.relativeLocation = folder;
} else {
  registry.push({
    identifier: { id },
    version: pkg.version,
    location,
    relativeLocation: folder,
  });
}
fs.writeFileSync(registryPath, JSON.stringify(registry));

console.log(`installed ${previous} -> ${pkg.version} (${folder})`);
console.log('run "Developer: Reload Window" to pick it up.');
