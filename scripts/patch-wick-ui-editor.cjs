/**
 * Re-applies Next.js-safe fixes to @npm-questionpro/wick-ui-editor.
 * TipTap returns a null editor on the first render under Next unless
 * immediatelyRender is true; the editor toolbar then crashes on getAttributes.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  '@npm-questionpro',
  'wick-ui-editor',
  'dist',
  'wick-ui-editor',
  'es',
  'index.js'
);
const packageJsonTarget = path.join(
  __dirname,
  '..',
  'node_modules',
  '@npm-questionpro',
  'wick-ui-editor',
  'package.json'
);

if (!fs.existsSync(target)) {
  console.warn('[patch-wick-ui-editor] skip — package not installed');
  process.exit(0);
}

let source = fs.readFileSync(target, 'utf8');
const before = source;

// The minified sanitizer name changes between releases (R, z, ...), so match it loosely.
const useEditorBlock =
  /(= Se\(\{\n\s*editable: !c,\n\s*autofocus: d \? "end" : !1,\n\s*extensions: Ue,\n(\s*)content: \w+\(o \|\| ""\),\n)/;

if (source.includes('immediatelyRender: !0')) {
  // already patched
} else if (useEditorBlock.test(source)) {
  source = source.replace(
    useEditorBlock,
    '$1$2immediatelyRender: !0,\n$2shouldRerenderOnTransaction: !0,\n'
  );
} else {
  console.warn('[patch-wick-ui-editor] useEditor block not found — skipped');
}

const replacements = [
  [
    'selector: ({ editor: n }) => ({ textColor: n.getAttributes("textStyle").color })',
    'selector: ({ editor: n }) => ({ textColor: n?.getAttributes("textStyle")?.color })',
  ],
  [
    'selector: ({ editor: n }) => ({ bgColor: n.getAttributes("textStyle").backgroundColor })',
    'selector: ({ editor: n }) => ({ bgColor: n?.getAttributes("textStyle")?.backgroundColor })',
  ],
  [
    'selector: (d) => ({ fontSize: d.editor.getAttributes("textStyle").fontSize })',
    'selector: (d) => ({ fontSize: d.editor?.getAttributes("textStyle")?.fontSize })',
  ],
  [
    'selector: (d) => ({ currentFontFamily: d.editor.getAttributes("textStyle").fontFamily || "" })',
    'selector: (d) => ({ currentFontFamily: d.editor?.getAttributes("textStyle")?.fontFamily || "" })',
  ],
  [
    'tableAttrs: s.editor.getAttributes("table")',
    'tableAttrs: s.editor?.getAttributes("table")',
  ],
  ['t.imageAttrs.src', 't.imageAttrs?.src'],
  ['t.imageAttrs.alt', 't.imageAttrs?.alt'],
  ['t.linkAttrs.href', 't.linkAttrs?.href'],
  ['t.linkAttrs.alt', 't.linkAttrs?.alt'],
];

for (const [from, to] of replacements) {
  if (source.includes(from)) source = source.replaceAll(from, to);
}

const menuItemButtonPatch = `}, a.id) : /* @__PURE__ */ e(A.Item, {
        render: /* @__PURE__ */ e(h, {}),
        "data-active": a.active,`;

const menuItemButtonPatched = `}, a.id) : /* @__PURE__ */ e(A.Item, {
        render: /* @__PURE__ */ e(h, {}),
        nativeButton: !0,
        "data-active": a.active,`;

if (source.includes(menuItemButtonPatched)) {
  // already patched
} else if (source.includes(menuItemButtonPatch)) {
  source = source.replace(menuItemButtonPatch, menuItemButtonPatched);
} else {
  console.warn('[patch-wick-ui-editor] Menu.Item nativeButton block not found — skipped');
}

if (source !== before) {
  fs.writeFileSync(target, source);
  console.log('[patch-wick-ui-editor] applied');
} else {
  console.log('[patch-wick-ui-editor] already up to date');
}

if (fs.existsSync(packageJsonTarget)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonTarget, 'utf8'));
  const exportDefaults = {
    '.': './dist/wick-ui-editor/es/index.js',
    './html': './dist/wick-ui-editor/es/html.js',
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
    console.log('[patch-wick-ui-editor] added Next.js-compatible default exports');
  }
}
