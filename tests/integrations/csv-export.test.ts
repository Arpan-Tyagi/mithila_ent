import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from '@/lib/csv';

// Step 4 / Step 5: CRM export formula-injection probes.

const PROBES = ['=1+1', '+SUM(1,1)', '-2+3', '@SUM(1,1)', '\t=1+1', '\r=1+1', '\n=1+1', '\uFF1D1+1', '",=1+1'];

function cellsOf(line: string): string[] {
  // Minimal RFC 4180 split for the test: quoted fields with "" escapes.
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let j = i + 1, v = '';
      while (j < line.length) {
        if (line[j] === '"' && line[j + 1] === '"') { v += '"'; j += 2; continue; }
        if (line[j] === '"') break;
        v += line[j++];
      }
      out.push(v); i = j + 2;
    } else {
      const j = line.indexOf(',', i);
      out.push(line.slice(i, j === -1 ? undefined : j)); i = j === -1 ? line.length : j + 1;
    }
  }
  return out;
}

describe('CSV formula-injection neutralisation', () => {
  it('no exported text cell starts with a formula trigger', () => {
    const csv = toCsv(['name', 'message'], PROBES.map((p) => [p, `note ${p}`]));
    const rows = csv.trim().split('\r\n').slice(1).map((l) => l.replace(/\r?\n/g, ''));
    expect(rows).toHaveLength(PROBES.length);
    for (const p of PROBES) {
      const c = csvCell(p);
      const inner = c.slice(1, -1).replace(/""/g, '"');
      expect(inner.startsWith('\t') || !/^[=+\-@\r\n\uFF1D]/.test(inner)).toBe(true);
      expect(/^[=+\-@\uFF1D]/.test(inner)).toBe(false);
    }
  });
  it('quote breakout stays inside one cell', () => {
    expect(cellsOf(csvCell('",=1+1'))).toEqual(['",=1+1']);
  });
  it('keeps numbers numeric and plain text untouched', () => {
    expect(csvCell(1234.5)).toBe('1234.5');
    expect(csvCell(-20)).toBe('-20');
    expect(csvCell('Indigo linen')).toBe('"Indigo linen"');
    expect(csvCell(null)).toBe('');
  });
});
