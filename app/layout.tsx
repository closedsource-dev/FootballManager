import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/ui/NavbarWrapper";
import AuthGuard from "@/components/AuthGuard";
import { CurrencyProvider } from "@/lib/currencyContext";
import { ThemeProvider } from "@/lib/themeContext";
import { AuthProvider } from "@/lib/authContext";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Football Manager",
  description: "High school football team management app",
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚽</text></svg>" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors`}>
        <ThemeProvider>
          <AuthProvider>
            <CurrencyProvider>
              <AuthGuard>
                <NavbarWrapper />
                <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
              </AuthGuard>
            </CurrencyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
