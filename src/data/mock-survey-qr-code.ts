import { zipSync } from 'fflate';

export type QrCodeModalMode = 'single' | 'bulk';

export interface QrUrlVariable {
  id: string;
  name: string;
  value: string;
}

export interface BulkQrImportRow {
  surveyUrl: string;
  variables: Record<string, string>;
}

export interface BulkQrImportSummary {
  urlCount: number;
  variablesPerUrl: number;
  fileName: string;
  variableNames: string[];
  rows: BulkQrImportRow[];
}

export const QR_BULK_MANIFEST_FILENAME = 'qr-codes-manifest.csv';

export const QR_BULK_IMPORT_ACCEPT = '.csv,.txt';
export const QR_BULK_TEMPLATE_FILENAME = 'survey-qr-bulk-template.csv';
export const QR_LOGO_PATH = '/images/questionpro-qr-logo.png';

export const SAMPLE_QR_VARIABLES: Array<Pick<QrUrlVariable, 'name' | 'value'>> = [
  { name: 'custom1', value: '' },
  { name: 'custom2', value: '' },
  { name: 'custom3', value: '' },
  { name: 'custom4', value: '' },
  { name: 'custom5', value: '' },
];

export const QR_VARIABLE_NAME_OPTIONS: Array<{ value: string; label: string }> = Array.from(
  { length: 255 },
  (_, index) => {
    const number = index + 1;
    return { value: `custom${number}`, label: `custom ${number}` };
  }
);

export function getNextQrVariableName(usedNames: string[]): string {
  const used = new Set(usedNames);
  const next = QR_VARIABLE_NAME_OPTIONS.find((option) => !used.has(option.value));
  return next?.value ?? QR_VARIABLE_NAME_OPTIONS[0].value;
}

const BULK_IMPORT_DELAY_MS = 900;
const ZIP_DOWNLOAD_DELAY_MS = 1200;

/** Prototype-only encoding so variable values never appear in plain text in URLs. */
export function encryptQrVariableValue(plainText: string): string {
  const bytes = new TextEncoder().encode(plainText);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `enc.${encoded}`;
}

export function createQrVariable(
  partial: Partial<QrUrlVariable> = {}
): QrUrlVariable {
  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `var-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: partial.name ?? '',
    value: partial.value ?? '',
  };
}

export function buildSurveyUrlWithVariables(
  baseUrl: string,
  variables: QrUrlVariable[]
): string {
  const params = variables
    .map((variable) => ({
      name: variable.name.trim(),
      value: variable.value.trim(),
    }))
    .filter((variable) => variable.name.length > 0 && variable.value.length > 0);

  if (params.length === 0) {
    return baseUrl;
  }

  const query = params
    .map(
      (variable) =>
        `${encodeURIComponent(variable.name)}=${encodeURIComponent(encryptQrVariableValue(variable.value))}`
    )
    .join('&');

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${query}`;
}

