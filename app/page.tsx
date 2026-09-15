import { EditorPreview } from "@/components/json/editor-preview"

export default function Page() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 p-6">
      <div>
        <h1 className="text-sm font-medium">Editor preview</h1>
        <p className="text-xs text-muted-foreground">
          Live. Variants from top-right dialog. Saved in localStorage.
        </p>
      </div>
      <EditorPreview />
    </div>
  )
}
