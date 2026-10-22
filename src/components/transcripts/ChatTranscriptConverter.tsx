'use client';

import { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { downloadBase64Excel, formatBytes } from '@/components/transcripts/transcript-file-utils';
import type {
  ChatTranscriptLayout,
  ChatTranscriptStage,
  ChatTranscriptSummary,
} from '@/lib/transcripts/chat-to-transcript';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);

type LayoutOption = { value: ChatTranscriptLayout; label: string };

type ConvertSuccess = {
  type: 'result';
  fileName: string;
  excelBase64: string;
  summary: ChatTranscriptSummary;
};

type ConvertProgress = {
  type: 'progress';
  stage: ChatTranscriptStage;
  done: number;
  total: number;
};

type ConvertEvent = ConvertSuccess | ConvertProgress | { type: 'error'; error: string };

const STAGE_LABELS: Record<ChatTranscriptStage, string> = {
  reading: 'Reading the workbook…',
  translating: 'Translating to English',
  grouping: 'Finding common questions…',
  writing: 'Building the Excel file…',
};

type PreviewRow = Record<string, string>;

const LAYOUT_OPTIONS: LayoutOption[] = [
  { value: 'questions', label: 'One column per question' },
  { value: 'turns', label: 'One row per turn' },
  { value: 'text', label: 'One row per conversation' },
];

const SAMPLE_CHAT_LOG = {
  href: '/transcripts/sample-chat-log.xlsx',
  name: 'sample-chat-log.xlsx',
};

function isXlsxFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.xlsx');
}

function plural(count: number, word: string): string {
  return `${count.toLocaleString()} ${word}${count === 1 ? '' : 's'}`;
}

/** Reads the route's newline-delimited JSON, reporting progress, until the final event. */
async function readConvertEvents(
  response: Response,
  onProgress: (progress: ConvertProgress) => void
): Promise<Exclude<ConvertEvent, ConvertProgress>> {
  if (!response.body) return { type: 'error', error: 'Conversion failed.' };
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffered = '';
  let final: Exclude<ConvertEvent, ConvertProgress> | null = null;

  function handleLine(line: string): void {
    if (!line.trim()) return;
    const event = JSON.parse(line) as ConvertEvent;
    if (event.type === 'progress') onProgress(event);
    else final = event;
  }

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffered += decoder.decode(value, { stream: true });
    const lines = buffered.split('\n');
    buffered = lines.pop() ?? '';
    lines.forEach(handleLine);
  }
  handleLine(buffered);
  return final ?? { type: 'error', error: 'The conversion stopped before finishing.' };
}

