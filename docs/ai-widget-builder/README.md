# Build with AI — session prototype

Implemented in Survey-RE on 28 September 2026. Entry: `/dashboards/1` → Add widget → Build with AI.

## Current scope — placeholder flow

Name → shared survey selector → question table with multi-select checkboxes → Build. Create widget immediately adds a native placeholder to the current dashboard tab and closes the wizard, regardless of the prompt (including a blank prompt). The copy/paste checkpoint and code preview have been removed from this flow. AI generation is deferred.

The placeholder retains its name, survey, selected fields and prompt in memory. It appears in Advanced widgets for reuse during the session. General settings allow editing the name and highlight. Filters, weighting, design, analytics, labels and data slicing do not apply to the placeholder.

Nothing is written to localStorage, sessionStorage, a database, or a production service. A fresh page load starts empty. A local process marker at `/api/ai-widget-session` is checked every five seconds; a changed marker clears widgets and closes the builder after a server restart. Server downtime defers this check until reconnection. Development hot reload may also reset state.

Verified after this change: TypeScript and targeted ESLint passed. Browser verification confirmed that Create widget is enabled with a blank prompt, creates the placeholder immediately, and closes the wizard without opening another dialog.

## Deferred implementation reference

The following contracts, output utilities and historical verification describe the earlier code-generation prototype. They remain in the source for future work but are not exposed by the current placeholder creation flow.

## Evidence and contracts

Production API request/response bodies were unavailable. The user confirmed there is no backend source available and requested a session-only prototype. No production endpoints were invented or verified. The knowledge-base BI working reference was reviewed as dated UI-behavior evidence only. Production contract mapping remains pending; these local contracts are explicitly labeled `synthetic-prototype` in data and the copied prompt.

| Local contract | Structure | Intended visual families |
| --- | --- | --- |
| `distribution-v1` | `series[{fieldId,label,base,responseCount,items:[{label,count,percent}]}]` | bars, pie/donut, categorical comparisons |
| `summary-v1` | `summary[{fieldId,label,responseCount,base,mean}]` | KPI cards, numeric summaries; mean null for nominal fields |
| `trend-v1` | `trend[{month,count}]` | monthly respondent-volume line/area charts; not question-score trends |
| `records-v1` | `records[{id,date,weight,answers:{fieldId:value}}]` | custom calculations or tables using only selected fields |

All envelopes include `contract`, `evidence`, `error`, `fields`, `responseCount`, `weightedBase`. 120 deterministic synthetic responses include missing answers, multi-select arrays, ranked arrays, numeric NPS and text. Missing answers are excluded from valid question bases. Multi-select percentages use valid respondents and may sum above 100. Numeric zero is retained. Weights are 0.75 or 1.5, applied once to aggregates. These are demonstration weights, not production weighting schemes. Country and other dashboard metadata are synthetic dimensions; known gender/age/NPS fields map to the corresponding selected answer when present.

## Output and runtime

The copy button includes the complete user request, survey/field metadata, every local data contract with sample payloads, an output schema and runnable example, settings semantics and runtime constraints. Paste a JSON object containing `version:1`, `contract`, unique selected `fieldIds`, five capability booleans (`design`, `analytics`, `labels`, `weighting`, `slicer`), and `html`, `css`, `javascript` strings. Code defines `window.renderWidget = ({root,data,settings}) => {...}`. Markdown JSON fences are accepted. Unknown contracts/fields, missing capabilities and oversized/malformed output are rejected.

Rendering uses a sandboxed iframe without same-origin permission, sanitized initial HTML and a restrictive CSP. Network APIs, remote assets, popups, forms and parent DOM access are restricted; this is prototype isolation, not a complete hostile-code service. The host supplies fresh data/settings and recreates the document when controls change. Runtime exceptions appear in the UI; Add to dashboard is disabled until the preview confirms rendering. Automatic validation cannot prove that arbitrary generated code computes the intended statistic or honors every declared setting; inspect the preview. No live AI API or skill is required. Use demo output exercises the entire flow without a model call.

## Verification

- TypeScript check and targeted ESLint passed.
- Node tests cover missing bases, multiselect denominators, weighted means, zero values, filtering intersections, empty data, cleared dates, field scoping, schema validation, matrix expansion, deterministic fixtures and copied context.
- Browser checked: setup, copy, malformed JSON, live preview, save, General/Design/Analytics/Labels visibility, highlight, filter, percent display, weights, slicing, dashboard response status, Advanced widgets listing and reuse on a separate tab.
- Observed Female filter: 23 responses, weighted base 23.25; adding age 18–24: 3 responses, weighted base 3.00. Terminated dashboard status: no responses; clearing restores the chart.

## Shared wizard styling update

The builder now uses the same dynamically loaded WickUI action modal, header, native close control, footer, input and navigation buttons as the normal question-based widget flow. This inherits the existing cursor-responsive border and typography. The picker uses the existing `wc-ai` icon and light-blue palette. The earlier steps were Name → Survey → Questions → Build → Preview; the current placeholder flow ends at Build. There is no Cancel button; the first step has only the name input and Next. Survey and question steps directly reuse `AiDataSourceSelection` and `WidgetQuestionSelection` in multi-select mode. Changing surveys clears previous question selection and generated output.

Verified in the browser: blank name disables Next; name advances to the folder/table survey picker; selecting a survey opens the shared question table; two checked questions carry through to the prompt and a runnable preview. TypeScript and targeted ESLint pass.

## Standard widget header and PRD — 28 September 2026

AI-created placeholder cards now reuse `DashboardWidgetCard`: the regular name typography, horizontal divider, and right-aligned three-dot menu. The custom AI badge and standalone Settings link are removed. The menu opens the existing name/highlight settings. Targeted ESLint and TypeScript passed, and the header/menu/settings were verified locally in Chrome.

PRD: https://docs.google.com/presentation/d/1phTGhNljt0Lm4xdJqAllgeQ3HvWmTf9tbeTQCxQcu4U/edit

The nine-slide PRD is a native copy of the provided template with persona and unused sections removed. All nine slides were visually inspected through the browser. Template and output DOM/text records, slide plan and screenshots are saved in this directory. Google connectors were not used under the Work policy.

Live review URL: https://survey-re.vercel.app/dashboards/1

Deployment check: the public site's Add widget dialog still offers only Question based and Advanced widgets. The latest flow remains local; the PRD explicitly records deployment as pending.

Destination: https://drive.google.com/drive/folders/1oeQRZNwBjy2R4HcRXaxpYci0g_HeJLt4 (Shared with me → 11-Product Management → 45-BI → Documents). Existing general access is QuestionPro, Commenter for anyone in the group with the link. After explicit user confirmation, the deck was moved from My Drive into Documents. The move success notification and the deck sharing dialog confirmed inherited QuestionPro Commenter access for anyone in the group with the link. Existing folder-member access was preserved. No folder permissions were changed. Verification screenshot: `prd-access-confirmed.png`.

Shipyard: after the user restored sign-in, added the PRD and live prototype URLs above to Documents on **Custom BI Widgets**, project 492: https://admin2.questionpro.com/cs/ui/gad/project-shipyard/projects/492. Both entries remained present after reloading the project. Draft status and other project fields were preserved. Verification screenshot: `shipyard-links.png`.
