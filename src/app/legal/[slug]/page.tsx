import { notFound } from 'next/navigation';

const legalContent: Record<string, { title: string; content: string[] }> = {
  'terms': {
    title: 'Terms & Conditions',
    content: [
      'Welcome to Mithila Enterprises. By accessing and using our website, you agree to be bound by these Terms and Conditions.',
      'All products listed on this website are subject to availability. Prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise.',
      'Orders once placed are confirmed via email and WhatsApp. We reserve the right to cancel orders if payment verification fails or if the product is unavailable.',
      'Product images on our website are representative. Due to the handmade nature of our products, slight variations in color, pattern, and texture are natural and should be expected. These variations are a hallmark of authentic handcrafted goods.',
      'Intellectual property rights for all content on this website — including text, images, logos, and product designs — belong to Mithila Enterprises. Unauthorized reproduction is prohibited.',
      'We reserve the right to update these terms at any time. Continued use of the website after changes constitutes acceptance of the revised terms.',
      'For any disputes, the jurisdiction shall be the courts of Bihar, India.',
    ]
  },
  'privacy': {
    title: 'Privacy Policy',
    content: [
      'Mithila Enterprises is committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your personal information.',
      'We collect personal information such as your name, email address, phone number, and shipping address when you create an account, place an order, or contact us. Payment information is processed securely through our third-party payment providers (Stripe/Razorpay) and is never stored on our servers.',
      'Your personal information is used to process orders, provide customer support, send order updates via email and WhatsApp, and improve our products and services. We do not sell or share your personal data with third parties for marketing purposes.',
      'We use industry-standard encryption (SSL/TLS) to protect data transmitted between your browser and our servers. Access to personal data is restricted to authorized personnel only.',
      'Our website uses essential cookies for authentication and cart functionality. We may use analytics cookies to understand how visitors interact with our site. You can disable cookies in your browser settings.',
      'You have the right to access, update, or delete your personal information at any time by contacting us at support@mithilaenterprises.com or through your account settings.',
      'We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date.',
    ]
  },
  'returns': {
    title: 'Return & Refund Policy',
    content: [
      'At Mithila Enterprises, we want you to be completely satisfied with your purchase. If you are not happy with your order, we offer a hassle-free return and refund process.',
      'Returns are accepted within 7 days of delivery. To be eligible for a return, the product must be unused, unwashed, uncut, and in its original packaging with all tags intact.',
      'To initiate a return, contact us at support@mithilaenterprises.com with your order number and reason for return. We will provide you with a return shipping label.',
      'Once we receive the returned item and verify its condition, we will process your refund within 5-7 business days. The refund will be credited to your original payment method.',
      'Shipping charges are non-refundable unless the return is due to a defect or error on our part. In case of defective or damaged products, we will cover the return shipping costs.',
      'Custom-made or personalized products cannot be returned unless they arrive damaged or defective.',
      'For exchanges, please return the original item and place a new order. We currently do not offer direct exchanges.',
      'If you have any questions about our return policy, please don\'t hesitate to reach out to our customer support team.',
    ]
  },
};

export function generateStaticParams() {
  return [{ slug: 'terms' }, { slug: 'privacy' }, { slug: 'returns' }];
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = legalContent[slug];
  if (!data) return notFound();

  return (
    <main className="flex-grow max-w-3xl mx-auto px-4 py-16 w-full">
      <h1 className="font-serif text-3xl font-bold text-[var(--charcoal-ink)] mb-8">{data.title}</h1>
      <article className="prose prose-lg font-sans text-[var(--charcoal-ink)] opacity-80 space-y-4">
        {data.content.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>
      <div className="mt-12 pt-8 border-t-2 border-[var(--charcoal-ink)]/20 font-sans text-sm opacity-60">
        <p>Last updated: May 2026</p>
        <p>For questions, contact: support@mithilaenterprises.com</p>
      </div>
    </main>
  );
}
