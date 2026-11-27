import { describe, expect, it } from 'vitest';
import { gstStateCode, splitGst, SUPPLIER_STATE_CODE } from '@/lib/gst';
import { calculateGST } from '@/lib/shipping';
import { computeOrderTotals, TAX_RATE } from '@/lib/pricing';

// Step 4 (GST 2.0 tax engine): place of supply by state code, flat 5% fabric rate.

describe('GST state codes', () => {
  it('maps names, abbreviations, aliases and numeric codes', () => {
    for (const s of ['Delhi', 'New Delhi', 'NCT of Delhi', 'DL', '07', '7', '  delhi  ']) {
      expect(gstStateCode(s)).toBe('07');
    }
    expect(gstStateCode('Orissa')).toBe('21');
    expect(gstStateCode('Pondicherry')).toBe('34');
    expect(gstStateCode('Jammu & Kashmir')).toBe('01');
    expect(gstStateCode('Maharashtra')).toBe('27');
    expect(gstStateCode('25')).toBeNull(); // merged into 26
    expect(gstStateCode('Atlantis')).toBeNull();
    expect(gstStateCode('')).toBeNull();
  });
  it('supplier is registered in Delhi', () => {
    expect(SUPPLIER_STATE_CODE).toBe('07');
  });
});

describe('place-of-supply split (5% fabric)', () => {
  it('intra-state: 2.5% CGST + 2.5% SGST, for every spelling of Delhi', () => {
    for (const s of ['Delhi', 'New Delhi', 'NCT of Delhi']) {
      expect(calculateGST(s, 1000, 5)).toEqual({ igst: 0, cgst: 25, sgst: 25, totalTax: 50 });
    }
  });
  it('inter-state: 5% IGST for cotton, silk and synthetic alike', () => {
    for (const rate of [5, 5, 5]) {
      expect(calculateGST('Maharashtra', 2000, rate)).toEqual({ igst: 100, cgst: 0, sgst: 0, totalTax: 100 });
    }
  });
  it('unknown state is treated as inter-state and flagged', () => {
    const r = splitGst('Atlantis', 1000, 5);
    expect(r).toMatchObject({ igst: 50, cgst: 0, sgst: 0, placeOfSupply: null });
  });
  it('stitched apparel above the cliff (18%) is still split correctly', () => {
    expect(calculateGST('Karnataka', 3000, 18).igst).toBe(540);
  });
});

describe('checkout preview matches the server default rate', () => {
  it('uses 5%, the create_order_atomic default', () => {
    expect(TAX_RATE).toBe(0.05);
    expect(computeOrderTotals(1000).tax).toBe(50);
  });
});
