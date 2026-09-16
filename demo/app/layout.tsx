import { Suspense } from "react"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@demo/components/theme-provider"
import { SiteNav } from "@demo/components/site-nav"
import { cn } from "cn"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans antialiased", geist.variable, fontMono.variable)}
    >
      <body>
        <ThemeProvider>
          <Suspense>
            <SiteNav />
          </Suspense>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
