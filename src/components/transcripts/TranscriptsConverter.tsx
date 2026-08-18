'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false }
);

type SampleFile = {
  href: string;
  name: string;
  label: string;
};

type QuestionSummary = {
  index: number;
  question: string;
  sheet: string;
  responseCount: number;
  transcriptCount: number;
};

type TransformSummary = {
  questionCount: number;
  responseCount: number;
  transcriptCount: number;
  files?: Array<{ file: string; layout: string; responses: number }>;
  questions?: QuestionSummary[];
};

type TransformSuccess = {
  success: true;
  fileName: string;
  excelBase64: string;
  summary: TransformSummary | null;
};

type TransformError = {
  success: false;
  error: string;
};

const SAMPLE_FILES: SampleFile[] = [
  {
    href: '/transcripts/sample-interviews.csv',
    name: 'sample-interviews.csv',
    label: 'Interview CSV',
  },
  {
    href: '/transcripts/sample-dialogue.csv',
    name: 'sample-dialogue.csv',
    label: 'Dialogue CSV',
  },
];

function isCsvFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.csv');
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadBase64Excel(fileName: string, excelBase64: string): void {
  const binary = atob(excelBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function TranscriptsConverter() {
  const { showToast } = useWuShowToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<TransformSuccess | null>(null);

  function addFiles(incoming: File[]): void {
    const csvs = incoming.filter(isCsvFile);
    if (csvs.length !== incoming.length) {
      showToast({ message: 'Only CSV transcript files are supported', variant: 'error' });
    }
    if (csvs.length === 0) return;
    setResult(null);
    setFiles((prev) => {
      const names = new Set(prev.map((file) => file.name));
      const next = [...prev];
      for (const file of csvs) {
        if (names.has(file.name)) continue;
        names.add(file.name);
        next.push(file);
      }
      return next;
    });
  }

  async function addSample(sample: SampleFile): Promise<void> {
    try {
      const response = await fetch(sample.href);
      if (!response.ok) throw new Error('Sample file is missing');
      const blob = await response.blob();
      addFiles([new File([blob], sample.name, { type: 'text/csv' })]);
    } catch {
      showToast({ message: `Could not load ${sample.label}`, variant: 'error' });
    }
  }

  async function handleConvert(): Promise<void> {
    if (files.length === 0 || isConverting) return;
    setIsConverting(true);
    try {
      const form = new FormData();
      for (const file of files) {
        form.append('files', file);
      }
      const response = await fetch('/api/transcripts/transform', {
        method: 'POST',
        body: form,
      });
      const payload = (await response.json()) as TransformSuccess | TransformError;
      if (!response.ok || !payload.success) {
        const error = payload.success === false ? payload.error : 'Conversion failed.';
        showToast({ message: error, variant: 'error' });
        return;
      }
      setResult(payload);
      downloadBase64Excel(payload.fileName, payload.excelBase64);
      const questionCount = payload.summary?.questionCount ?? 0;
      showToast({
        message: `Downloaded Excel with ${questionCount} common question${questionCount === 1 ? '' : 's'}`,
        variant: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Conversion failed.';
      showToast({ message, variant: 'error' });
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <WuCard rounded className="mb-8 p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">Convert transcripts to Excel</h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload one or more CSV transcripts. The converter groups answers under each common
          question and returns an Excel workbook.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        multiple
        className="hidden"
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />

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
          addFiles(Array.from(event.dataTransfer.files));
        }}
        className={`flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <span className="wm-cloud-upload mb-2 text-2xl text-blue-600" aria-hidden />
        <span className="text-sm font-medium text-gray-800">Drop CSV files here, or click to choose</span>
        <span className="mt-1 text-xs text-gray-500">
          Supports question/response, one-column-per-question, and speaker/text exports
        </span>
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span>Try a sample:</span>
        {SAMPLE_FILES.map((sample) => (
          <button
            key={sample.href}
            type="button"
            className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-gray-50"
            onClick={() => void addSample(sample)}
          >
            {sample.label}
          </button>
        ))}
      </div>

      {files.length > 0 ? (
        <ul className="mt-4 divide-y divide-gray-100 rounded-md border border-gray-200">
          {files.map((file) => (
            <li key={file.name} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                onClick={() => {
                  setResult(null);
                  setFiles((prev) => prev.filter((item) => item.name !== file.name));
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <WuButton onClick={() => void handleConvert()} disabled={files.length === 0 || isConverting}>
          {isConverting ? 'Converting…' : 'Convert to Excel'}
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

      {result?.summary ? (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-600">
            {result.summary.questionCount} common question
            {result.summary.questionCount === 1 ? '' : 's'} · {result.summary.responseCount}{' '}
            response{result.summary.responseCount === 1 ? '' : 's'} · {result.summary.transcriptCount}{' '}
            transcript{result.summary.transcriptCount === 1 ? '' : 's'}
          </p>
          {result.summary.questions && result.summary.questions.length > 0 ? (
            <ol className="mt-3 space-y-2">
              {result.summary.questions.map((question) => (
                <li key={question.index} className="rounded-md bg-gray-50 px-3 py-2">
                  <p className="text-sm font-medium text-gray-900">
                    {question.index}. {question.question}
                  </p>
                  <p className="text-xs text-gray-500">
                    {question.responseCount} response{question.responseCount === 1 ? '' : 's'} from{' '}
                    {question.transcriptCount} transcript{question.transcriptCount === 1 ? '' : 's'}
                  </p>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </WuCard>
  );
}
