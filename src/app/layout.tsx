import type { Metadata } from "next";
import { PT_Sans } from "next/font/google";
import "./globals.css";
import { FirebaseClientProvider } from "@/firebase";
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from "@/i18n";
import { ThemeProvider } from "@/components/providers/theme-provider";
import ConditionalBackground from "@/components/ConditionalBackground";

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export const metadata: Metadata = {
  title: "Salamkar School Management",
  description: "A comprehensive school management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${ptSans.variable}`} suppressHydrationWarning>
      <body className={`font-sans`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ConditionalBackground />
          <div className="relative z-10">
            <LanguageProvider>
              <FirebaseClientProvider>
                {children}
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    style: {
                      background: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))',
                      border: '1px solid hsl(var(--border))',
                    },
                    success: {
                      iconTheme: {
                        primary: 'hsl(var(--primary))',
                        secondary: 'hsl(var(--background))',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: 'hsl(var(--destructive))',
                        secondary: 'hsl(var(--foreground))',
                      },
                    },
                  }}
                />
                </FirebaseClientProvider>
            </LanguageProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
