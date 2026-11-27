// Spreadsheet-safe CSV for every Owner CRM / order export (OWASP CSV Injection).
//
// Lead names, company names and messages are attacker-controlled. A cell that
// starts with = + - @ (or tab / CR / LF, or the full-width forms) is evaluated
// as a formula by Excel, LibreOffice and Sheets. Such text cells get a leading
// tab inside a quoted field, which spreadsheet apps show as text. Numbers stay
// unquoted numbers so revenue columns still sum.

const FORMULA_START = /^[=+\-@\t\r\n\uFF1D\uFF0B\uFF0D\uFF20]/;

export type CsvCell = string | number | boolean | null | undefined | Date;

export function csvCell(value: CsvCell): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  let s = value instanceof Date ? value.toISOString() : String(value);
  if (FORMULA_START.test(s)) s = '\t' + s;
  return '"' + s.replace(/"/g, '""') + '"';
}

export function toCsv(header: string[], rows: CsvCell[][]): string {
  const lines = [header.map(csvCell).join(',')];
  for (const r of rows) lines.push(r.map(csvCell).join(','));
  return lines.join('\r\n') + '\r\n';
}
