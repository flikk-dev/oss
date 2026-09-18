import { ImageResponse } from "next/og"

export const alt = "flikk UI: a JSON Schema builder for React"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** OG card on the flikk palette; no fonts fetched, system sans */
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#fafafc",
        color: "#26253a",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 28, color: "#6f6e80" }}>
        oss.flikk.dev/ui
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          Use flikk&apos;s components
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: -2,
            color: "#ec4e02",
          }}
        >
          in your own projects.
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 30, color: "#6f6e80" }}>
        A JSON Schema builder, shipped the shadcn way. MIT.
      </div>
    </div>,
    size
  )
}
