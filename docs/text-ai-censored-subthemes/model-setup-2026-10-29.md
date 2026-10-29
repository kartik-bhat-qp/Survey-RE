# Model setup alignment and explicit censorship opt-in

## Production reference

Inspected the native TextAI creation wizard in Knowledgebase workspace 2665, production v289, using the verified QuestionPro Chrome extension and visible `prabal.gupta@questionpro.com` account. A registered synthetic survey was selected to inspect Model set up. The wizard was closed without creating a production dashboard or starting analysis.

Production uses a 1200px dialog with two equal columns and 16px card spacing. Dashboard details (name, themes/sub-themes output language, Also translate verbatim) sits above Modeling on the left. Codebook sits above QuestionPro expert review on the right. Cards use 16px padding, 12px field text, 16px headings, and the required modeling goal has a 200-character limit. The prototype now follows that arrangement, retaining its existing response-filter wizard step.

## New creation choice

- **Enable censored sub-themes** is a checkbox directly below Codebook and before Expert review. It is checked for every new wizard and retains draft state through Back/Next.
- An information tooltip describes grouping off-topic, abusive, malicious or spam text under Outlier → Censored, excluding it from other themes, assigning Neutral sentiment and including it in dashboards by default. It also explains that users can review responses, remove Censored and re-categorize them under other sub-themes.
- The visible warning states: **If disabled, you cannot enable censored sub-themes for this dashboard later.** The choice is committed at creation; editing a draft checkbox before Create remains possible.
- This is a fixed classification choice, separate from the reversible **Show censored sub-themes** preference. Opted-in dashboards retain review/release and visibility controls. Opted-out dashboards have no Censored classification, code-frame category or visibility control.
- **Show censored sub-themes** controls dashboard visibility only. For opted-in dashboards, the Censored code-frame entry and responses remain available in the regular Theme configuration response panel with the switch on or off. Counts, selection, filtering and coding use the same full response set. Selecting Censored opens its bulk review dialog in either state. Adding other sub-themes still confirms removal of Censored and preserves saved releases through recoding.
- Combined dashboards and each separately created question dashboard store the creation choice. Subsequent runtime saves preserve that choice, including attempts to omit the preferences object. Existing prototype examples retain their previous enabled behavior.
- Also translate verbatim is represented and stored with the creation preferences. No real translation or AI processing is claimed by this static-data prototype.

## Validation

Browser verification created one unchecked dashboard and two separate opted-in dashboards over the Tailscale-bound local preview. Checked the default, Back/Next retention, Censored presence/absence, both settings routes, and reload behavior. Fixed the existing list-restoration issue so created dashboards remain listed after navigation and reload.

All 72 TextAI tests pass. Added coverage for classification/taxonomy when opted out, legacy examples, and creation-choice immutability. TypeScript, targeted ESLint and production build pass. Screenshots, production measurements, private preview URL and current run details are retained in the Work task's `outputs/textai-model-setup-2026-10-29` folder, outside the PRD.

Follow-up copy/default revision: verified the checked default, tooltip opening on keyboard focus, re-categorization explanation and opt-out retention through Back/Next. Rechecked an opted-out dashboard: neither Dashboard settings → Preferences nor Theme configuration settings → Preferences includes the Censored visibility switch. TypeScript, targeted ESLint and the two creation-choice tests pass for this revision.

Configuration visibility revision: browser checks show 1,507 responses in the opted-in configuration panel with dashboard visibility both off and on, including four Censored responses. Bulk review remains available, and adding another tag while dashboard visibility is off still shows the release confirmation; Cancel leaves assignments unchanged. All 72 TextAI tests, TypeScript, targeted ESLint and the production build pass.
