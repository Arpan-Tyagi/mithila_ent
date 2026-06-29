import { Resend } from 'resend';
import React from 'react';
import { render } from '@react-email/components';
import { OrderConfirmationEmail } from '@/components/emails/OrderConfirmationEmail';
import { generateInvoiceBuffer } from '@/utils/pdf/generateInvoice';
import type { SupabaseClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build_only');
const FROM = process.env.EMAIL_FROM || 'Mithila Enterprises <onboarding@resend.dev>';

export async function sendSecurityAlertEmail(email: string) {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Security Alert: Multiple Failed Login Attempts',
      html: `
        <div style="font-family: sans-serif; color: #333; padding: 20px;">
          <h2 style="color: #990000;">Security Alert</h2>
          <p>We detected 5 consecutive failed login attempts on your account.</p>
          <p>For your protection, your account has been temporarily locked for 15 minutes.</p>
          <p>If this was not you, please reset your password immediately or contact support.</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Failed to send security email', error);
  }
}

export async function sendInvoiceEmail(
  email: string, 
  shippingDetails: any, 
  cartItems: any[], 
  subtotal: number, 
  taxAmount: number, 
  total: number,
  paymentId: string
) {
  try {
    // Premium Formal Invoice HTML
    const itemsHtml = cartItems.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.title} (${item.color})</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price.toFixed(2)}</td>
      </tr>
    `).join('');

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Order Confirmation - Mithila Enterprises (${paymentId})`,
      html: `
        <div style="font-family: serif; color: #1a1a1a; padding: 40px; max-width: 600px; margin: 0 auto; background-color: #fcfcfc; border: 1px solid #eee;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-style: italic; color: #0f172a; margin: 0;">Mithila Enterprises</h1>
            <p style="font-family: sans-serif; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; margin-top: 5px; color: #64748b;">Premium Textile Registry</p>
          </div>
          
          <p style="font-family: sans-serif; font-size: 14px;">Dear ${shippingDetails.firstName},</p>
          <p style="font-family: sans-serif; font-size: 14px;">Your procurement order has been formally registered and payment was successful.</p>
          
          <h3 style="font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #0f172a; padding-bottom: 5px; margin-top: 40px;">Invoice Details</h3>
          <p style="font-family: sans-serif; font-size: 12px;"><strong>Transaction ID:</strong> ${paymentId}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-family: sans-serif; font-size: 13px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 8px; border-bottom: 2px solid #333;">Textile</th>
                <th style="text-align: center; padding: 8px; border-bottom: 2px solid #333;">Qty</th>
                <th style="text-align: right; padding: 8px; border-bottom: 2px solid #333;">Unit Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; font-family: sans-serif; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Subtotal:</span>
              <span style="float: right;">₹${subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Tax (18% GST):</span>
              <span style="float: right;">₹${taxAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 15px; border-top: 2px solid #333; padding-top: 15px;">
              <span>Total Paid:</span>
              <span style="float: right;">₹${total.toFixed(2)}</span>
            </div>
          </div>
          
          <div style="margin-top: 60px; text-align: center; font-family: sans-serif; font-size: 11px; color: #64748b;">
            <p>Shipping to: ${shippingDetails.address1}, ${shippingDetails.city}, ${shippingDetails.state} ${shippingDetails.pinCode}</p>
            <p>Thank you for choosing Mithila Enterprises.</p>
          </div>
        </div>
      `
    });
    console.log('Invoice email dispatched successfully');
  } catch (error) {
    console.error('Failed to send invoice email', error);
  }
}

// ---------------------------------------------------------------------------
// Durable email queue (pending_emails) — confirmation/invoice + status emails.
// Enqueue a job, then send it best-effort inline; the cron worker retries any
// job left pending with exponential backoff. See supabase/migrations/0020.
// ---------------------------------------------------------------------------

export type EmailKind = 'order_confirmation' | 'order_shipped' | 'order_delivered' | 'order_cancelled';

const MAX_BATCH = 25;

export async function enqueueOrderEmail(
  admin: SupabaseClient,
  args: { orderId: string; recipient: string; kind: EmailKind; payload?: Record<string, any> }
) {
  const { data, error } = await admin
    .from('pending_emails')
    .insert({
      order_id: args.orderId,
      recipient: args.recipient,
      kind: args.kind,
      payload: args.payload ?? {},
    })
    .select('*')
    .single();
  if (error) {
    console.error('enqueueOrderEmail failed:', error);
    return null;
  }
  return data as any;
}

type Built = { subject: string; html: string; attachments?: { filename: string; content: Buffer }[] };

async function buildEmail(admin: SupabaseClient, row: any): Promise<Built | null> {
  const { data: order } = await admin
    .from('orders')
    .select('*, order_items(*, product_variants(color, products(title)))')
    .eq('id', row.order_id)
    .single();
  if (!order) return null;

  const payload = row.payload || {};
  const addr: any = order.shipping_address || {};
  const shortId = String(order.id).split('-')[0].toUpperCase();
  const customerName =
    payload.customerName ||
    [addr.firstName, addr.lastName].filter(Boolean).join(' ') ||
    addr.fullName ||
    'Customer';

  if (row.kind === 'order_confirmation') {
    const html = await render(
      React.createElement(OrderConfirmationEmail, {
        orderId: String(order.id),
        customerName,
        totalAmount: Number(order.total_amount),
      })
    );
    const pdf = await generateInvoiceBuffer(order, order.order_items || []);
    return {
      subject: 'Order Confirmation & Official Invoice',
      html,
      attachments: [{ filename: `Invoice_${shortId}.pdf`, content: pdf }],
    };
  }

  const status =
    row.kind === 'order_shipped' ? 'shipped' : row.kind === 'order_delivered' ? 'delivered' : 'cancelled';
  const heading =
    status === 'shipped'
      ? 'Your order is on its way'
      : status === 'delivered'
        ? 'Your order has been delivered'
        : 'Your order has been cancelled';
  const tracking =
    status === 'shipped' && order.tracking_status
      ? `<p style="margin:8px 0">Tracking reference: <strong>${order.tracking_status}</strong></p>`
      : '';
  const refundNote =
    status === 'cancelled' ? '<p style="margin:8px 0">Any amount paid will be refunded per our policy.</p>' : '';
  const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#2A2A2A;line-height:1.5">
    <h2 style="color:#8B2E2E;margin:0 0 4px">Mithila Enterprises</h2>
    <h3 style="margin:0 0 16px">${heading}</h3>
    <p style="margin:8px 0">Dear ${customerName},</p>
    <p style="margin:8px 0">Your order <strong>#${shortId}</strong> is now <strong>${status}</strong>.</p>
    ${tracking}${refundNote}
    <p style="margin:16px 0 0">Thank you for shopping with us.</p>
  </body></html>`;
  const subject =
    status === 'shipped'
      ? `Your order #${shortId} has shipped`
      : status === 'delivered'
        ? `Your order #${shortId} was delivered`
        : `Your order #${shortId} was cancelled`;
  return { subject, html };
}

function backoffISO(attempts: number): string {
  const minutes = Math.min(Math.pow(2, attempts), 60); // 2, 4, 8, 16, 32, 60...
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

// Atomically claim a job (so inline + cron can't double-send), build, send, and
// either mark sent or schedule a backed-off retry. Returns the outcome.
export async function processEmailRow(
  admin: SupabaseClient,
  row: any
): Promise<'sent' | 'skipped' | 'retry' | 'failed'> {
  const { data: claimed } = await admin
    .from('pending_emails')
    .update({ status: 'sending', attempts: (row.attempts || 0) + 1 })
    .eq('id', row.id)
    .eq('status', 'pending')
    .select('id, attempts, max_attempts')
    .single();
  if (!claimed) return 'skipped'; // another worker already took it

  try {
    if (!row.recipient) throw new Error('NO_RECIPIENT');
    const built = await buildEmail(admin, row);
    if (!built) throw new Error('ORDER_NOT_FOUND');

    const sendRes: any = await resend.emails.send({
      from: FROM,
      to: [row.recipient],
      subject: built.subject,
      html: built.html,
      attachments: built.attachments,
    });
    if (sendRes?.error) throw new Error(sendRes.error?.message || 'RESEND_ERROR');

    await admin
      .from('pending_emails')
      .update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null })
      .eq('id', row.id);
    return 'sent';
  } catch (err: any) {
    const attempts = (claimed as any).attempts as number;
    const max = (claimed as any).max_attempts as number;
    const dead = attempts >= max;
    await admin
      .from('pending_emails')
      .update({
        status: dead ? 'failed' : 'pending',
        last_error: String(err?.message || err).slice(0, 500),
        next_attempt_at: backoffISO(attempts),
      })
      .eq('id', row.id);
    console.error(`processEmailRow ${dead ? 'FAILED' : 'retry'} (${row.kind}):`, err?.message || err);
    return dead ? 'failed' : 'retry';
  }
}

// Drain all due jobs — used by the cron worker.
export async function sendDueEmails(admin: SupabaseClient, limit = MAX_BATCH) {
  const { data: rows, error } = await admin
    .from('pending_emails')
    .select('*')
    .eq('status', 'pending')
    .lte('next_attempt_at', new Date().toISOString())
    .order('next_attempt_at', { ascending: true })
    .limit(limit);
  if (error) {
    console.error('sendDueEmails query failed:', error);
    return { processed: 0, sent: 0 };
  }
  let sent = 0;
  for (const row of rows || []) {
    const r = await processEmailRow(admin, row);
    if (r === 'sent') sent++;
  }
  return { processed: (rows || []).length, sent };
}
