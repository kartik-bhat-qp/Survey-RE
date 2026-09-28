# Dashboard Insights Hub prototype

Implemented September 28, 2026 in Survey-RE. Preview: http://127.0.0.1:3000/dashboards/1.

The Insights Hub icon sits at the far right of the dashboard tab bar and opens a non-modal chat panel above it. Dashboard tabs scroll separately so the launcher remains visible. The shared tab bar includes this experience in the main BI and BI Lite dashboard routes.

## Production reference

On September 28, 2026, the BI production product switcher was inspected in the Knowledgebase workspace (2665), through the verified questionpro.com Chrome extension connection and the visible prabal.gupta@questionpro.com account. The Business Intelligence submenu renders its InsightsHub entry with `wp-insightshub` and blue styling. The prototype reuses that exact glyph from the already installed WickUI icon font.

This observation confirms the production menu icon only. The dashboard chat is a new local prototype, not a production-verified integration.

## Behavior

- Suggested prompts and free-text messages return local sample replies after a short simulated delay.
- Enter sends; Shift+Enter inserts a newline. Empty/whitespace-only messages and overlapping sends are prevented.
- The panel shows the dashboard name and active tab. Replies capture that context at send time.
- Closing with the icon, close button, or Escape preserves the conversation and draft while this dashboard stays mounted. Reloading or navigating away resets it.
- The input receives focus on open, and closing returns focus to the launcher. The conversation uses a live log region.
- The earlier nonfunctional floating AI button was removed to avoid covering the new launcher.
- All replies are explicitly labeled as demo content. There are no AI API calls, dashboard data processing, credentials, or persistent chat storage.

## Validation

- TypeScript: `tsc --noEmit --incremental false` initially passed twice. The final run found an unrelated concurrently added `TimeSeriesDashboardCard.tsx:31` error: optional `fontWeight` is incompatible with the required `AmChartTypography.fontWeight`. No chat or tab-bar type errors were reported.
- ESLint on the chat and dashboard tab bar passed.
- `git diff --check` passed.
- Chrome desktop preview: launcher placement, panel layout, suggested prompt, sample response, typed question sent with Enter, Escape dismissal, and conversation retention on reopening verified.
- Screenshot: `chat-desktop.png`.
