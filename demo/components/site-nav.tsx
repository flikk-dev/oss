"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

const GITHUB = "https://github.com/flikk-dev/json-editor"

export function SiteNav() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <nav className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/80 px-6 py-2.5 text-sm backdrop-blur">
      <Link href="/" className="flex items-baseline gap-1 font-medium">
        flikk <span className="text-muted-foreground">/ ui</span>
      </Link>
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<a href="#demo" />}
          className="font-normal text-muted-foreground"
        >
          Demo
        </Button>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<a href="#usage" />}
          className="font-normal text-muted-foreground"
        >
          Usage
        </Button>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<a href={GITHUB} target="_blank" rel="noreferrer" />}
          className="font-normal text-muted-foreground"
        >
          GitHub
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Toggle theme"
          title="d"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="text-muted-foreground"
        >
          <SunIcon className="dark:hidden" />
          <MoonIcon className="hidden dark:block" />
        </Button>
      </div>
    </nav>
  )
}
