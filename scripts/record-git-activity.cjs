#!/usr/bin/env node
/**
 * Records a high-level git push/pull summary into public/engagement-logs.json
 * for the Engagement → Logs product.
 *
 * Usage:
 *   node scripts/record-git-activity.cjs --action push [--range A..B]
 *   node scripts/record-git-activity.cjs --action pull [--range A..B]
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ROOT = path.resolve(__dirname, '..');
const LOG_PATH = path.join(ROOT, 'public', 'engagement-logs.json');
const CAPTURED_PROMPTS_PATH = path.join(ROOT, '.cursor', 'agent-prompts.jsonl');
const MAX_ENTRIES = 100;
const MAX_CHANGE_LINES = 8;
const MAX_PROMPTS = 20;
const MAX_PROMPT_CHARS = 800;

/** Path → human-readable product/feature area for log bullets. */
const AREA_RULES = [
  {
    test: /(^|\/)(engagement\/logs|engagement-logs|record-git-activity|githooks\/|hooks\/record-git)/,
    label: 'Engagement Logs',
  },
  {
    test: /(conjoint|mock-conjoint|BaseFilterForm|mock-report-base-filters)/,
    label: 'Conjoint report',
  },
  {
    test: /(CreateReportModal|mock-create-report|reports\/)/,
    label: 'Reports',
  },
  {
    test: /(survey-notifications|MultiEmailInput|NotificationConfig|NotificationGroups|EmailSendLogs)/,
    label: 'Survey notifications',
  },
  {
    test: /(datasets\/|mock-dataset|DatasetImport|UploadData|CreateVariable|textai)/i,
    label: 'Datasets',
  },
  {
    test: /(text-ai|TextAi|mock-text-ai)/,
    label: 'Text AI',
  },
  {
    test: /(dashboards\/|DashboardDataSlicer|DashboardShared|CreateDashboard|mock-dashboard)/,
    label: 'Dashboards',
  },
  {
    test: /(DashboardShell|BiLiteDashboardShell|GlobalFooter|SideNav|mock-header)/,
    label: 'App shell & navigation',
  },
  {
    test: /(transcripts|to-excel|transcripts_to_excel)/,
    label: 'Transcripts',
  },
  {
    test: /(surveys\/|SurveyEditor|mock-survey|advance-quota|Quota)/,
    label: 'Surveys',
  },
  {
    test: /(projects\/|mock-projects)/,
    label: 'Projects',
  },
  {
    test: /\.cursor\/|hooks\.json/,
    label: 'Cursor hooks',
  },
  {
    test: /^scripts\//,
    label: 'Tooling scripts',
  },
];

function parseArgs(argv) {
  const args = { action: null, range: null, backfillPrompts: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--action') args.action = argv[++i];
    else if (token === '--range') args.range = argv[++i];
    else if (token === '--backfill-prompts') args.backfillPrompts = true;
  }
  return args;
}

function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function inferRange(action) {
  if (action === 'pull') {
    if (git(['rev-parse', '--verify', 'ORIG_HEAD'])) return 'ORIG_HEAD..HEAD';
    return '';
  }

  const upstream = git(['rev-parse', '--abbrev-ref', '@{upstream}']);
  if (upstream) {
    const ahead = Number(git(['rev-list', '--count', `${upstream}..HEAD`]) || '0');
    if (ahead > 0) return `${upstream}..HEAD`;
  }

  const head = git(['rev-parse', 'HEAD']);
  return head ? `${head}^..${head}` : '';
}

function changedFiles(range) {
  if (!range) return [];
  const raw = git(['diff', '--name-only', range]);
  if (!raw) return [];
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatShortstat(range) {
  if (!range) return '';
  const raw = git(['diff', '--shortstat', range]).replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  return raw
    .replace(/(\d+) files? changed/, '$1 files changed')
    .replace(/(\d+) insertions?\(\+\)/, '+$1')
    .replace(/(\d+) deletions?\(-\)/, '−$1')
    .replace(/, /g, ' · ');
}

/**
 * Commit subjects plus optional body first-line when the subject is too vague.
 */
function commitDescriptions(range) {
  if (!range) return [];
  const raw = git(['log', '--pretty=format:%s%n%b%n---END---', range]);
  if (!raw) return [];

  return raw
    .split('---END---')
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const subject = lines[0] || '';
      const bodyLine = lines.slice(1).find((line) => !/^(co-authored-by|signed-off-by):/i.test(line));
      if (isVagueSubject(subject) && bodyLine) {
        return bodyLine.length > 120 ? `${bodyLine.slice(0, 117)}…` : bodyLine;
      }
      return subject;
    })
    .filter(Boolean);
}

