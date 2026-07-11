import { createClient } from '@/lib/supabase/server';

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
    console.error('Failed to auth with Shiprocket', await res.text());
    return null;
  }

  const data = await res.json();
  shiprocketToken = data.token;
  // Token usually expires in 10 days, we refresh after 9 days
  tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000; 
  return shiprocketToken;
}

export async function calculateShippingRates(deliveryPincode: string, weightKg: number) {
  const token = await getShiprocketToken();
  if (!token) return { rate: 50, error: 'Auth failed' }; // fallback

  const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=110020&delivery_postcode=${deliveryPincode}&weight=${weightKg}&cod=0`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    console.error('Shiprocket courierability failed', await res.text());
    return { rate: 50, error: 'Courier API failed' }; // fallback flat rate
  }

  const data = await res.json();
  if (data.status === 200 && data.data?.available_courier_companies?.length > 0) {
    // Pick the cheapest recommended courier
    const couriers = data.data.available_courier_companies;
    const cheapest = couriers.sort((a: any, b: any) => a.rate - b.rate)[0];
    return { rate: cheapest.rate, courierId: cheapest.courier_company_id };
  }

  return { rate: 50, error: 'No courier available' }; // fallback
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
