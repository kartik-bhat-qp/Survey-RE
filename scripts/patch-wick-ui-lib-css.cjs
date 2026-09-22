/**
 * Strip the leading Google Fonts @import from wick-ui-lib CSS.
 *
 * Nesting that @import inside src/app/globals.css places it after other
 * rules (tailwind, icon CSS, …), which LightningCSS rejects with:
 * "Parsing CSS source code failed — @import rules must precede all rules".
 *
 * Local Fira Sans faces are already loaded from /public/fonts/fira-sans.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  '@npm-questionpro',
  'wick-ui-lib',
  'dist',
  'style.css'
);

if (!fs.existsSync(target)) {
  console.warn('[patch-wick-ui-lib-css] skip — package not installed');
  process.exit(0);
}

const source = fs.readFileSync(target, 'utf8');
const googleFontsImport =
  /@import\s+"https:\/\/fonts\.googleapis\.com\/css2\?family=Fira\+Sans[^"]*";\s*/;

if (!googleFontsImport.test(source)) {
  console.log('[patch-wick-ui-lib-css] already up to date');
  process.exit(0);
}

fs.writeFileSync(target, source.replace(googleFontsImport, ''));
console.log('[patch-wick-ui-lib-css] removed Google Fonts @import');
