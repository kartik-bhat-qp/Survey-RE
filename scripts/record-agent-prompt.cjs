#!/usr/bin/env node
/**
 * Appends a user prompt to .cursor/agent-prompts.jsonl so Engagement Logs
 * can show what was asked of the agent when software was built.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT_PATH = path.join(ROOT, '.cursor', 'agent-prompts.jsonl');

function readStdin() {
  return new Promise((resolve) => {
    let raw = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      raw += chunk;
    });
    process.stdin.on('end', () => resolve(raw));
  });
}

function extractText(data) {
  if (!data || typeof data !== 'object') return '';
  const candidates = [
    data.prompt,
    data.text,
    data.content,
    data.message,
    data.command,
    data.prompt_text,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    if (candidate && typeof candidate === 'object') {
      if (typeof candidate.text === 'string' && candidate.text.trim()) {
        return candidate.text.trim();
      }
      if (Array.isArray(candidate.content)) {
        const joined = candidate.content
          .map((part) => (part && typeof part.text === 'string' ? part.text : ''))
          .join('\n')
          .trim();
        if (joined) return joined;
      }
    }
  }
  const query = String(JSON.stringify(data)).match(/<user_query>\s*([\s\S]*?)\s*<\/user_query>/);
  return query ? query[1].trim() : '';
}

async function main() {
  let data = {};
  try {
    data = JSON.parse((await readStdin()) || '{}');
  } catch {
    data = {};
  }

  const text = extractText(data).replace(/\\\n/g, '\n').trim();
  if (text) {
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.appendFileSync(
      OUT_PATH,
      `${JSON.stringify({ text, createdAt: new Date().toISOString() })}\n`,
      'utf8'
    );
  }

  process.stdout.write('{}\n');
}

main().catch(() => {
  process.stdout.write('{}\n');
});
