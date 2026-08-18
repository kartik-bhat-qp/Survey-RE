import { strToU8, zipSync } from 'fflate';
import {
  formatMetric,
  formatPercent,
  type CrosstabDisplaySettings,
  type CrosstabReportData,
} from '@/data/mock-crosstab-report';

type CellStyle =
  | 'blank'
  | 'question'
  | 'answer'
  | 'option'
  | 'data'
  | 'number'
  | 'summaryLabel'
  | 'summaryNumber'
  | 'summaryValue'
  | 'heat1'
  | 'heat2'
  | 'heat3'
  | 'heat4';

interface ExportCell {
  value?: string | number | RichTextValue;
  style: CellStyle;
}

interface RichTextRun {
  text: string;
  color: string;
}

interface RichTextValue {
  kind: 'rich';
  runs: RichTextRun[];
}

interface SharedStringEntry {
  key: string;
  xml: string;
}

const ROW_PERCENTAGE_COLOR = 'FFF68505';
const COLUMN_PERCENTAGE_COLOR = 'FF267CE1';
const DEFAULT_TEXT_COLOR = 'FF000000';

const STYLE_IDS: Record<CellStyle, number> = {
  blank: 1,
  question: 2,
  answer: 3,
  option: 4,
  data: 5,
  number: 6,
  summaryLabel: 7,
  summaryNumber: 8,
  summaryValue: 9,
  heat1: 10,
  heat2: 11,
  heat3: 12,
  heat4: 13,
};

function xmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function columnLetter(column: number): string {
  let current = column;
  let result = '';
  while (current > 0) {
    current -= 1;
    result = String.fromCharCode(65 + (current % 26)) + result;
    current = Math.floor(current / 26);
  }
  return result;
}

function heatStyle(percentage: number): CellStyle {
  if (percentage >= 50) return 'heat4';
  if (percentage >= 25) return 'heat3';
  if (percentage >= 12.5) return 'heat2';
  return 'heat1';
}

function displayCellValue(
  count: number,
  rowTotal: number,
  columnTotal: number,
  settings: CrosstabDisplaySettings
): string | number | RichTextValue {
  if (!settings.rowPercentage && !settings.columnPercentage) {
    return settings.count ? count : '';
  }
  const runs: RichTextRun[] = [];
  const addRun = (text: string, color: string): void => {
    runs.push({ text: `${runs.length ? '\n' : ''}${text}`, color });
  };
  if (settings.count) addRun(String(count), DEFAULT_TEXT_COLOR);
  if (settings.rowPercentage) {
    addRun(`R% ${formatPercent(count, rowTotal)}`, ROW_PERCENTAGE_COLOR);
  }
  if (settings.columnPercentage) {
    addRun(`C% ${formatPercent(count, columnTotal)}`, COLUMN_PERCENTAGE_COLOR);
  }
  return { kind: 'rich', runs };
}

function displaySummaryValue(
  count: number,
  denominator: number,
  showCount: boolean,
  showPercentage: boolean,
  prefix: 'R%' | 'C%' | 'Base',
  color: string
): string | number | RichTextValue {
  if (!showPercentage) return showCount ? count : '';
  const runs: RichTextRun[] = [];
  if (showCount) runs.push({ text: String(count), color: DEFAULT_TEXT_COLOR });
  runs.push({
    text: `${runs.length ? '\n' : ''}${prefix} ${denominator ? formatPercent(count, denominator) : '—'}`,
    color,
  });
  return {
    kind: 'rich',
    runs,
  };
}

function makeBlankRow(columns: number): ExportCell[] {
  return Array.from({ length: columns }, () => ({ style: 'blank' as const }));
}

function displayLineCount(value: ExportCell['value']): number {
  if (typeof value !== 'object' || value.kind !== 'rich') return 1;
  const text = value.runs.map((run) => run.text).join('');
  return Math.max(1, text.split('\n').length);
}