export function ChatTranscriptConverter() {
  const { showToast } = useWuShowToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [layout, setLayout] = useState<LayoutOption>(LAYOUT_OPTIONS[0]);
  const [interviewerLabel, setInterviewerLabel] = useState('Interviewer');
  const [respondentLabel, setRespondentLabel] = useState('Respondent');
  const [includeSystem, setIncludeSystem] = useState(false);
  const [followUpColumns, setFollowUpColumns] = useState(false);
  const [translateToEnglish, setTranslateToEnglish] = useState(true);
  const [progress, setProgress] = useState<ConvertProgress | null>(null);
  const [result, setResult] = useState<ConvertSuccess | null>(null);

  function chooseFile(incoming: File[]): void {
    const next = incoming[0];
    if (!next) return;
    if (!isXlsxFile(next)) {
      showToast({ message: 'Choose an Excel (.xlsx) file with chat logs', variant: 'error' });
      return;
    }
    if (incoming.length > 1) {
      showToast({ message: `Using ${next.name}. Convert one file at a time.`, variant: 'info' });
    }
    setFile(next);
    setResult(null);
  }

  async function addSample(): Promise<void> {
    try {
      const response = await fetch(SAMPLE_CHAT_LOG.href);
      if (!response.ok) throw new Error('Sample file is missing');
      const blob = await response.blob();
      chooseFile([new File([blob], SAMPLE_CHAT_LOG.name)]);
    } catch {
      showToast({ message: 'Could not load the sample chat log', variant: 'error' });
    }
  }

  function updateOption(apply: () => void): void {
    apply();
    setResult(null);
  }

  async function handleConvert(): Promise<void> {
    if (!file || isConverting) return;
    setIsConverting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('layout', layout.value);
      form.append('interviewerLabel', interviewerLabel);
      form.append('respondentLabel', respondentLabel);
      form.append('includeSystem', String(includeSystem));
      form.append('followUpColumns', String(followUpColumns));
      form.append('translateToEnglish', String(translateToEnglish));
      const response = await fetch('/api/transcripts/chat-to-transcript', {
        method: 'POST',
        body: form,
      });
      const payload = await readConvertEvents(response, setProgress);
      if (payload.type === 'error') {
        showToast({ message: payload.error, variant: 'error' });
        return;
      }
      setResult(payload);
      downloadBase64Excel(payload.fileName, payload.excelBase64);
      showToast({
        message: `Downloaded transcript with ${plural(payload.summary.conversationCount, 'conversation')}`,
        variant: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Conversion failed.';
      showToast({ message, variant: 'error' });
    } finally {
      setIsConverting(false);
      setProgress(null);
    }
  }

  const preview = useMemo(() => {
    if (!result) return null;
    const { previewHeaders, previewRows, layout: resultLayout, extraColumns } = result.summary;
    const textFrom =
      resultLayout === 'questions' ? 1 + extraColumns.length : previewHeaders.length - 1;
    const columns: IWuTableColumnDef<PreviewRow>[] = previewHeaders.map((header, index) => ({
      accessorKey: `c${index}`,
      header,
      size:
        index >= textFrom
          ? resultLayout === 'questions'
            ? 260
            : 420
          : /^turns?$/i.test(header)
            ? 70
            : 150,
      cell: ({ row }) => (
        <span className="block whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">
          {row.original[`c${index}`]}
        </span>
      ),
    }));
    const data: PreviewRow[] = previewRows.map((row) =>
      Object.fromEntries(row.map((value, index) => [`c${index}`, value]))
    );
    return { columns, data };
  }, [result]);

  const summary = result?.summary;
  const warnings: string[] = [];
  if (summary?.salvagedRows.length) {
    warnings.push(
      `Rows ${summary.salvagedRows.join(', ')} had cut-off JSON (often Excel's 32,767 character cell limit). We kept the messages that could be read.`
    );
  }
  if (summary?.columnLimitReached) {
    warnings.push(
      `There were more than ${summary.questionColumns.length} distinct questions, so only the ${summary.questionColumns.length} most asked got their own columns. The rest are in "Other follow-ups".`
    );
  }
  if (summary?.skippedRows.length) {
    warnings.push(`Skipped rows with no readable messages: ${summary.skippedRows.join(', ')}.`);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(event) => {
          chooseFile(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />

      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="wm-description text-2xl text-green-700" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800">{file.name}</p>
              <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-gray-100"
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </button>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            chooseFile(Array.from(event.dataTransfer.files));
          }}
          className={`flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
        >
          <span className="wm-cloud-upload mb-2 text-2xl text-blue-600" aria-hidden />
          <span className="text-sm font-medium text-gray-800">
            Drop an Excel file here, or click to choose
          </span>
          <span className="mt-1 text-xs text-gray-500">
            One conversation per row, stored as JSON like [{'{'}&quot;role&quot;: &quot;assistant&quot;,
            &quot;content&quot;: &quot;…&quot;{'}'}]
          </span>
        </button>
      )}

      {!file ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>Try a sample:</span>
          <button
            type="button"
            className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-gray-50"
            onClick={() => void addSample()}
          >
            Chat log Excel
          </button>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="mb-1 text-xs font-medium text-gray-600">Output layout</p>
          <WuSelect
            data={LAYOUT_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={layout}
            onSelect={(item) => updateOption(() => setLayout(item as LayoutOption))}
            variant="outlined"
          />
        </div>
        {layout.value === 'questions' ? (
          <p className="text-xs text-gray-500 sm:col-span-2 sm:self-center">
            Each interviewer question becomes a column header and each conversation becomes one
            row with the respondent&apos;s answers. Reworded versions of the same question share a
            column.
          </p>
        ) : (
          <>
            <WuInput
              Label="Assistant speaker name"
              labelPosition="top"
              variant="outlined"
              value={interviewerLabel}
              maxLength={60}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateOption(() => setInterviewerLabel(event.target.value))
              }
            />
            <WuInput
              Label="User speaker name"
              labelPosition="top"
              variant="outlined"
              value={respondentLabel}
              maxLength={60}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateOption(() => setRespondentLabel(event.target.value))
              }
            />
          </>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <WuToggle
          Label="Translate everything to English"
          labelPosition="right"
          checked={translateToEnglish}
          onChange={(checked: boolean) => updateOption(() => setTranslateToEnglish(checked))}
        />
        {layout.value === 'questions' ? (
          <WuToggle
            Label="Give one-off follow-up questions their own columns"
            labelPosition="right"
            checked={followUpColumns}
            onChange={(checked: boolean) => updateOption(() => setFollowUpColumns(checked))}
          />
        ) : (
          <WuToggle
            Label="Include system and tool messages"
            labelPosition="right"
            checked={includeSystem}
            onChange={(checked: boolean) => updateOption(() => setIncludeSystem(checked))}
          />
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <WuButton onClick={() => void handleConvert()} disabled={!file || isConverting}>
          {isConverting ? 'Converting…' : 'Convert to transcript'}
        </WuButton>
        {result ? (
          <WuButton
            variant="secondary"
            onClick={() => downloadBase64Excel(result.fileName, result.excelBase64)}
          >
            Download again
          </WuButton>
        ) : null}
      </div>

      {isConverting && progress ? (
        <div className="mt-4 max-w-xl" aria-live="polite">
          <p className="text-xs text-gray-600">
            {STAGE_LABELS[progress.stage]}
            {progress.stage === 'translating' && progress.total > 0
              ? ` · ${progress.done.toLocaleString()} of ${progress.total.toLocaleString()} texts`
              : ''}
          </p>
          {progress.stage === 'translating' && progress.total > 0 ? (
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {summary && preview ? (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-700">
            {plural(summary.conversationCount, 'conversation')} · {plural(summary.turnCount, 'turn')}{' '}
            · read from the <span className="font-medium">{summary.chatColumn}</span> column
            {summary.idColumn ? (
              <>
                , IDs from <span className="font-medium">{summary.idColumn}</span>
              </>
            ) : null}
          </p>
          {summary.translated ? (
            <p className="mt-1 text-xs text-gray-500">
              Translated {plural(summary.translatedTextCount, 'message')} to English
              {summary.layout === 'questions' ? ' and grouped questions by meaning' : ''}.
            </p>
          ) : null}
          {summary.layout === 'questions' ? (
            <div className="mt-3">
              <p className="text-sm text-gray-700">
                {plural(summary.questionColumns.length, 'question column')}
                {summary.followUpCount > 0
                  ? ` · ${plural(summary.followUpCount, 'less common question')} kept together in the "Other follow-ups" column`
                  : ''}
              </p>
              {summary.minConversationsPerColumn > 1 ? (
                <p className="mt-1 text-xs text-gray-500">
                  A question gets its own column when it was asked in at least{' '}
                  {plural(summary.minConversationsPerColumn, 'conversation')}.
                </p>
              ) : null}
              <ol className="mt-2 space-y-1.5">
                {summary.questionColumns.map((column, index) => (
                  <li
                    key={`${index}-${column.question}`}
                    className="flex items-start justify-between gap-3 rounded-md bg-gray-50 px-3 py-2"
                  >
                    <span className="text-sm text-gray-900">
                      {index + 1}. {column.question}
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">
                      Asked in {column.conversationCount} · answered in {column.answeredCount}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          {warnings.map((warning) => (
            <p key={warning} className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {warning}
            </p>
          ))}
          <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-gray-500">
            Preview (first {preview.data.length} rows)
          </p>
          <div className="overflow-x-auto">
            <WuTable
              data={preview.data as unknown[]}
              columns={preview.columns as unknown as IWuTableColumnDef<unknown>[]}
              variant="unstyled"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
