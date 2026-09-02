import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "CricBudz — IPL Fantasy Arena",
  description: "Live IPL Fantasy Cricket",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f46e5" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f19" },
  ],
};

import { AuthProvider } from "@/context/AuthContext";
import { DevProvider } from "@/context/DevContext";
import { ThemeProvider } from "@/context/ThemeContext";
import NavigationWrapper from "@/components/NavigationWrapper";
import { Toaster } from "sonner";

// Prevents a flash of the wrong theme on first paint: this inline script
// runs before hydration and applies the stored/system theme synchronously.
const noFlashThemeScript = `
(function () {
  try {
    var pref = localStorage.getItem('ipl_theme_preference');
    var isDark = pref === 'dark' || (pref !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body className="antialiased selection:bg-primary/30 bg-background text-foreground">
        <ThemeProvider>
          <DevProvider>
            <AuthProvider>
              <NavigationWrapper>{children}</NavigationWrapper>
              <Toaster
                position="top-center"
                richColors
                theme="system"
                toastOptions={{
                  className: 'font-sans',
                }}
              />
            </AuthProvider>
          </DevProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
