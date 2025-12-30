import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LeakStopper | Customer Reclamation Engine",
  description: "Kaybolan müşterilerinizi tespit edin, kişiselleştirilmiş geri kazanım mesajları oluşturun ve gelirinizi koruyun.",
  keywords: ["customer reclamation", "müşteri geri kazanım", "CRM", "churn prevention"],
  authors: [{ name: "LeakStopper" }],
  openGraph: {
    title: "LeakStopper | Customer Reclamation Engine",
    description: "Müşteri kaybı analizi ve geri kazanım platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              const originalError = console.error;
              console.error = (...args) => {
                if (/Hydration failed|content does not match/i.test(args[0])) {
                  return;
                }
                originalError.apply(console, args);
              };
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
