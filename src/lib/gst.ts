// GST place-of-supply helpers.
//
// The intra/inter-state decision (CGST+SGST vs IGST) must compare GST state
// codes, not free-text state names: "New Delhi", "NCT of Delhi", "DL" and "07"
// are all state 07, and a plain string compare against "Delhi" would bill a
// Delhi customer IGST. Codes are the 2-digit GST state codes (the first two
// digits of a GSTIN).

// Supplier registration: GSTIN 07AGUPM2548P1ZH (shown on invoices and the footer).
export const SUPPLIER_STATE_CODE = '07';

const STATES: Array<[code: string, names: string[]]> = [
  ['01', ['jammu and kashmir', 'jammu kashmir', 'j&k', 'jk']],
  ['02', ['himachal pradesh', 'hp']],
  ['03', ['punjab', 'pb']],
  ['04', ['chandigarh', 'ch']],
  ['05', ['uttarakhand', 'uttaranchal', 'uk']],
  ['06', ['haryana', 'hr']],
  ['07', ['delhi', 'new delhi', 'nct of delhi', 'national capital territory of delhi', 'dl']],
  ['08', ['rajasthan', 'rj']],
  ['09', ['uttar pradesh', 'up']],
  ['10', ['bihar', 'br']],
  ['11', ['sikkim', 'sk']],
  ['12', ['arunachal pradesh', 'ar']],
  ['13', ['nagaland', 'nl']],
  ['14', ['manipur', 'mn']],
  ['15', ['mizoram', 'mz']],
  ['16', ['tripura', 'tr']],
  ['17', ['meghalaya', 'ml']],
  ['18', ['assam', 'as']],
  ['19', ['west bengal', 'wb']],
  ['20', ['jharkhand', 'jh']],
  ['21', ['odisha', 'orissa', 'od', 'or']],
  ['22', ['chhattisgarh', 'chattisgarh', 'cg']],
  ['23', ['madhya pradesh', 'mp']],
  ['24', ['gujarat', 'gj']],
  ['26', ['dadra and nagar haveli and daman and diu', 'dadra and nagar haveli', 'daman and diu', 'dnh', 'dd']],
  ['27', ['maharashtra', 'mh']],
  ['29', ['karnataka', 'ka']],
  ['30', ['goa', 'ga']],
  ['31', ['lakshadweep', 'ld']],
  ['32', ['kerala', 'kl']],
  ['33', ['tamil nadu', 'tn']],
  ['34', ['puducherry', 'pondicherry', 'py']],
  ['35', ['andaman and nicobar islands', 'andaman and nicobar', 'an']],
  ['36', ['telangana', 'ts', 'tg']],
  ['37', ['andhra pradesh', 'ap']],
  ['38', ['ladakh', 'la']],
];

const BY_NAME = new Map<string, string>();
const CODES = new Set<string>();
for (const [code, names] of STATES) {
  CODES.add(code);
  for (const n of names) BY_NAME.set(n, code);
}

function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 2-digit GST state code for a state name, abbreviation or code; null if unknown. */
export function gstStateCode(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (/^\d{1,2}$/.test(raw)) {
    const code = raw.padStart(2, '0');
    return CODES.has(code) ? code : null;
  }
  if (raw.toLowerCase() === 'j&k') return '01';
  return BY_NAME.get(normalise(raw)) ?? null;
}

export type GstSplit = { igst: number; cgst: number; sgst: number; totalTax: number; placeOfSupply: string | null };

/**
 * Split tax for one line by place of supply. Same state as the supplier gives
 * CGST + SGST at half the rate each; any other state gives IGST. An
 * unrecognised state is treated as inter-state (IGST) and reported with
 * placeOfSupply = null so callers can ask for a valid state.
 */
export function splitGst(deliveryState: string, baseAmount: number, gstRate: number): GstSplit {
  const pos = gstStateCode(deliveryState);
  const totalTax = (baseAmount * gstRate) / 100;
  if (pos === SUPPLIER_STATE_CODE) {
    const half = totalTax / 2;
    return { igst: 0, cgst: half, sgst: half, totalTax, placeOfSupply: pos };
  }
  return { igst: totalTax, cgst: 0, sgst: 0, totalTax, placeOfSupply: pos };
}
