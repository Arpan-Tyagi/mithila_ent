import type { Metadata } from "next";
import { Yatra_One, Lora } from "next/font/google";
import "./globals.css";
import CustomCursor from "@/components/CustomCursor";
import Header from "@/components/Header";

const yatra = Yatra_One({
  weight: '400',
  variable: "--font-yatra",
  subsets: ["latin", "devanagari"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mithila Enterprises",
  description: "Loomed by Hand, Loved by Heart",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${yatra.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full font-lora">
        <CustomCursor />
        {/* Master Frame */}
        <div className="border-ink-double min-h-screen p-6 m-4 relative flex flex-col">
          <Header />
          <main className="flex-grow">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
