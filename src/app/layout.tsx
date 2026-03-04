import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "animate.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import PWAInstallPrompt from "@/components/pwa-install-prompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CampusIQ - Institution Management",
  description: "Institution Management System",
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f97316" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        {/* Inline theme script — runs BEFORE paint to prevent FOUC (flash of wrong theme) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('campusiq-theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.add('light')}}catch(e){document.documentElement.classList.add('light')}})();`,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster />
          <PWAInstallPrompt />
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(
                    (reg) => console.log('[SW] Registered:', reg.scope),
                    (err) => console.log('[SW] Registration failed:', err)
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
