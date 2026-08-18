import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { existsSync } from 'node:fs';

export const runtime = 'nodejs';

const MAX_FILES = 20;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const SCRIPT_RELATIVE = path.join('scripts', 'transcripts_to_excel.py');

function pythonBin(cwd: string): string {
  const venv = path.join(cwd, '.venv', 'bin', 'python');
  return existsSync(venv) ? venv : 'python3';
}

function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';
}

function safeFileName(name: string, index: number): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, '-');
  const cleaned = base.toLowerCase().endsWith('.csv') ? base : `${base || 'transcript'}.csv`;
  return `${String(index + 1).padStart(2, '0')}-${cleaned}`;
}

function runPython(bin: string, args: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

export async function POST(request: Request) {
  const cwd = process.cwd();
  const scriptPath = path.join(cwd, SCRIPT_RELATIVE);
  if (!existsSync(scriptPath)) {
    return Response.json(
      { success: false, error: 'Transcript converter script is missing.' },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ success: false, error: 'Invalid upload.' }, { status: 400 });
  }

  const uploaded = form
    .getAll('files')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (uploaded.length === 0) {
    return Response.json(
      { success: false, error: 'Choose at least one CSV transcript file.' },
      { status: 400 }
    );
  }
  if (uploaded.length > MAX_FILES) {
    return Response.json(
      { success: false, error: `Upload up to ${MAX_FILES} CSV files at a time.` },
      { status: 400 }
    );
  }

  for (const file of uploaded) {
    if (!isCsvFile(file)) {
      return Response.json(
        { success: false, error: `"${file.name}" is not a CSV file.` },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return Response.json(
        { success: false, error: `"${file.name}" is larger than 10 MB.` },
        { status: 400 }
      );
    }
  }

  const workDir = await mkdtemp(path.join(tmpdir(), 'transcripts-'));
  const inputDir = path.join(workDir, 'in');
  const outputPath = path.join(workDir, 'transcript-responses.xlsx');

  try {
    await mkdir(inputDir, { recursive: true });
    const inputPaths: string[] = [];
    for (const [index, file] of uploaded.entries()) {
      const dest = path.join(inputDir, safeFileName(file.name, index));
      await writeFile(dest, Buffer.from(await file.arrayBuffer()));
      inputPaths.push(dest);
    }

    const result = await runPython(
      pythonBin(cwd),
      [scriptPath, '--output', outputPath, '--print-summary', ...inputPaths],
      cwd
    );

    if (result.code !== 0) {
      const detail = (result.stderr || result.stdout).trim() || 'The converter failed.';
      const status = result.code === 2 ? 500 : 400;
      return Response.json({ success: false, error: detail }, { status });
    }

    let summary: unknown = null;
    try {
      summary = JSON.parse(result.stdout);
    } catch {
      summary = null;
    }

    const excel = await readFile(outputPath);
    const stamp = new Date().toISOString().slice(0, 10);
    return Response.json({
      success: true,
      fileName: `transcript-responses-${stamp}.xlsx`,
      excelBase64: excel.toString('base64'),
      summary,
    });
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    const message =
      code === 'ENOENT'
        ? 'Python 3 is not available. Create a virtualenv and install requirements.txt.'
        : error instanceof Error
          ? error.message
          : 'Failed to convert transcripts.';
    return Response.json({ success: false, error: message }, { status: 500 });
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
