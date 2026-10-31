import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const pdfPath = path.join(process.cwd(), 'public', 'cv.pdf');

describe('generated CV PDF', () => {
  it('exists as a non-empty PDF with a page object', () => {
    expect(existsSync(pdfPath)).toBe(true);
    expect(statSync(pdfPath).size).toBeGreaterThan(1000);

    const pdf = readFileSync(pdfPath, 'utf8');
    expect(pdf.startsWith('%PDF-')).toBe(true);
    expect(pdf).toContain('/Type /Page');
  });
});