function buildExportGrid(
  report: CrosstabReportData,
  settings: CrosstabDisplaySettings
): { rows: ExportCell[][]; merges: string[] } {
  const rowOverallColumns = settings.rowOverall ? 1 : 0;
  const showRowTotalColumn = settings.rowTotal || settings.totalRowPercentage;
  const showColumnTotalRow = settings.columnTotal || settings.totalColumnPercentage;
  const groupWidths = report.columnGroups.map(
    (group) =>
      group.options.length +
      (settings.columnMetric ? 1 : 0) +
      (showRowTotalColumn ? 1 : 0)
  );
  const totalColumns = 3 + rowOverallColumns + groupWidths.reduce((sum, width) => sum + width, 0);
  const rows: ExportCell[][] = [];
  const merges: string[] = [];

  const header1 = makeBlankRow(totalColumns);
  merges.push('A1:C1');
  let columnCursor = 4 + rowOverallColumns;
  report.columnGroups.forEach((group, groupIndex) => {
    const start = columnCursor;
    group.options.forEach(() => {
      header1[columnCursor - 1] = { style: 'question' };
      columnCursor += 1;
    });
    header1[start - 1] = { value: group.question, style: 'question' };
    if (group.options.length > 1) {
      merges.push(`${columnLetter(start)}1:${columnLetter(columnCursor - 1)}1`);
    }
    const suffixCount = groupWidths[groupIndex] - group.options.length;
    const suffixStart = columnCursor;
    for (let index = 0; index < suffixCount; index += 1) {
      header1[columnCursor - 1] = { style: 'blank' };
      columnCursor += 1;
    }
    if (suffixCount > 1 && groupIndex < report.columnGroups.length - 1) {
      merges.push(`${columnLetter(suffixStart)}1:${columnLetter(columnCursor - 1)}1`);
    }
  });
  rows.push(header1);

  const header2 = makeBlankRow(totalColumns);
  merges.push('A2:C2');
  columnCursor = 4 + rowOverallColumns;
  report.columnGroups.forEach((group) => {
    group.options.forEach((option) => {
      header2[columnCursor - 1] = { value: option, style: 'option' };
      columnCursor += 1;
    });
    if (settings.columnMetric) {
      header2[columnCursor - 1] = {
        value: settings.columnOverall ? undefined : 'NPS',
        style: settings.columnOverall ? 'blank' : 'summaryLabel',
      };
      columnCursor += 1;
    }
    if (showRowTotalColumn) {
      header2[columnCursor - 1] = {
        value: settings.columnOverall ? undefined : 'Total',
        style: settings.columnOverall ? 'blank' : 'summaryLabel',
      };
      columnCursor += 1;
    }
  });
  rows.push(header2);

  if (settings.columnOverall) {
    const overallRow = makeBlankRow(totalColumns);
    merges.push('A3:C3');
    const overallColumn = settings.rowOverall ? 4 : 3;
    overallRow[overallColumn - 1] = { value: 'Overall', style: 'summaryLabel' };
    columnCursor = 4 + rowOverallColumns;
    report.columnGroups.forEach((group) => {
      group.overallCounts.forEach((value) => {
        overallRow[columnCursor - 1] = { value, style: 'summaryValue' };
        columnCursor += 1;
      });
      if (settings.columnMetric) {
        overallRow[columnCursor - 1] = { value: 'NPS', style: 'summaryLabel' };
        columnCursor += 1;
      }
      if (showRowTotalColumn) {
        overallRow[columnCursor - 1] = { value: 'Total', style: 'summaryLabel' };
        columnCursor += 1;
      }
    });
    rows.push(overallRow);
  }

  report.rowGroups.forEach((rowGroup) => {
    const firstAnswerRow = rows.length + 1;
    rowGroup.answers.forEach((answer, answerIndex) => {
      const row = makeBlankRow(totalColumns);
      if (answerIndex === 0) {
        row[0] = { value: rowGroup.question, style: 'question' };
      }
      row[1] = { style: 'question' };
      row[2] = { value: answer.label, style: 'answer' };
      columnCursor = 4;
      if (settings.rowOverall) {
        row[columnCursor - 1] = { value: answer.overall, style: 'summaryNumber' };
        columnCursor += 1;
      }
      report.columnGroups.forEach((group, groupIndex) => {
        answer.counts[groupIndex].forEach((count, optionIndex) => {
          const rowTotal = answer.totals[groupIndex];
          const columnTotal = rowGroup.columnTotals[groupIndex][optionIndex];
          const percentage = settings.heatmapRows
            ? rowTotal
              ? (count / rowTotal) * 100
              : 0
            : columnTotal
              ? (count / columnTotal) * 100
              : 0;
          const useHeat = settings.heatmapRows || settings.heatmapColumns;
          const cellValue = displayCellValue(count, rowTotal, columnTotal, settings);
          row[columnCursor - 1] = {
            value: cellValue,
            style: useHeat
              ? heatStyle(percentage)
              : typeof cellValue === 'number'
                ? 'number'
                : 'data',
          };
          columnCursor += 1;
        });
        if (settings.columnMetric) {
          row[columnCursor - 1] = {
            value: Number(formatMetric(answer.metrics[groupIndex])),
            style: 'summaryValue',
          };
          columnCursor += 1;
        }
        if (showRowTotalColumn) {
          row[columnCursor - 1] = {
            value: displaySummaryValue(
              answer.totals[groupIndex],
              rowGroup.bases[groupIndex],
              settings.rowTotal,
              settings.totalRowPercentage,
              'R%',
              ROW_PERCENTAGE_COLOR
            ),
            style: 'summaryValue',
          };
          columnCursor += 1;
        }
        void group;
      });
      rows.push(row);
    });
    const lastAnswerRow = rows.length;
    if (lastAnswerRow > firstAnswerRow) {
      merges.push(`A${firstAnswerRow}:B${lastAnswerRow}`);
    } else {
      merges.push(`A${firstAnswerRow}:B${firstAnswerRow}`);
    }

    const addSummaryRow = (label: 'NPS' | 'Total', values: number[][]): void => {
      const row = makeBlankRow(totalColumns);
      const rowNumber = rows.length + 1;
      const labelColumn = settings.rowOverall ? 4 : 3;
      if (labelColumn > 1) merges.push(`A${rowNumber}:${columnLetter(labelColumn - 1)}${rowNumber}`);
      row[labelColumn - 1] = { value: label, style: 'summaryLabel' };
      columnCursor = 4 + rowOverallColumns;
      report.columnGroups.forEach((group, groupIndex) => {
        values[groupIndex].forEach((value) => {
          row[columnCursor - 1] = {
            value:
              label === 'NPS'
                ? Number(formatMetric(value))
                : displaySummaryValue(
                    value,
                    rowGroup.bases[groupIndex],
                    settings.columnTotal,
                    settings.totalColumnPercentage,
                    'C%',
                    COLUMN_PERCENTAGE_COLOR
                  ),
            style: 'summaryValue',
          };
          columnCursor += 1;
        });
        if (settings.columnMetric) {
          row[columnCursor - 1] = { style: 'summaryValue' };
          columnCursor += 1;
        }
        if (showRowTotalColumn) {
          row[columnCursor - 1] = {
            value:
              label === 'Total'
                ? displaySummaryValue(
                    rowGroup.bases[groupIndex],
                    rowGroup.bases[groupIndex],
                    settings.rowTotal && settings.columnTotal,
                    settings.totalColumnPercentage || settings.totalRowPercentage,
                    'Base',
                    DEFAULT_TEXT_COLOR
                  )
                : undefined,
            style: 'summaryValue',
          };
          columnCursor += 1;
        }
        void group;
      });
      rows.push(row);
    };

    if (settings.rowMetric) addSummaryRow('NPS', rowGroup.columnMetrics);
    if (showColumnTotalRow) addSummaryRow('Total', rowGroup.columnTotals);
  });

  return { rows, merges };
}

