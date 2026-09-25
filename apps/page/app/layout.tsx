import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteNav } from "@/components/site-nav";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const SITE = "https://oss.flikk.dev/ui";
const title = "flikk open source";
const description =
  "The parts of flikk that are useful outside it, published under MIT. React components you copy into your app the shadcn way: one command, the source lands, you own it.";

/**
 * resizes-content: without it the on-screen keyboard overlays the layout
 * viewport instead of shrinking it, so a `fixed bottom-0` sheet sits behind
 * the keyboard with nothing to scroll.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: title, template: "%s · flikk open source" },
  description,
  keywords: [
    "json schema",
    "json schema builder",
    "json schema editor",
    "react",
    "shadcn",
    "base ui",
    "tailwind",
    "headless",
    "drag and drop",
    "flikk",
  ],
  authors: [{ name: "flikk", url: "https://flikk.dev" }],
  creator: "flikk",
  publisher: "flikk",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "flikk UI",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans antialiased", geist.variable, fontMono.variable)}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareSourceCode",
              name: "flikk UI: JSON Schema builder",
              description,
              url: SITE,
              codeRepository: "https://github.com/flikk-dev/oss",
              programmingLanguage: "TypeScript",
              runtimePlatform: "React",
              license: "https://opensource.org/licenses/MIT",
              image: `${SITE}/icon.png`,
              author: {
                "@type": "Organization",
                name: "flikk",
                url: "https://flikk.dev",
                logo: `${SITE}/icon.png`,
              },
            }),
          }}
        />
        <ThemeProvider>
          <Suspense>
            <SiteNav />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
