import { zipSync } from 'fflate';
import { subDays } from 'date-fns';

export type QrCodeModalMode = 'manual' | 'bulk';

export interface ManualQrEntry {
  id: string;
  name: string;
  cid: string;
  surveyUrl: string;
  variables: QrUrlVariable[];
}

export interface QrUrlVariable {
  id: string;
  name: string;
  value: string;
}

export interface BulkQrImportRow {
  cid: string;
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

export interface BulkQrGeneratedUrl {
  rowNumber: number;
  cid: string;
  surveyUrl: string;
  variables: Record<string, string>;
}

export interface BulkQrGenerationHistoryEntry {
  id: string;
  fileName: string;
  generatedAt: string;
  urlCount: number;
  variableNames: string[];
  urls: BulkQrGeneratedUrl[];
}

export const QR_BULK_MANIFEST_FILENAME = 'qr-codes-manifest.csv';

export const QR_BULK_IMPORT_ACCEPT = '.csv,.txt';
export const QR_BULK_TEMPLATE_FILENAME = 'survey-qr-bulk-template.csv';
export const QR_LOGO_PATH = '/images/questionpro-qr-logo.png';
export const QR_CONTACT_ID_PARAM = 'cid';

const CID_LENGTH = 16;
const CID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

const cidByVariableSignature = new Map<string, string>();
const variablesByCid = new Map<string, Record<string, string>>();

function buildVariableSignature(variableMap: Record<string, string>): string {
  return JSON.stringify(
    Object.keys(variableMap)
      .sort()
      .map((name) => [name, variableMap[name]])
  );
}

function generateCid(): string {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(CID_LENGTH);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => CID_CHARS[byte % CID_CHARS.length]).join('');
  }

  return Array.from(
    { length: CID_LENGTH },
    () => CID_CHARS[Math.floor(Math.random() * CID_CHARS.length)]
  ).join('');
}

function registerCidVariables(variableMap: Record<string, string>): string {
  const signature = buildVariableSignature(variableMap);
  const existingCid = cidByVariableSignature.get(signature);
  if (existingCid) {
    return existingCid;
  }

  let cid = generateCid();
  while (variablesByCid.has(cid)) {
    cid = generateCid();
  }

  cidByVariableSignature.set(signature, cid);
  variablesByCid.set(cid, variableMap);
  return cid;
}