function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font>
    <font><b/><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font>
  </fonts>
  <fills count="10">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFCCF0FF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEEEEEE"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEDF6FD"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1FAF2"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE1F5E5"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFCDEFD3"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFB5E6BE"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right><top style="thin"><color rgb="FF000000"/></top><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="14">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="0" fillId="5" borderId="1" xfId="0" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="5" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="5" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top"/></xf>
    <xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top"/></xf>
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top"/></xf>
    <xf numFmtId="0" fontId="0" fillId="6" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="7" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="8" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="9" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

export function createCrosstabWorkbook(
  report: CrosstabReportData,
  settings: CrosstabDisplaySettings
): Uint8Array {
  const { rows, merges } = buildExportGrid(report, settings);
  const sharedStrings: SharedStringEntry[] = [];
  const stringIndexes = new Map<string, number>();
  const getStringIndex = (value: string | RichTextValue): number => {
    const key =
      typeof value === 'string'
        ? `plain:${value}`
        : `rich:${JSON.stringify(value.runs)}`;
    const current = stringIndexes.get(key);
    if (current !== undefined) return current;
    const next = sharedStrings.length;
    const xml =
      typeof value === 'string'
        ? `<si><t xml:space="preserve">${xmlEscape(value)}</t></si>`
        : `<si>${value.runs
            .map(
              (run) =>
                `<r><rPr><rFont val="Calibri"/><family val="2"/><scheme val="minor"/><sz val="11"/><color rgb="${run.color}"/></rPr><t xml:space="preserve">${xmlEscape(run.text)}</t></r>`
            )
            .join('')}</si>`;
    sharedStrings.push({ key, xml });
    stringIndexes.set(key, next);
    return next;
  };

  const sheetRows = rows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const lineCount = row.reduce(
        (maximum, cell) => Math.max(maximum, displayLineCount(cell.value)),
        1
      );
      const height = lineCount * 15;
      const cells = row
        .map((cell, columnIndex) => {
          const reference = `${columnLetter(columnIndex + 1)}${rowNumber}`;
          const styleId = STYLE_IDS[cell.style];
          if (typeof cell.value === 'number') {
            return `<c r="${reference}" s="${styleId}"><v>${cell.value}</v></c>`;
          }
          if (typeof cell.value === 'string' && cell.value.length > 0) {
            return `<c r="${reference}" t="s" s="${styleId}"><v>${getStringIndex(cell.value)}</v></c>`;
          }
          if (typeof cell.value === 'object' && cell.value.kind === 'rich') {
            return `<c r="${reference}" t="s" s="${styleId}"><v>${getStringIndex(cell.value)}</v></c>`;
          }
          return `<c r="${reference}" s="${styleId}"/>`;
        })
        .join('');
      return `<row r="${rowNumber}" ht="${height}" customHeight="1">${cells}</row>`;
    })
    .join('');

  const columns = rows[0]
    .map((_, index) => `<col min="${index + 1}" max="${index + 1}" width="14" customWidth="1"/>`)
    .join('');
  const mergeXml = merges.length
    ? `<mergeCells count="${merges.length}">${merges.map((ref) => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells>`
    : '';
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews><sheetView tabSelected="1" workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/><cols>${columns}</cols><sheetData>${sheetRows}</sheetData>${mergeXml}
</worksheet>`;
  const sharedXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">${sharedStrings
    .map((entry) => entry.xml)
    .join('')}</sst>`;
  const timestamp = new Date().toISOString();
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`),
    'docProps/app.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>QuestionPro Business Intelligence</Application></Properties>`),
    'docProps/core.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>QuestionPro</dc:creator><cp:lastModifiedBy>QuestionPro</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:modified></cp:coreProperties>`),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets><sheet name="Crosstab" sheetId="1" r:id="rId1"/></sheets><calcPr calcId="152511"/></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>`),
    'xl/styles.xml': strToU8(buildStylesXml()),
    'xl/sharedStrings.xml': strToU8(sharedXml),
    'xl/worksheets/sheet1.xml': strToU8(sheetXml),
  };
  return zipSync(files, { level: 6 });
}

export function makeCrosstabExportFilename(date = new Date()): string {
  return `crosstab-${date.toISOString().replaceAll(':', '-')}.xlsx`;
}
