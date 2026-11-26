const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;
const WAREHOUSE_STATE = 'Delhi'; // Configurable based on warehouse location

let shiprocketToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getShiprocketToken() {
  if (shiprocketToken && Date.now() < tokenExpiresAt) {
    return shiprocketToken;
  }

  const res = await fetch('https://apiv2.shiprocket.in/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD })
  });

  if (!res.ok) {
    console.error('Failed to auth with Shiprocket', res.status);
    return null;
  }

  const data = await res.json();
  shiprocketToken = data.token;
  // Token usually expires in 10 days, we refresh after 9 days
  tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000; 
  return shiprocketToken;
}

// Indian PIN code: six digits, first digit 1-9 (SEC-05). Anything else is
// rejected before it reaches the courier API or the order row.
export const PIN_CODE_RE = /^[1-9][0-9]{5}$/;

export function isValidPinCode(value: unknown): value is string {
  return typeof value === 'string' && PIN_CODE_RE.test(value);
}

// Fallback used only when the live courier quote is unavailable (no
// Shiprocket credentials, API outage, quota exhausted, no courier). It scales
// with weight so an outage can no longer turn every order into a flat ₹50
// shipment (SEC-05). Owner: adjust these to the real rate card.
export const FALLBACK_BASE_RATE = 80;      // first 0.5 kg, ₹
export const FALLBACK_PER_HALF_KG = 40;    // each further 0.5 kg, ₹

export function fallbackShippingRate(weightKg: number): number {
  const halfKgSlabs = Math.max(1, Math.ceil(Math.max(weightKg, 0) / 0.5));
  return FALLBACK_BASE_RATE + (halfKgSlabs - 1) * FALLBACK_PER_HALF_KG;
}

export async function calculateShippingRates(
  deliveryPincode: string,
  weightKg: number,
): Promise<{ rate: number; courierId?: number; error?: string }> {
  const fallback = fallbackShippingRate(weightKg);
  if (!isValidPinCode(deliveryPincode) || !Number.isFinite(weightKg) || weightKg <= 0) {
    return { rate: fallback, error: 'Invalid input' };
  }

  const token = await getShiprocketToken();
  if (!token) return { rate: fallback, error: 'Auth failed' };

  // Build the query with URLSearchParams so no caller value can add or cut
  // parameters (e.g. "110001&weight=0.1#").
  const qs = new URLSearchParams({
    pickup_postcode: '110020',
    delivery_postcode: deliveryPincode,
    weight: String(Math.round(weightKg * 1000) / 1000),
    cod: '0',
  });

  const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?${qs.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    console.error('Shiprocket serviceability failed', res.status);
    return { rate: fallback, error: 'Courier API failed' };
  }

  const data = await res.json();
  if (data.status === 200 && data.data?.available_courier_companies?.length > 0) {
    // Pick the cheapest recommended courier
    const couriers = data.data.available_courier_companies;
    const cheapest = couriers.sort((a: any, b: any) => a.rate - b.rate)[0];
    const rate = Number(cheapest.rate);
    if (Number.isFinite(rate) && rate >= 0) {
      return { rate, courierId: cheapest.courier_company_id };
    }
  }

  return { rate: fallback, error: 'No courier available' };
}

export function calculateGST(state: string, baseAmount: number, gstRate: number) {
  // If destination state matches warehouse state, apply CGST + SGST. Otherwise IGST.
  const isInterState = state.toLowerCase() !== WAREHOUSE_STATE.toLowerCase();
  
  if (isInterState) {
    return {
      igst: (baseAmount * gstRate) / 100,
      cgst: 0,
      sgst: 0,
      totalTax: (baseAmount * gstRate) / 100
    };
  } else {
    return {
      igst: 0,
      cgst: (baseAmount * (gstRate / 2)) / 100,
      sgst: (baseAmount * (gstRate / 2)) / 100,
      totalTax: (baseAmount * gstRate) / 100
    };
  }
}
