import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import StructuredData from "@/components/StructuredData";
import SiteChrome from "@/components/SiteChrome";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { getSiteContentMap } from "@/lib/content";
import AuthCallbackCatcher from "@/components/AuthCallbackCatcher";
import { Suspense } from "react";

const playfair = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mithilaenterprises.co.in'),
  title: "Mithila Enterprises | Premium Cotton & Linen",
  description: "Wholesale B2C Premium Cotton & Linen Fabrics inspired by Madhubani Art.",
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
  openGraph: {
    title: "Mithila Enterprises | Premium Cotton & Linen",
    description: "Wholesale B2C Premium Cotton & Linen Fabrics inspired by Madhubani Art.",
    url: 'https://www.mithilaenterprises.co.in',
    siteName: 'Mithila Enterprises',
    images: [
      {
        url: '/images/logo.png',
        width: 800,
        height: 600,
        alt: 'Mithila Enterprises Logo',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Mithila Enterprises | Premium Cotton & Linen",
    description: "Wholesale B2C Premium Cotton & Linen Fabrics inspired by Madhubani Art.",
    images: ['/images/logo.png'],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = await getSiteContentMap();
  const announcement = content["announcement"]?.body?.trim();
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <head>
        <StructuredData />
      </head>
      <body className="min-h-full flex flex-col font-sans relative overflow-x-hidden w-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <Suspense fallback={null}>
          <AuthCallbackCatcher />
        </Suspense>
        <SiteChrome 
          announcement={announcement}
          header={<Header />}
          footer={<Footer />}
          cartDrawer={<CartDrawer />}
        >
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
