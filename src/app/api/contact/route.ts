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
    const { firstName, lastName, email, location, message } = body;

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Save to Supabase
    const { error: dbError } = await supabase
      .from('contact_inquiries')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        location,
        message
      });

    if (dbError) {
      console.error('Failed to insert contact inquiry:', dbError);
      return NextResponse.json({ error: 'Failed to save inquiry' }, { status: 500 });
    }

    // 2. Send Email via Resend
    try {
      await resend.emails.send({
        from: FROM,
        to: SUPPORT_EMAIL,
        replyTo: email,
        subject: `New Contact Inquiry from ${firstName} ${lastName}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>New Contact Inquiry</h2>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Location:</strong> ${location || 'N/A'}</p>
            <hr />
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send contact email:', emailError);
      // We don't fail the request if email fails, since DB saved successfully
    }

    // 3. Send WhatsApp Notification
    await sendWhatsAppNotification(
      ADMIN_WHATSAPP, 
      `New Contact Inquiry!\n\nName: ${firstName} ${lastName}\nEmail: ${email}\n\nMessage: ${message.substring(0, 100)}...`
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
