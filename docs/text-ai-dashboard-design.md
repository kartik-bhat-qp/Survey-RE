# Text AI dashboard design

Implemented in the Survey-RE prototype, 18 September 2026. Reference: the existing local BI `DashboardSettingsModal`, `DashboardDesignSettingsTab`, typography helpers, and dashboard canvas. This is prototype behavior; no production parity or release verification is asserted.

## Findings and behavior

BI has Theme (Default/Modern/Classic), Color palette (Categorical/Sequential/Diverging), Sentiment colors (Default/Soft/High contrast), font family and size selectors. Its Save handler applies typography; theme/palette/sentiment were modal-local selections with static swatches and previews. Text AI had no Design tab.

Text AI now reuses the shared BI Design tab, with dynamic swatches and preview, with a Save-only footer. Font size precedes font family, matching production BI. Draft edits affect the preview; Save applies to the dashboard. Escape and close discard design drafts. Save is disabled until the draft changes.

Theme controls widget title color, canvas background, card rounding and shadow. Palette controls comparative/segment bars and trend series, including matching legend swatches and points. Sentiment presets separately control stacked bars, their legends, KPI sentiment bars, impact bars and text-viewer sentiment pills. The six Text AI categories retain their identities (very negative, negative, mixed, neutral, positive, very positive); palette changes never remap sentiment meanings. Text over colored segments uses contrasting black/white.

Typography propagates to widget titles, tables, text viewers, summaries, charts and legends. All seven currently implemented Text AI widget components inherit these settings, including widgets added after Save and the mobile canvas. Widget layout, filters, hidden series and counts are not changed by design edits. Existing BI data flow is preserved; its shared Design preview now responds to selections.

Settings persist in browser local storage per Text AI dashboard ID. Invalid stored values fall back to supported defaults; storage failures display an error without claiming a save. Normal, BI Lite and BI package Text AI routes reuse the same page. Different localhost ports have separate browser storage. This does not add server/account synchronization or persistence for other prototype widget state.

## Verification

- TypeScript: `node node_modules/typescript/bin/tsc --noEmit --incremental false`.
- Targeted ESLint on changed TS/TSX files.
- `node --test tests/dashboard-design.test.mjs tests/text-ai-segment-filters.test.mjs`: 19 passing tests covering normalization, per-dashboard storage isolation/failures, palette/sentiment independence and existing filter behavior.
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
