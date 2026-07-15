import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { sendWhatsAppNotification } from '@/lib/whatsapp';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build_only');
const FROM = process.env.EMAIL_FROM || 'Mithila Enterprises <onboarding@resend.dev>';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@mithilaenterprises.co.in';
const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP || '+910000000000'; // Replace with real admin number

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessName, taxId, email, requirements } = body;

    if (!businessName || !email || !requirements) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Save to Supabase
    const { error: dbError } = await supabase
      .from('wholesale_applications')
      .insert({
        business_name: businessName,
        tax_id: taxId,
        email,
        requirements
      });

    if (dbError) {
      console.error('Failed to insert wholesale application:', dbError);
      return NextResponse.json({ error: 'Failed to save application' }, { status: 500 });
    }

    // 2. Send Email via Resend
    try {
      await resend.emails.send({
        from: FROM,
        to: SUPPORT_EMAIL,
        replyTo: email,
        subject: `New Wholesale Application: ${businessName}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>New Wholesale B2B Application</h2>
            <p><strong>Business Name:</strong> ${businessName}</p>
            <p><strong>Tax ID / GST:</strong> ${taxId || 'N/A'}</p>
            <p><strong>Email:</strong> ${email}</p>
            <hr />
            <p><strong>Requirements & Volume:</strong></p>
            <p style="white-space: pre-wrap;">${requirements}</p>
            <hr />
            <p>Log in to the Admin Dashboard to review.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send wholesale email:', emailError);
    }

    // 3. Send WhatsApp Notification
    await sendWhatsAppNotification(
      ADMIN_WHATSAPP, 
      `Wholesale App Alert!\n\nBusiness: ${businessName}\nEmail: ${email}\n\nLogin to dashboard to review.`
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Wholesale API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
