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

if (!fs.existsSync(target)) {
  console.warn('[patch-wick-ui-editor] skip — package not installed');
  process.exit(0);
}

let source = fs.readFileSync(target, 'utf8');
const before = source;

const useEditorBlock = `k = Se({
    editable: !c,
    autofocus: d ? "end" : !1,
    extensions: Ue,
    content: R(o || ""),
    onUpdate: ({ editor: v }) => {
      t && t(R(v.getHTML()));
    }
  });`;

const useEditorPatched = `k = Se({
    editable: !c,
    autofocus: d ? "end" : !1,
    extensions: Ue,
    content: R(o || ""),
    immediatelyRender: !0,
    shouldRerenderOnTransaction: !0,
    onUpdate: ({ editor: v }) => {
      t && t(R(v.getHTML()));
    }
  });`;

if (source.includes('immediatelyRender: !0')) {
  // already patched
} else if (source.includes(useEditorBlock)) {
  source = source.replace(useEditorBlock, useEditorPatched);
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
