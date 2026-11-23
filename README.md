# BI Lite

It is a bi tool for analysis from different data sources\

UX prototype built with the QuestionPro UX Prototype Base.

## Getting Started

```bash
npm install
npm run dev
```

## TextAI shared links

Open a TextAI dashboard and select **Share dashboard**. Enable sharing to copy a read-only link. The popup also offers password protection and, when a Text Viewer widget is present, an option to show responses in their original language.

Like BI sharing, TextAI sharing is a browser-local preview. Open the copied link in the same browser profile and at the same app address to use the saved settings and optional password prompt.

## Building Features

1. Fill in `PRD.md` with the screens and flows you want to build
2. Open Claude Code: `claude`
3. Describe what to build — the LLM reads `PRD.md` and `CLAUDE.md` to understand the product

## Stack

- Next.js + React 19
- QuestionPro WickUI (`@npm-questionpro/wick-ui-lib`)
- Tailwind CSS v4
- TypeScript