export function buildSurveyUrlWithCid(baseUrl: string, cid: string): string {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${QR_CONTACT_ID_PARAM}=${cid}`;
}

export function allocateManualQrUrl(
  baseSurveyUrl: string
): Pick<ManualQrEntry, 'cid' | 'surveyUrl'> {
  const cid = generateCid();
  return {
    cid,
    surveyUrl: buildSurveyUrlWithCid(baseSurveyUrl, cid),
  };
}

function buildActiveVariableMap(
  variables: QrUrlVariable[]
): Record<string, string> {
  return Object.fromEntries(
    variables
      .map((variable) => ({
        name: variable.name.trim(),
        value: variable.value.trim(),
      }))
      .filter((variable) => variable.name.length > 0 && variable.value.length > 0)
      .map((variable) => [variable.name, variable.value])
  );
}

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
  const variableMap = buildActiveVariableMap(variables);

  if (Object.keys(variableMap).length === 0) {
    return baseUrl;
  }

  const cid = registerCidVariables(variableMap);
  return buildSurveyUrlWithCid(baseUrl, cid);
}

export function extractCidFromSurveyUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get(QR_CONTACT_ID_PARAM) ?? '';
  } catch {
    return '';
  }
}

export function hasQrVariableValues(variables: QrUrlVariable[]): boolean {
  return variables.some((variable) => variable.name.trim() && variable.value.trim());
}

export function createManualQrEntry(
  baseSurveyUrl: string,
  name: string,
  variables: QrUrlVariable[],
  lockedUrl?: Pick<ManualQrEntry, 'cid' | 'surveyUrl'>
): ManualQrEntry {
  const clonedVariables = variables.map((variable) =>
    createQrVariable({ name: variable.name, value: variable.value })
  );
  const { cid, surveyUrl } = lockedUrl ?? allocateManualQrUrl(baseSurveyUrl);

  return {
    id: createQrVariable().id,
    name: name.trim(),
    cid,
    surveyUrl,
    variables: clonedVariables,
  };
}

export function updateManualQrEntry(
  entry: ManualQrEntry,
  patch: {
    name?: string;
    variables?: QrUrlVariable[];
  }
): ManualQrEntry {
  return {
    ...entry,
    name: patch.name !== undefined ? patch.name.trim() : entry.name,
    variables: patch.variables
      ? patch.variables.map((variable) => ({ ...variable }))
      : entry.variables,
  };
}

function sanitizeQrFileName(name: string, index: number): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `${slug}.png` : `survey-qr-code-${index + 1}.png`;
}

function buildManualQrManifestCsv(entries: ManualQrEntry[], qrFileNames: string[]): string {
  const variableNames = Array.from(
    new Set(
      entries.flatMap((entry) =>
        entry.variables.map((variable) => variable.name.trim()).filter(Boolean)
      )
    )
  ).sort();

  const header = ['qr_file_name', 'qr_name', 'cid', 'survey_url', ...variableNames];
  const dataRows = entries.map((entry, index) => {
    const variableValues = Object.fromEntries(
      entry.variables
        .filter((variable) => variable.name.trim())
        .map((variable) => [variable.name, variable.value])
    );

    return [
      escapeCsvCell(qrFileNames[index] ?? ''),
      escapeCsvCell(entry.name),
      escapeCsvCell(entry.cid),
      escapeCsvCell(entry.surveyUrl),
      ...variableNames.map((name) => escapeCsvCell(variableValues[name] ?? '')),
    ].join(',');
  });

  return [header.join(','), ...dataRows].join('\n');
}

export async function mockDownloadManualQrCodes(entries: ManualQrEntry[]): Promise<void> {
  if (entries.length === 0) {
    throw new Error('Create at least one QR code before downloading.');
  }

  await new Promise((resolve) => {
    window.setTimeout(resolve, entries.length === 1 ? 500 : ZIP_DOWNLOAD_DELAY_MS);
  });

  if (entries.length === 1) {
    const fileName = sanitizeQrFileName(entries[0].name, 0).replace('.png', '');
    await mockDownloadSingleQrCode(entries[0].surveyUrl, fileName);
    return;
  }

  const files: Record<string, Uint8Array> = {};
  const qrFileNames: string[] = [];

  for (let index = 0; index < entries.length; index++) {
    const qrFileName = sanitizeQrFileName(entries[index].name, index);
    qrFileNames.push(qrFileName);
    const qrBlob = await composeBrandedQrCodeBlob(entries[index].surveyUrl, 512);
    files[qrFileName] = new Uint8Array(await qrBlob.arrayBuffer());
  }

  files[QR_BULK_MANIFEST_FILENAME] = new TextEncoder().encode(
    buildManualQrManifestCsv(entries, qrFileNames)
  );

  const zipped = zipSync(files);
  const blob = new Blob([zipped], { type: 'application/zip' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `survey-qr-codes-${entries.length}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function getQrCodeImageUrl(url: string, size = 180): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=H&data=${encodeURIComponent(url)}`;
}

function parseCsvLine(line: string): string[] {
  return line.split(',').map((cell) => cell.trim());
}

function buildSurveyUrlFromBulkRow(
  baseSurveyUrl: string,
  variableNames: string[],
  rowCells: string[]
): { cid: string; surveyUrl: string } {
  const variables = variableNames.map((name, index) =>
    createQrVariable({
      name,
      value: rowCells[index] ?? '',
    })
  );
  const variableMap = buildActiveVariableMap(variables);
  const cid =
    Object.keys(variableMap).length > 0 ? registerCidVariables(variableMap) : '';

  return {
    cid,
    surveyUrl: cid ? buildSurveyUrlWithCid(baseSurveyUrl, cid) : baseSurveyUrl,
  };
}

function buildBulkRow(
  baseSurveyUrl: string,
  variableNames: string[],
  rowCells: string[]
): BulkQrImportRow {
  const variables: Record<string, string> = {};

  variableNames.forEach((name, index) => {
    variables[name] = rowCells[index] ?? '';
  });

  const { cid, surveyUrl } = buildSurveyUrlFromBulkRow(
    baseSurveyUrl,
    variableNames,
    rowCells
  );

  return {
    cid,
    surveyUrl,
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
  const header = ['qr_file_name', 'cid', 'survey_url', ...summary.variableNames];
  const dataRows = summary.rows.map((row, index) =>
    [
      escapeCsvCell(qrFileNames[index] ?? ''),
      escapeCsvCell(row.cid),
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

export async function parseBulkQrImportFile(
  file: File,
  baseSurveyUrl: string
): Promise<BulkQrImportSummary> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, BULK_IMPORT_DELAY_MS);
  });

  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('Import file must include a header row and at least one data row.');
  }

  const variableNames = parseCsvLine(lines[0]);
  if (variableNames.length === 0) {
    throw new Error('Import file must include at least one variable column.');
  }

  const variablesPerUrl = variableNames.length;
  const rows = lines
    .slice(1)
    .map((line) => buildBulkRow(baseSurveyUrl, variableNames, parseCsvLine(line)));
  const urlCount = rows.length;

  if (urlCount === 0) {
    throw new Error('No variable rows were found in the import file.');
  }

  return {
    urlCount,
    variablesPerUrl,
    fileName: file.name,
    variableNames,
    rows,
  };
}

export async function mockDownloadSingleQrCode(
  url: string,
  downloadName = 'survey-qr-code'
): Promise<void> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 500);
  });

  const blob = await composeBrandedQrCodeBlob(url, 512);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `${downloadName}.png`;
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
    'custom1,custom2,custom3,custom4,custom5',
    '1001,email,q1-invite,west,en',
    '1002,email,q1-invite,east,en',
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

export function createBulkQrHistoryEntry(
  summary: BulkQrImportSummary
): BulkQrGenerationHistoryEntry {
  return {
    id: createQrVariable().id,
    fileName: summary.fileName,
    generatedAt: new Date().toISOString(),
    urlCount: summary.urlCount,
    variableNames: [...summary.variableNames],
    urls: summary.rows.map((row, index) => ({
      rowNumber: index + 1,
      cid: row.cid,
      surveyUrl: row.surveyUrl,
      variables: { ...row.variables },
    })),
  };
}

export function bulkQrHistoryEntryToImportSummary(
  entry: BulkQrGenerationHistoryEntry
): BulkQrImportSummary {
  return {
    urlCount: entry.urlCount,
    variablesPerUrl: entry.variableNames.length,
    fileName: entry.fileName,
    variableNames: [...entry.variableNames],
    rows: entry.urls.map((urlEntry) => ({
      cid: urlEntry.cid,
      surveyUrl: urlEntry.surveyUrl,
      variables: { ...urlEntry.variables },
    })),
  };
}

export async function mockDownloadBulkQrHistoryZip(
  entry: BulkQrGenerationHistoryEntry
): Promise<void> {
  await mockDownloadQrCodeZip(bulkQrHistoryEntryToImportSummary(entry));
}

function buildMockBulkGeneratedUrl(
  baseSurveyUrl: string,
  cid: string,
  variables: Record<string, string>,
  rowNumber: number
): BulkQrGeneratedUrl {
  return {
    rowNumber,
    cid,
    surveyUrl: buildSurveyUrlWithCid(baseSurveyUrl, cid),
    variables,
  };
}

function buildMockBulkHistoryBatch(
  baseSurveyUrl: string,
  partial: {
    fileName: string;
    generatedAt: Date;
    variableNames: string[];
    rows: Array<{ cid: string; variables: Record<string, string> }>;
  }
): BulkQrGenerationHistoryEntry {
  return {
    id: createQrVariable().id,
    fileName: partial.fileName,
    generatedAt: partial.generatedAt.toISOString(),
    urlCount: partial.rows.length,
    variableNames: partial.variableNames,
    urls: partial.rows.map((row, index) =>
      buildMockBulkGeneratedUrl(baseSurveyUrl, row.cid, row.variables, index + 1)
    ),
  };
}

const MOCK_BULK_VARIABLE_NAMES = ['custom1', 'custom2', 'custom3', 'custom4', 'custom5'];

export function getMockBulkQrGenerationHistory(
  baseSurveyUrl: string
): BulkQrGenerationHistoryEntry[] {
  const now = new Date();

  return [
    buildMockBulkHistoryBatch(baseSurveyUrl, {
      fileName: 'retail-locations-march.csv',
      generatedAt: subDays(now, 12),
      variableNames: MOCK_BULK_VARIABLE_NAMES,
      rows: [
        {
          cid: 'a8k2m9xq4pn7vrwt',
          variables: {
            custom1: '1001',
            custom2: 'email',
            custom3: 'store-west',
            custom4: 'en',
            custom5: 'q1-invite',
          },
        },
        {
          cid: 'b3n7p1ks8wm2qhx5',
          variables: {
            custom1: '1002',
            custom2: 'email',
            custom3: 'store-east',
            custom4: 'en',
            custom5: 'q1-invite',
          },
        },
        {
          cid: 'c9r4t6vy1zl8jdf3',
          variables: {
            custom1: '1003',
            custom2: 'sms',
            custom3: 'mall-north',
            custom4: 'en',
            custom5: 'q1-invite',
          },
        },
        {
          cid: 'd2w8h5mk0xp9cnt7',
          variables: {
            custom1: '1004',
            custom2: 'sms',
            custom3: 'mall-south',
            custom4: 'es',
            custom5: 'q1-invite',
          },
        },
        {
          cid: 'e7j1q3nb6rs4gva8',
          variables: {
            custom1: '1005',
            custom2: 'print',
            custom3: 'airport-kiosk',
            custom4: 'en',
            custom5: 'q1-invite',
          },
        },
        {
          cid: 'f4m9c2tx7yk5bwh1',
          variables: {
            custom1: '1006',
            custom2: 'print',
            custom3: 'transit-hub',
            custom4: 'fr',
            custom5: 'q1-invite',
          },
        },
        {
          cid: 'g8p5v1nd3qu6jxr9',
          variables: {
            custom1: '1007',
            custom2: 'email',
            custom3: 'flagship-downtown',
            custom4: 'en',
            custom5: 'q1-invite',
          },
        },
        {
          cid: 'h1s6w4mb9tk2nyc5',
          variables: {
            custom1: '1008',
            custom2: 'email',
            custom3: 'pop-up-union-square-holiday-season-display',
            custom4: 'en',
            custom5: 'q1-invite',
          },
        },
        {
          cid: 'j5x3f8rq2vm7pld4',
          variables: {
            custom1: '1009',
            custom2: 'partner',
            custom3: 'reseller-west',
            custom4: 'en',
            custom5: '',
          },
        },
        {
          cid: 'k9t2h7nc4wb1mzs6',
          variables: {
            custom1: '1010',
            custom2: 'partner',
            custom3: 'reseller-east',
            custom4: 'en',
            custom5: 'q1-invite',
          },
        },
      ],
    }),
    buildMockBulkHistoryBatch(baseSurveyUrl, {
      fileName: 'event-booths-q2-rollout-with-extra-long-filename.csv',
      generatedAt: subDays(now, 5),
      variableNames: MOCK_BULK_VARIABLE_NAMES,
      rows: [
        {
          cid: 'm3q8v1pk6rn4txw2',
          variables: {
            custom1: '2001',
            custom2: 'event',
            custom3: 'ces-booth',
            custom4: 'en',
            custom5: 'badge-scan',
          },
        },
        {
          cid: 'n7b2s9hm5wc3jyr8',
          variables: {
            custom1: '2002',
            custom2: 'event',
            custom3: 'sxsw-lounge',
            custom4: 'en',
            custom5: 'badge-scan',
          },
        },
        {
          cid: 'p1d6k4tn8qx2mvb7',
          variables: {
            custom1: '2003',
            custom2: 'event',
            custom3: 'hr-summit',
            custom4: 'en',
            custom5: 'badge-scan',
          },
        },
        {
          cid: 'q4f9r2wj7hp5nxc1',
          variables: {
            custom1: '2004',
            custom2: 'event',
            custom3: 'research-expo',
            custom4: 'de',
            custom5: 'badge-scan',
          },
        },
        {
          cid: 'r8m1t5vq3ks6pyh9',
          variables: {
            custom1: '2005',
            custom2: 'event',
            custom3: 'partner-day',
            custom4: 'en',
            custom5: 'badge-scan',
          },
        },
        {
          cid: 's2w7n4jb9rm1kxt5',
          variables: {
            custom1: '2006',
            custom2: 'event',
            custom3: 'customer-advisory-board',
            custom4: 'en',
            custom5: '',
          },
        },
      ],
    }),
    buildMockBulkHistoryBatch(baseSurveyUrl, {
      fileName: 'partner-channels.csv',
      generatedAt: subDays(now, 2),
      variableNames: MOCK_BULK_VARIABLE_NAMES,
      rows: [
        {
          cid: 't6h3p8nk2vw4qrm7',
          variables: {
            custom1: '3001',
            custom2: 'partner',
            custom3: 'channel-alpha',
            custom4: 'en',
            custom5: 'wave-1',
          },
        },
        {
          cid: 'v9k5m2tx7qn1bwh4',
          variables: {
            custom1: '3002',
            custom2: 'partner',
            custom3: 'channel-beta',
            custom4: 'en',
            custom5: 'wave-1',
          },
        },
        {
          cid: 'w4n8r1pj6sk3mvt2',
          variables: {
            custom1: '3003',
            custom2: 'partner',
            custom3: 'channel-gamma',
            custom4: 'pt',
            custom5: 'wave-1',
          },
        },
      ],
    }),
  ];
}
