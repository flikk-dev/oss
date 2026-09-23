import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteNav } from "@/components/site-nav";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const SITE = "https://oss.flikk.dev/ui";
const title = "flikk UI: a JSON Schema builder for React";
const description =
  "Open-source React components from flikk, shipped the shadcn way. A JSON Schema builder you edit as a tree: presets, compound parts, two hooks, drag and drop across the tree, bulk actions. One command copies the source into your app.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: title, template: "%s · flikk UI" },
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
