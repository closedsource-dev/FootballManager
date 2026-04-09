import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import { CurrencyProvider } from "@/lib/currencyContext";
import { ThemeProvider } from "@/lib/themeContext";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Football Manager",
  description: "High school football team management app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors`}>
        <ThemeProvider>
          <CurrencyProvider>
            <Navbar />
            <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
