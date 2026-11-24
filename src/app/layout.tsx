import type { Metadata } from "next";
import Script from "next/script";
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

import { getSiteUrl } from "@/lib/site-url";

const playfair = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Mithila Enterprises | Premium Handloom Cotton, Linen & Luxury Textiles",
    template: "%s | Mithila Enterprises",
  },
  description:
    "India's premier artisan fabric wholesaler and D2C textile destination. Certified pure linen, organic cotton, viscose, velvet, wool, and handwoven fabrics inspired by Madhubani heritage. Custom fractional meterage cuts and tiered wholesale supply.",
  keywords: [
    "pure linen fabric India",
    "wholesale cotton fabric Delhi",
    "handloom textiles India",
    "Madhubani art fabric",
    "organic cotton meterage",
    "luxury fabrics online",
    "velvet fabric supplier",
    "tweed and wool fabrics India",
    "textile wholesaler Okhla Gandhi Nagar",
    "sustainable fabric manufacturer"
  ],
  authors: [{ name: "Mithila Enterprises" }],
  creator: "Mithila Enterprises",
  publisher: "Mithila Enterprises",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
  openGraph: {
    title: "Mithila Enterprises | Premium Handloom Cotton, Linen & Luxury Textiles",
    description:
      "India's premier artisan fabric wholesaler and D2C textile destination. Certified pure linen, organic cotton, viscose, velvet, wool, and handwoven fabrics inspired by Madhubani heritage.",
    url: siteUrl,
    siteName: "Mithila Enterprises",
    images: [
      {
        url: "/images/logo.png",
        width: 800,
        height: 600,
        alt: "Mithila Enterprises Premium Textiles",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mithila Enterprises | Premium Handloom Cotton, Linen & Luxury Textiles",
    description:
      "India's premier artisan fabric wholesaler and D2C textile destination. Certified pure linen, organic cotton, viscose, velvet, and handwoven fabrics.",
    images: ["/images/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TDLCQ9XB"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* Google Tag Manager & dataLayer Initialization */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-TDLCQ9XB');
            `,
          }}
        />

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
