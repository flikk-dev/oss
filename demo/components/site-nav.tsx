"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

const GITHUB = "https://github.com/flikk-dev/json-editor"
const FLIKK = "https://flikk.dev"

export function SiteNav() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <nav className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/80 px-6 py-2.5 text-sm backdrop-blur supports-backdrop-filter:bg-background/60">
      {/* as flikk forms: the mark leads, the wordmark names it */}
      <a href={FLIKK} aria-label="Flikk" className="flex items-center gap-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.png" alt="" className="size-8 shrink-0" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/flikk.png" alt="Flikk" className="h-5 w-auto shrink-0" />
      </a>
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
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<a href={FLIKK} />}
          className="ml-1 font-normal"
        >
          flikk.dev
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
