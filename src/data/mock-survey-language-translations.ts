import ExcelJS from 'exceljs';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import {
  GENERAL_TEXT_TRANSLATION_GROUPS,
  flattenTranslationGroups,
  getQuestionTranslationBlocks,
} from '@/data/mock-manual-translations';

export interface SurveyTranslationStringRow {
  key: string;
  source: string;
}

export interface SurveyTranslationImportSummary {
  fileName: string;
  translatedCount: number;
  totalStrings: number;
}

export interface SurveyTranslationImportResult {
  ok: true;
  summary: SurveyTranslationImportSummary;
}

export interface SurveyTranslationImportError {
  ok: false;
  message: string;
}

const TEMPLATE_HEADERS = ['Key', 'Source', 'Translation'] as const;

export function collectSurveyTranslationStrings(
  questions: SurveyQuestion[]
): SurveyTranslationStringRow[] {
  const general = flattenTranslationGroups(GENERAL_TEXT_TRANSLATION_GROUPS).map((field) => ({
    key: field.id,
    source: field.source,
  }));
  const questionRows = getQuestionTranslationBlocks(questions).flatMap((block) =>
    flattenTranslationGroups(block.groups).map((field) => ({
      key: field.id,
      source: field.source,
    }))
  );
  return [...general, ...questionRows];
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Builds an .xlsx translation template with an empty Translation column. */
export async function downloadSurveyTranslationTemplate(
  rows: SurveyTranslationStringRow[],
  filename = 'survey-translation-template.xlsx'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Translations');
  sheet.addRow([...TEMPLATE_HEADERS]);
  for (const row of rows) {
    sheet.addRow([row.key, row.source, '']);
  }
  sheet.getRow(1).font = { bold: true };
  sheet.columns = [{ width: 28 }, { width: 48 }, { width: 48 }];

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    filename
  );
}

export async function parseSurveyTranslationXlsx(
  file: File,
  expectedRows: SurveyTranslationStringRow[]
): Promise<SurveyTranslationImportResult | SurveyTranslationImportError> {
  const name = file.name.toLowerCase();
  if (!name.endsWith('.xlsx')) {
    return { ok: false, message: 'Only .xlsx files are supported.' };
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return { ok: false, message: 'The file does not contain a worksheet.' };
    }

    const headerRow = sheet.getRow(1);
    const headers = [1, 2, 3].map((col) =>
      String(headerRow.getCell(col).text ?? '').trim()
    );
    const expected = TEMPLATE_HEADERS.map((header) => normalizeHeader(header));
    const actual = headers.map(normalizeHeader);
    if (
      actual[0] !== expected[0] ||
      actual[1] !== expected[1] ||
      actual[2] !== expected[2]
    ) {
      return {
        ok: false,
        message:
          'This file does not match the translation template. Download the template and try again.',
      };
    }

    const expectedKeys = new Set(expectedRows.map((row) => row.key));
    if (expectedKeys.size === 0) {
      return {
        ok: false,
        message: 'There are no survey strings available to translate yet.',
      };
    }

    let matchedKeys = 0;
    let translatedCount = 0;
    const seenKeys = new Set<string>();

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const key = String(row.getCell(1).text ?? '').trim();
      const translation = String(row.getCell(3).text ?? '').trim();
      if (!key) return;
      if (!expectedKeys.has(key)) return;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      matchedKeys += 1;
      if (translation.length > 0) {
        translatedCount += 1;
      }
    });

    if (matchedKeys === 0) {
      return {
        ok: false,
        message:
          'No matching translation keys were found. Download the template and try again.',
      };
    }

    return {
      ok: true,
      summary: {
        fileName: file.name,
        translatedCount,
        totalStrings: expectedRows.length,
      },
    };
  } catch {
    return {
      ok: false,
      message: 'Unable to read this file. Upload a valid .xlsx translation template.',
    };
  }
}
