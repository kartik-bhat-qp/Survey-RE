/**
 * Next.js / Vercel build fixes for @npm-questionpro/wick-ui-lib:
 *
 * 1. Strip the leading Google Fonts @import from dist/style.css.
 *    Nesting that @import inside src/app/globals.css places it after other
 *    rules, which LightningCSS rejects ("@import rules must precede all rules").
 *    Local Fira Sans faces are already loaded from /public/fonts/fira-sans.
 *
 * 2. Add a `default` condition on package exports so webpack can resolve
 *    `@npm-questionpro/wick-ui-lib` (the published package only lists `import`).
 */
const fs = require('fs');
const path = require('path');

const packageRoot = path.join(
  __dirname,
  '..',
  'node_modules',
  '@npm-questionpro',
  'wick-ui-lib'
);
const styleCssTarget = path.join(packageRoot, 'dist', 'style.css');
const packageJsonTarget = path.join(packageRoot, 'package.json');

if (!fs.existsSync(packageRoot)) {
  console.warn('[patch-wick-ui-lib] skip — package not installed');
  process.exit(0);
}

if (fs.existsSync(styleCssTarget)) {
  const source = fs.readFileSync(styleCssTarget, 'utf8');
  const googleFontsImport =
    /@import\s+"https:\/\/fonts\.googleapis\.com\/css2\?family=Fira\+Sans[^"]*";\s*/;

  if (googleFontsImport.test(source)) {
    fs.writeFileSync(styleCssTarget, source.replace(googleFontsImport, ''));
    console.log('[patch-wick-ui-lib] removed Google Fonts @import');
  } else {
    console.log('[patch-wick-ui-lib] Google Fonts @import already removed');
  }
}

if (fs.existsSync(packageJsonTarget)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonTarget, 'utf8'));
  const exportDefaults = {
    '.': './dist/wick-ui-lib/es/index.js',
  };
  let packageJsonChanged = false;

  for (const [exportPath, defaultTarget] of Object.entries(exportDefaults)) {
    const exportDefinition = packageJson.exports?.[exportPath];
    if (
      exportDefinition &&
      typeof exportDefinition === 'object' &&
      !exportDefinition.default
    ) {
      exportDefinition.default = defaultTarget;
      packageJsonChanged = true;
    }
  }

  if (packageJsonChanged) {
    fs.writeFileSync(packageJsonTarget, `${JSON.stringify(packageJson, null, 2)}\n`);
    console.log('[patch-wick-ui-lib] added Next.js-compatible default exports');
  } else {
    console.log('[patch-wick-ui-lib] package exports already up to date');
  }
}
