# Text AI dashboard design

Implemented in the Survey-RE prototype, 18 September 2026. Reference: production BI dashboard 27109, workspace 348, inspected on 18 September 2026, plus the shared local BI settings components. This is a prototype implementation, not a production release. Production controls were inspected without saving their draft changes.

## Findings and behavior

Production BI has Theme (Default only), Color palette (Categorical/Divergent/Blue/Green/Red/Orange/Custom), Sentiment colors (Default/Custom), font sizes (Extra small/Small/Medium/Large/Extra large), and font families (Fira Sans/Inter/Roboto/Segoe UI/IBM Plex Sans/Arial/Georgia). These replace the earlier local prototype presets. New dashboards default to Medium; existing saved font choices are preserved.

Text AI now reuses the shared BI Design tab, with dynamic swatches and preview, with a Save-only footer. Font size precedes font family, matching production BI. Draft edits affect the preview; Save applies to the dashboard. Escape and close discard design drafts. Save is disabled until the draft changes.

Theme color controls widget title color through a clickable swatch opening a HEX, saturation/brightness and hue picker. The Default theme keeps the existing canvas and card treatment. Palette controls comparative/segment bars and trend series, including matching legend swatches and points. Sentiment presets separately control stacked bars, their legends, KPI sentiment bars, impact bars and text-viewer sentiment pills. Production’s five sentiment colors map to Text AI’s six categories in the order [0, 1, 2, 2, 3, 4]: Mixed and Neutral share the midpoint while retaining separate labels/data. Palette changes never remap sentiment meanings. Text over colored segments uses contrasting black/white.

Typography propagates to widget titles, tables, text viewers, summaries, charts and legends. All seven currently implemented Text AI widget components inherit these settings, including widgets added after Save and the mobile canvas. Widget layout, filters, hidden series and counts are not changed by design edits. Existing BI data flow is preserved; its shared Design preview now responds to selections.

Settings persist in browser local storage per Text AI dashboard ID. Invalid stored values fall back to supported defaults; storage failures display an error without claiming a save. Normal, BI Lite and BI package Text AI routes reuse the same page. Different localhost ports have separate browser storage. This does not add server/account synchronization or persistence for other prototype widget state.

## Verification

- TypeScript: `node node_modules/typescript/bin/tsc --noEmit --incremental false`.
- Targeted ESLint on changed TS/TSX files.
- `node --test tests/dashboard-design.test.mjs tests/text-ai-segment-filters.test.mjs`: 20 passing tests covering normalization, per-dashboard storage isolation/failures, palette/sentiment independence and existing filter behavior.
- Work Chrome on port 3012: changed theme, palette, sentiment, font family, size and style; Save applied computed widget styles; reload restored settings; closing without saving preserved the saved design. Added a sub-theme trend and verified inherited typography and SVG series colors.

## Local development and later merge

Branch: `text-ai-dashboard-design`.
Worktree: `/Users/prabalgupta/Documents/work/Survey-RE-text-ai-design`.
Preview: `http://127.0.0.1:3012/text-ai/1`.

Run from this worktree:

```sh
mkdir -p .task-tmp/runtime
TMPDIR="$PWD/.task-tmp/runtime" NEXT_TELEMETRY_DISABLED=1 npm run dev -- --webpack --hostname 127.0.0.1 --port 3012
```

This worktree has its own source, `.next` output and server; it reuses the original checkout's installed dependencies through a `node_modules` symlink. Do not install/update dependencies through that symlink while another task is working.

After the other task's work is committed and the original checkout is clean, merge locally:

```sh
git -C /Users/prabalgupta/Documents/work/Survey-RE switch main
git -C /Users/prabalgupta/Documents/work/Survey-RE merge text-ai-dashboard-design
```

No fetch, push, remote branch or remote merge is needed. Review any conflicts if the other task later touches the shared BI Design tab. The original checkout's concurrent widget changes were left intact.

## Production BI style review — 18 September 2026

Read-only comparison with the already-open Design tab on production BI dashboard 27109 in workspace 348. Matched the 1250 × 685 modal, 56px header with 24px title, compact tabs, 35/65 controls-to-preview columns, 32px selectors, font-control order, rounded preview cards and Save-only footer. Removed the prototype-only Reset, Cancel and Font style controls. Retained Text AI-specific settings tabs and six-category sentiment mapping. This comparison verifies visible styling only; production settings were not changed.

The Text AI settings shell now uses the same client-loaded `WuModal` action variant, header, content and footer as BI. This replaces the static outline with WickUI's pointer-responsive radial gradient: 4px stroke, pale blue to #1D50F4 at 80% opacity, and the shared transition. Browser verification confirmed that pointer movement changes the gradient center, and closing/reopening works. The shared modal also owns Escape, outside-click dismissal and focus handling.

## Production control parity follow-up

All six preset palette arrays and the five default sentiment colors were copied from rendered production swatches. Preset palettes are read-only; Custom exposes editable swatches, and custom palette offers an add-color button. Custom arrays persist independently when switching presets. The palette menu includes miniature color previews. Color pickers support pointer interaction, arrow-key saturation/brightness adjustment, a keyboard-operable hue slider, and validated six-digit HEX input. Invalid/incomplete HEX text never reaches widget CSS.

Legacy Sequential and Diverging values migrate to Blue and Divergent. Unsupported themes/sentiment presets revert to Default. Per-dashboard storage now includes themeColor, customPalette and customSentiment; custom palettes validate 5–64 colors, custom sentiment exactly five. Series variables cycle for short custom palettes. The prototype caps custom palettes at 64 colors as a storage/input guard; this limit is not production-verified.

Browser verification: edited theme HEX, custom series color and custom sentiment color; Save set the matching dashboard CSS variables and reload preserved all three. Restored the visible default palette/sentiment/theme color afterward. TypeScript, targeted ESLint, design data tests and existing segment-filter tests pass. No Reset or Cancel was added; the shared animated blue modal border remains in place.

## Named themes / Save As — 18 September 2026

Observed production BI dashboard27109 Design → Save As: footer switches to an inline Theme name textbox (maxlength100), Cancel, and Save. Cancel returns to the normal Save As/Save footer. No production theme was saved, so production persistence scope, duplicate-name validation, and overwrite semantics were not independently verified.

Text AI now implements that naming flow. Default remains the only built-in theme; user-created themes join the Theme dropdown. Save As stores a normalized snapshot of accent, palette choice/custom colors, sentiment choice/custom colors, and typography, selects it, and applies it to the dashboard. Selecting a saved theme restores the complete snapshot in the preview; selecting Default restores the default settings. Normal Save applies dashboard-specific changes without mutating a saved template. Save As makes a separate template. Cancel exists only during naming, preserving the earlier removal of a general settings Cancel button.

The theme library is localStorage-backed (`text-ai-saved-design-themes`) and reusable across Text AI dashboards on this prototype origin. This is browser-local reuse, not production account/workspace synchronization. Theme IDs persist in dashboard design settings. Blank/overlong names, Default, and case-insensitive duplicate names are rejected. Storage failures report an error; if library save succeeds but dashboard application fails, the UI explicitly reports that partial result and allows retrying Save.

Validation: five design tests cover snapshot isolation, stored theme selection, duplicate/empty/long names, corrupt records and write failures. TypeScript and targeted ESLint pass. Browser saved the existing preview settings as “Preview theme”, reloaded, verified the selected saved name, switched to Default (Categorical/Medium), then selected Preview theme (Divergent/Small) and confirmed the full saved draft was restored with Save disabled. Production settings were left unchanged.
