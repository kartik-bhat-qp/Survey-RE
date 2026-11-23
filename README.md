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

Local links are stored under `.runtime/text-ai-shares`. Set `TEXT_AI_SHARE_STORAGE_DIR` to use a different persistent directory on a standalone server. On Vercel, connect a private Blob store and set `BLOB_READ_WRITE_TOKEN` so links work across function instances and can be revoked. Use a dedicated private store for the prototype.

## Building Features

1. Fill in `PRD.md` with the screens and flows you want to build
2. Open Claude Code: `claude`
3. Describe what to build — the LLM reads `PRD.md` and `CLAUDE.md` to understand the product

## Stack

- Next.js + React 19
- QuestionPro WickUI (`@npm-questionpro/wick-ui-lib`)
- Tailwind CSS v4
- TypeScript