export function getQrCodeImageUrl(url: string, size = 180): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=H&data=${encodeURIComponent(url)}`;
}

function parseCsvLine(line: string): string[] {
  return line.split(',').map((cell) => cell.trim());
}

function buildSurveyUrlFromBulkRow(headerCells: string[], rowCells: string[]): string {
  const baseUrl = rowCells[0] ?? '';
  const variables = headerCells.slice(1).map((name, index) =>
    createQrVariable({
      name,
      value: rowCells[index + 1] ?? '',
    })
  );

  return buildSurveyUrlWithVariables(baseUrl, variables);
}

function buildBulkRow(headerCells: string[], rowCells: string[]): BulkQrImportRow {
  const variableNames = headerCells.slice(1);
  const variables: Record<string, string> = {};

  variableNames.forEach((name, index) => {
    variables[name] = rowCells[index + 1] ?? '';
  });

  return {
    surveyUrl: buildSurveyUrlFromBulkRow(headerCells, rowCells),
    variables,
  };
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildBulkQrManifestCsv(summary: BulkQrImportSummary, qrFileNames: string[]): string {
  const header = ['qr_file_name', 'survey_url', ...summary.variableNames];
  const dataRows = summary.rows.map((row, index) =>
    [
      escapeCsvCell(qrFileNames[index] ?? ''),
      escapeCsvCell(row.surveyUrl),
      ...summary.variableNames.map((name) => escapeCsvCell(row.variables[name] ?? '')),
    ].join(',')
  );

  return [header.join(','), ...dataRows].join('\n');
}

function getQrFileName(index: number): string {
  return `survey-qr-code-${index + 1}.png`;
}

function loadImageElement(src: string, crossOrigin?: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (crossOrigin) {
      image.crossOrigin = crossOrigin;
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

async function loadQrCodeImage(url: string, size: number): Promise<HTMLImageElement> {
  const qrCodeUrl = getQrCodeImageUrl(url, size);

  try {
    const response = await fetch(qrCodeUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch QR code image');
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      return await loadImageElement(objectUrl);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return loadImageElement(qrCodeUrl, 'anonymous');
  }
}

export async function composeBrandedQrCodeBlob(
  url: string,
  size = 512
): Promise<Blob> {
  const [qrImage, logoImage] = await Promise.all([
    loadQrCodeImage(url, size),
    loadImageElement(QR_LOGO_PATH),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create QR code canvas');
  }

  context.drawImage(qrImage, 0, 0, size, size);

  const logoBoxSize = size * 0.22;
  const logoBoxX = (size - logoBoxSize) / 2;
  const logoBoxY = (size - logoBoxSize) / 2;
  const padding = size * 0.012;

  context.fillStyle = '#ffffff';
  context.fillRect(
    logoBoxX - padding,
    logoBoxY - padding,
    logoBoxSize + padding * 2,
    logoBoxSize + padding * 2
  );

  context.drawImage(logoImage, logoBoxX, logoBoxY, logoBoxSize, logoBoxSize);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Unable to export branded QR code'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

export async function parseBulkQrImportFile(file: File): Promise<BulkQrImportSummary> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, BULK_IMPORT_DELAY_MS);
  });

  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('Import file must include a header row and at least one URL row.');
  }

  const headerCells = parseCsvLine(lines[0]);
  const variableNames = headerCells.slice(1);
  const variablesPerUrl = variableNames.length;
  const rows = lines.slice(1).map((line) => buildBulkRow(headerCells, parseCsvLine(line)));
  const urlCount = rows.length;

  if (urlCount === 0) {
    throw new Error('No survey URLs were found in the import file.');
  }

  return {
    urlCount,
    variablesPerUrl,
    fileName: file.name,
    variableNames,
    rows,
  };
}

export async function mockDownloadSingleQrCode(url: string): Promise<void> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 500);
  });

  const blob = await composeBrandedQrCodeBlob(url, 512);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = 'survey-qr-code.png';
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function copyBrandedQrCodeToClipboard(url: string, size = 512): Promise<void> {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    throw new Error('Image clipboard is not supported in this browser');
  }

  const blob = await composeBrandedQrCodeBlob(url, size);
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

export async function mockDownloadQrCodeZip(summary: BulkQrImportSummary): Promise<void> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, ZIP_DOWNLOAD_DELAY_MS);
  });

  const files: Record<string, Uint8Array> = {};
  const qrFileNames: string[] = [];

  for (let index = 0; index < summary.rows.length; index++) {
    const { surveyUrl } = summary.rows[index];
    const qrFileName = getQrFileName(index);
    qrFileNames.push(qrFileName);
    const qrBlob = await composeBrandedQrCodeBlob(surveyUrl, 512);
    const qrBytes = new Uint8Array(await qrBlob.arrayBuffer());
    files[qrFileName] = qrBytes;
  }

  const manifestCsv = buildBulkQrManifestCsv(summary, qrFileNames);
  files[QR_BULK_MANIFEST_FILENAME] = new TextEncoder().encode(manifestCsv);

  const zipped = zipSync(files);
  const blob = new Blob([zipped], { type: 'application/zip' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `survey-qr-codes-${summary.urlCount}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function getBulkTemplateCsv(): string {
  return [
    'survey_url,custom1,custom2,custom3,custom4,custom5',
    'https://productteam26.questionpro.com/a/TakeSurvey?id=12345,1001,email,q1-invite,west,en',
    'https://productteam26.questionpro.com/a/TakeSurvey?id=12345,1002,email,q1-invite,east,en',
  ].join('\n');
}

export function downloadBulkTemplateCsv(): void {
  const blob = new Blob([getBulkTemplateCsv()], { type: 'text/csv' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = QR_BULK_TEMPLATE_FILENAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
