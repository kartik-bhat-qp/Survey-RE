# Word cloud prototype — 18 September 2026

Reference: production workspace 348, dashboard 26221, Suggestions/ Comments widget 399790. Account verified in visible UI: prabal.gupta@questionpro.com.

Observed: Settings opens a full-height 440px right drawer with an enlarged white widget preview to its left. The cloud uses a muted blue/purple color, frequency-dependent sizes and horizontal/vertical orientations.

- General: Name visibility, name, Highlighted insight, six chart-type tiles, Filter options / Filter type.
- Analytics: Minimum word length (3–10, current 4), Stop words, Widget stats, Data slicer options with Dashboard/Widget/None controls.
- Design: Dashboard/Widget design type. Widget exposes Theme, Theme color, Color palette, Font size (Extra small through Extra large), Font family.

Prototype: /bi-lite/dashboards/1, bottom Suggestions/ Comments card → menu → Settings. Stop-word enhancements live in Analytics: 100 values, Clear all, individual removal, bulk paste, comma/newline/tab separators, backslash escaping, case-insensitive deduplication, explicit rejection of an overflowing batch. Settings persist locally per dashboard URL. No stop-word editor appears inside the dashboard card.

The cloud uses synthetic reference-shaped frequencies, not live survey queries. Alternate chart types are shown as disabled reference tiles. Filter/slicer modes are prototype selections; this fixture does not query production data. Theme/palette selectors currently provide Default/Categorical only. This is not a claim of full BI feature parity.

Validation: TypeScript passes; browser checked drawer layout, live cloud exclusion, five-value mixed paste including escaped comma and newline, exact 100-value acceptance and 101st-value rejection.