function isVagueSubject(subject) {
  const normalized = subject.trim().toLowerCase();
  if (normalized.length < 18) return true;
  return /^(wip|fix|update|updates|changes|misc|tmp|test|asdf|more changes|some more)\b/.test(
    normalized
  );
}

function areaForFile(filePath) {
  for (const rule of AREA_RULES) {
    if (rule.test.test(filePath)) return rule.label;
  }
  const parts = filePath.split('/');
  if (parts[0] === 'src' && parts[1]) {
    return `src/${parts[1]}`;
  }
  return parts[0] || 'Other files';
}

/**
 * Build readable "Updated X" bullets grouped by product area.
 */
function areaSummaries(files) {
  if (files.length === 0) return [];

  const counts = new Map();
  for (const file of files) {
    const area = areaForFile(file);
    counts.set(area, (counts.get(area) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([area, count]) => {
      const noun = count === 1 ? 'file' : 'files';
      return `Updated ${area} (${count} ${noun})`;
    });
}

/**
 * Highlight a few concrete files with folder context, never bare duplicate basenames.
 */
function notableFileHighlights(files) {
  if (files.length === 0) return [];

  const preferred = files.filter((file) => /\.(tsx|ts)$/.test(file));
  const pool = preferred.length > 0 ? preferred : files;
  const picks = pool.slice(0, 3).map((file) => {
    const segments = file.split('/');
    if (segments.length >= 3) {
      return segments.slice(-3).join('/');
    }
    return file;
  });

  if (picks.length === 0) return [];
  return [`Key files: ${picks.join(', ')}`];
}

function readLogs() {
  try {
    const parsed = JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLogs(entries) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.writeFileSync(LOG_PATH, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

function buildChangeBullets({ subjects, files, stats }) {
  const changes = [];
  const areas = areaSummaries(files);

  const meaningfulSubjects = subjects.filter((subject) => !isVagueSubject(subject));
  for (const subject of meaningfulSubjects.slice(0, 4)) {
    if (!changes.includes(subject)) changes.push(subject);
  }

  // Vague commit titles get replaced with a readable overview from the diff.
  if (meaningfulSubjects.length === 0 && areas.length > 0) {
    const topAreas = areas
      .slice(0, 3)
      .map((line) => line.replace(/^Updated /, '').replace(/ \(\d+ files?\)$/, ''));
    changes.push(`High-level updates across ${topAreas.join(', ')}`);
  } else if (subjects.length > meaningfulSubjects.length && areas.length > 0) {
    // Keep one overview when mixed vague + useful messages.
    const topAreas = areas
      .slice(0, 2)
      .map((line) => line.replace(/^Updated /, '').replace(/ \(\d+ files?\)$/, ''));
    const overview = `Also updated ${topAreas.join(' and ')}`;
    if (!changes.includes(overview)) changes.push(overview);
  }

  for (const areaLine of areas) {
    if (changes.length >= MAX_CHANGE_LINES - 1) break;
    if (!changes.includes(areaLine)) changes.push(areaLine);
  }

  const needsFileHints =
    meaningfulSubjects.length === 0 || files.length >= 10;
  if (needsFileHints) {
    for (const highlight of notableFileHighlights(files)) {
      if (changes.length >= MAX_CHANGE_LINES - 1) break;
      changes.push(highlight);
    }
  }

  if (stats) changes.push(stats);
  return changes.slice(0, MAX_CHANGE_LINES);
}

const MONTHS = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function parseTranscriptTimestamp(raw) {
  if (!raw) return null;
  const match = String(raw).match(
    /([A-Z][a-z]{2}) (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2}) ([AP]M) \(UTC([+-])(\d{1,2}):(\d{2})\)/
  );
  if (!match) {
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
  }
  let hour = Number(match[4]) % 12;
  if (match[6] === 'PM') hour += 12;
  const utcMs = Date.UTC(
    Number(match[3]),
    MONTHS[match[1]] ?? 0,
    Number(match[2]),
    hour,
    Number(match[5])
  );
  const offsetMin =
    (Number(match[8]) * 60 + Number(match[9])) * (match[7] === '+' ? 1 : -1);
  return new Date(utcMs - offsetMin * 60_000).toISOString();
}

function normalizePromptText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

function clipPrompt(text) {
  const cleaned = normalizePromptText(text);
  if (cleaned.length <= MAX_PROMPT_CHARS) return cleaned;
  return `${cleaned.slice(0, MAX_PROMPT_CHARS - 1).trim()}…`;
}

function promptKey(text) {
  return normalizePromptText(text).toLowerCase().replace(/\s+/g, ' ');
}

function extractPromptFromMessageText(text) {
  const source = String(text || '');
  const queryMatch = source.match(/<user_query>\s*([\s\S]*?)\s*<\/user_query>/);
  if (!queryMatch) return null;
  const prompt = clipPrompt(queryMatch[1].replace(/\\\n/g, '\n'));
  if (!prompt || prompt === '[Image]') return null;
  const tsMatch = source.match(/<timestamp>([^<]+)<\/timestamp>/);
  return {
    text: prompt,
    createdAt: parseTranscriptTimestamp(tsMatch?.[1]?.trim()) || null,
  };
}

function textFromUnknown(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  if (typeof value.text === 'string') return value.text;
  if (Array.isArray(value.content)) {
    return value.content
      .map((part) => (part && typeof part.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('\n');
  }
  if (typeof value.content === 'string') return value.content;
  return '';
}

function collectPromptsFromJsonl(filePath) {
  let raw = '';
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }

  const prompts = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    if (!event || typeof event !== 'object') continue;
    if (event.role && event.role !== 'user') continue;
    const text = textFromUnknown(event.message) || textFromUnknown(event);
    if (!text.includes('<user_query>') && event.role !== 'user') continue;
    const extracted = extractPromptFromMessageText(text);
    if (extracted) prompts.push(extracted);
  }
  return prompts;
}

function walkFiles(dir, acc = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'subagents' || entry.name === 'node_modules') continue;
      walkFiles(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
      acc.push(full);
    }
  }
  return acc;
}

function agentTranscriptDirs() {
  const home = os.homedir();
  const slug = ROOT.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\//g, '-');
  return [
    path.join(ROOT, '.cursor', 'agent-transcripts'),
    path.join(home, '.cursor', 'projects', slug, 'agent-transcripts'),
  ].filter((dir) => fs.existsSync(dir));
}

function loadCapturedPrompts() {
  if (!fs.existsSync(CAPTURED_PROMPTS_PATH)) return [];
  let raw = '';
  try {
    raw = fs.readFileSync(CAPTURED_PROMPTS_PATH, 'utf8');
  } catch {
    return [];
  }

  const prompts = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    const text = clipPrompt(textFromUnknown(event) || event.prompt || event.text || '');
    if (!text) continue;
    prompts.push({
      text,
      createdAt: event.createdAt || parseTranscriptTimestamp(event.timestamp) || null,
    });
  }
  return prompts;
}

function collectAllAgentPrompts() {
  const collected = [];
  for (const dir of agentTranscriptDirs()) {
    for (const file of walkFiles(dir)) {
      collected.push(...collectPromptsFromJsonl(file));
    }
  }
  collected.push(...loadCapturedPrompts());

  const unique = [];
  const seen = new Set();
  for (const prompt of collected) {
    if (!prompt.text) continue;
    const key = `${promptKey(prompt.text)}|${(prompt.createdAt || '').slice(0, 16)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({
      text: prompt.text,
      ...(prompt.createdAt ? { createdAt: prompt.createdAt } : {}),
    });
  }
  return unique.sort((a, b) => Date.parse(a.createdAt || 0) - Date.parse(b.createdAt || 0));
}

function promptsBetween(prompts, startMs, endMs) {
  return prompts
    .filter((prompt) => {
      const time = Date.parse(prompt.createdAt || '');
      if (Number.isNaN(time)) return false;
      return time > startMs && time <= endMs;
    })
    .slice(0, MAX_PROMPTS);
}

function attachPromptsToEntry(entry, prompts) {
  if (!prompts.length) {
    const next = { ...entry };
    delete next.prompts;
    return next;
  }
  return { ...entry, prompts };
}

function fillEntryPrompts(entries, prompts) {
  const chronological = [...entries].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
  );
  const buckets = new Map(chronological.map((entry) => [entry.id, []]));
  const maxLookbackMs = 36 * 60 * 60 * 1000;
  const followUpMs = 20 * 60 * 1000;
  const longGapMs = 8 * 60 * 60 * 1000;

  for (const prompt of prompts) {
    const time = Date.parse(prompt.createdAt || '');
    if (Number.isNaN(time)) continue;

    let previous = null;
    let next = null;
    for (const entry of chronological) {
      const entryTime = Date.parse(entry.createdAt);
      if (entryTime < time) previous = entry;
      else {
        next = entry;
        break;
      }
    }

    let target = next;
    if (
      previous &&
      (!next || Date.parse(next.createdAt) - time > longGapMs) &&
      time - Date.parse(previous.createdAt) <= followUpMs
    ) {
      target = previous;
    }
    if (!target) continue;
    if (Date.parse(target.createdAt) - time > maxLookbackMs && target === next) {
      continue;
    }

    const bucket = buckets.get(target.id);
    if (bucket.length < MAX_PROMPTS) bucket.push(prompt);
  }

  return entries.map((entry) => attachPromptsToEntry(entry, buckets.get(entry.id) || []));
}

function main() {
  const { action, range: rangeArg, backfillPrompts } = parseArgs(process.argv.slice(2));

  if (backfillPrompts) {
    const existing = readLogs();
    const prompts = collectAllAgentPrompts();
    writeLogs(fillEntryPrompts(existing, prompts));
    console.log(
      `[engagement-logs] backfilled agent prompts from ${prompts.length} captured prompt(s)`
    );
    return;
  }

  if (action !== 'push' && action !== 'pull') {
    console.error(
      'Usage: record-git-activity.cjs --action push|pull [--range A..B]\n       record-git-activity.cjs --backfill-prompts'
    );
    process.exit(1);
  }

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']) || 'unknown';
  const upstreamRef = git([
    'rev-parse',
    '--abbrev-ref',
    '--symbolic-full-name',
    '@{upstream}',
  ]);
  const remote = upstreamRef.split('/')[0] || 'origin';
  const author =
    git(['config', 'user.name']) ||
    git(['log', '-1', '--pretty=format:%an']) ||
    'Unknown';

  const range = rangeArg || inferRange(action);
  const subjects = commitDescriptions(range);
  const files = changedFiles(range);
  const stats = formatShortstat(range);
  const commitCount = subjects.length;

  const verb = action === 'push' ? 'Pushed' : 'Pulled';
  const countLabel = commitCount > 0 ? String(commitCount) : 'latest';
  const summary = `${verb} ${countLabel} commit${
    commitCount === 1 ? '' : 's'
  } ${action === 'push' ? 'to' : 'from'} ${remote}/${branch}`;

  let changes = buildChangeBullets({ subjects, files, stats });
  if (changes.length === 0) {
    changes = [
      action === 'push'
        ? 'No local commits ahead of upstream'
        : 'No merge commits detected for this pull',
    ];
  }

  const entry = {
    id: `log-${action}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    action,
    summary,
    changes,
    branch,
    remote,
    author,
    createdAt: new Date().toISOString(),
  };

  const existing = readLogs();
  const usedKeys = new Set(
    existing.flatMap((item) =>
      (item.prompts || []).map((prompt) => `${promptKey(prompt.text)}|${prompt.createdAt || ''}`)
    )
  );
  const previousTime = Date.parse(existing[0]?.createdAt || '') || 0;
  const matchedPrompts = promptsBetween(
    collectAllAgentPrompts().filter(
      (prompt) => !usedKeys.has(`${promptKey(prompt.text)}|${prompt.createdAt || ''}`)
    ),
    previousTime,
    Date.parse(entry.createdAt) + 20 * 60 * 1000
  );
  const recorded = attachPromptsToEntry(entry, matchedPrompts);

  writeLogs([recorded, ...existing].slice(0, MAX_ENTRIES));
  console.log(`[engagement-logs] recorded ${action}: ${summary}`);
  for (const line of changes) {
    console.log(`  • ${line}`);
  }
  for (const prompt of matchedPrompts) {
    console.log(`  ↳ ${prompt.text.slice(0, 120)}`);
  }
}

main();
