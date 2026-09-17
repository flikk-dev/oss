import { afterEach, describe, expect, test } from "bun:test"
import * as React from "react"
import { cleanup, render, screen, within } from "@testing-library/react"

afterEach(cleanup)
import userEvent from "@testing-library/user-event"
import { createJsonSchema, defineType, types, type SchemaNode } from "@/store"
import {
  JsonSchemaEditor,
  Schema,
  SchemaAction,
  SchemaField,
  useJsonSchema,
} from "@/components/ui/json/editor"

/**
 * The DX contract. Each test is a composition a consumer would actually write,
 * asserted through the DOM and the handle — never through internals.
 */

const user = {
  type: "object",
  properties: {
    id: { type: "integer", title: "ID" },
    name: { type: "string", title: "Name", description: "Display name" },
    address: {
      type: "object",
      title: "Address",
      properties: {
        street: { type: "string", title: "Street" },
        zip: { type: "string", title: "ZIP" },
      },
      required: ["street", "zip"],
      additionalProperties: false,
    },
  },
  required: ["id", "address"],
  additionalProperties: false,
}

const row = (r: HTMLElement) => r.closest<HTMLElement>("[data-slot=row]")!
const titleOf = (t: string) => screen.getByDisplayValue(t)

/* -------------------------------- presets -------------------------------- */

describe("preset", () => {
  test("one line: handle in, rows out, JSON back", async () => {
    let renders = 0
    function Owner() {
      renders++
      const schema = useJsonSchema(user)
      return <JsonSchemaEditor schema={schema} variant="default" />
    }
    render(<Owner />)
    expect(
      screen
        .getAllByRole("textbox", { name: "Title" })
        .map((e) => (e as HTMLInputElement).value)
    ).toEqual(["ID", "Name", "Address", "Street", "ZIP"])
    await userEvent.type(titleOf("Name"), " 2")
    // the owner never re-rendered: the handle is a ref, not state
    expect(renders).toBe(1)
  })

  test("the handle sees every edit", async () => {
    const schema = createJsonSchema(user)
    render(<JsonSchemaEditor schema={schema} />)
    const name = titleOf("Name")
    await userEvent.clear(name)
    await userEvent.type(name, "Full name")
    const json = schema.toJSON() as any
    expect(json.properties.name.title).toBe("Full name") // keys parsed from JSON stay put; only new fields follow the title
  })

  test("variant goes on the list; rows carry it; nested inherit", () => {
    render(
      <JsonSchemaEditor schema={createJsonSchema(user)} variant="compact" />
    )
    expect(row(titleOf("ID")).dataset.variant).toBe("compact")
    expect(row(titleOf("Street")).dataset.variant).toBe("compact")
  })

  test("mobile is automatic on a coarse pointer, overridable", () => {
    const real = window.matchMedia
    window.matchMedia = ((q: string) => ({
      matches: q.includes("coarse"),
      addEventListener() {},
      removeEventListener() {},
    })) as any
    try {
      const { unmount } = render(
        <JsonSchemaEditor schema={createJsonSchema(user)} />
      )
      expect(
        screen
          .getAllByText("ID")[0]
          .closest("[data-slot=row]")!
          .getAttribute("data-variant")
      ).toBe("mobile")
      unmount()
      render(
        <JsonSchemaEditor schema={createJsonSchema(user)} variant="wide" />
      )
      expect(row(titleOf("ID")).dataset.variant).toBe("wide")
    } finally {
      window.matchMedia = real
    }
  })
})

/* ------------------------------ composition ------------------------------ */

describe("composing parts", () => {
  const template = (node: SchemaNode) => (
    <SchemaField.Row className="my-row">
      <div className="head">
        <SchemaField.Handle />
        <SchemaField.Type />
        <SchemaField.Title />
        <SchemaField.Key />
        <SchemaField.Optional />
        {node.isGroup && <SchemaField.ChildrenCount />}
        {node.isGroup && <SchemaField.NestedToggle />}
        <SchemaAction.Remove />
        <SchemaField.Menu>
          <SchemaAction.Optional />
          <SchemaAction.Duplicate />
        </SchemaField.Menu>
      </div>
      <SchemaField.Description />
      {node.isGroup && <SchemaField.Nested />}
    </SchemaField.Row>
  )

  test("one template draws every level through Nested", () => {
    render(
      <Schema.Root store={createJsonSchema(user)}>
        <Schema.List variant="default" render={template} />
      </Schema.Root>
    )
    expect(row(titleOf("Street")).className).toContain("my-row")
    expect(row(titleOf("Street")).dataset.depth).toBe("1")
    expect(within(row(titleOf("Address"))).getByText("2 fields")).toBeTruthy()
  })

  test("Nested can switch template and variant from that level down", () => {
    const leaf = () => (
      <SchemaField.Row className="leaf">
        <SchemaField.Title />
      </SchemaField.Row>
    )
    const outer = (node: SchemaNode) => (
      <SchemaField.Row className="outer">
        <SchemaField.Title />
        {node.isGroup && (
          <SchemaField.Nested>
            <Schema.List variant="compact" render={leaf} />
          </SchemaField.Nested>
        )}
      </SchemaField.Row>
    )
    render(
      <Schema.Root store={createJsonSchema(user)}>
        <Schema.List variant="default" render={outer} />
      </Schema.Root>
    )
    expect(row(titleOf("Address")).className).toContain("outer")
    expect(row(titleOf("Street")).className).toContain("leaf")
    expect(row(titleOf("Street")).dataset.variant).toBe("compact")
  })

  test("display vs mutation: SchemaField.Optional shows, SchemaAction.Optional changes", async () => {
    const schema = createJsonSchema(user)
    render(
      <Schema.Root store={schema}>
        <Schema.List
          render={() => (
            <SchemaField.Row>
              <SchemaField.Title />
              <SchemaField.Optional />
              <SchemaAction.Optional />
            </SchemaField.Row>
          )}
        />
      </Schema.Root>
    )
    const name = row(titleOf("Name"))
    expect(within(name).getByText("optional")).toBeTruthy()
    await userEvent.click(
      within(name).getByRole("button", { name: /optional/i })
    )
    expect(within(name).queryByText("optional")).toBeNull()
    expect((schema.toJSON() as any).required).toContain("name")
  })

  test("NestedToggle collapses Nested; state on data-state", async () => {
    render(<JsonSchemaEditor schema={createJsonSchema(user)} />)
    const address = row(titleOf("Address"))
    expect(within(address).getByDisplayValue("Street")).toBeTruthy()
    await userEvent.click(
      within(address).getByRole("button", { name: /collapse/i })
    )
    expect(within(address).queryByDisplayValue("Street")).toBeNull()
    expect(
      address.querySelector("[data-slot=nested]")!.getAttribute("data-state")
    ).toBe("closed")
  })

  test("Handle is the only drag start when present", () => {
    render(
      <Schema.Root store={createJsonSchema(user)}>
        <Schema.List
          render={() => (
            <SchemaField.Row>
              <SchemaField.Handle />
              <SchemaField.Title />
            </SchemaField.Row>
          )}
        />
      </Schema.Root>
    )
    const r = row(titleOf("ID"))
    expect(within(r).getByRole("button", { name: /drag/i })).toBeTruthy()
    expect(r.dataset.dragFrom).toBe("handle")
  })
})

/* -------------------------------- overrides ------------------------------ */

describe("overrides", () => {
  const withAction = (action: React.ReactNode) => (
    <Schema.Root store={createJsonSchema(user)}>
      <Schema.List
        render={() => (
          <SchemaField.Row>
            <SchemaField.Title />
            {action}
          </SchemaField.Row>
        )}
      />
    </Schema.Root>
  )

  test("children replace the label", () => {
    render(
      withAction(<SchemaAction.Optional>Facultatif</SchemaAction.Optional>)
    )
    expect(
      within(row(titleOf("ID"))).getByRole("button", { name: "Facultatif" })
    ).toBeTruthy()
  })

  test("render swaps the element and merges behaviour + state onto it", async () => {
    render(
      withAction(<SchemaAction.Optional render={<button data-mine="" />} />)
    )
    const btn = within(row(titleOf("ID"))).getByRole("button")
    expect(btn.hasAttribute("data-mine")).toBe(true)
    expect(btn.getAttribute("data-state")).toBe("off")
    await userEvent.click(btn)
    expect(btn.getAttribute("data-state")).toBe("on")
  })

  test("onClick composes; preventDefault replaces the built-in", async () => {
    const schema = createJsonSchema(user)
    let seen = 0
    render(
      <Schema.Root store={schema}>
        <Schema.List
          render={() => (
            <SchemaField.Row>
              <SchemaField.Title />
              <SchemaAction.Remove onClick={() => seen++} />
              <SchemaAction.Duplicate
                onClick={(e) => {
                  e.preventDefault()
                  seen += 10
                }}
              />
            </SchemaField.Row>
          )}
        />
      </Schema.Root>
    )
    await userEvent.click(
      within(row(titleOf("Name"))).getByRole("button", { name: /remove/i })
    )
    expect(seen).toBe(1)
    expect(Object.keys((schema.toJSON() as any).properties)).not.toContain(
      "name"
    )
    await userEvent.click(
      within(row(titleOf("ID"))).getByRole("button", { name: /duplicate/i })
    )
    expect(seen).toBe(11)
    expect(Object.keys((schema.toJSON() as any).properties)).toEqual([
      "id",
      "address",
    ]) // not duplicated
  })

  test("render function gets state: ChildrenCount", () => {
    render(
      <Schema.Root store={createJsonSchema(user)}>
        <Schema.List
          render={(node) => (
            <SchemaField.Row>
              <SchemaField.Title />
              {node.isGroup && (
                <SchemaField.ChildrenCount
                  render={(props, { count }) => (
                    <b {...props}>{String(count)} champs</b>
                  )}
                />
              )}
            </SchemaField.Row>
          )}
        />
      </Schema.Root>
    )
    expect(within(row(titleOf("Address"))).getByText("2 champs").tagName).toBe(
      "B"
    )
  })

  test("localisation is per part, at the use site", () => {
    render(
      <Schema.Root
        store={createJsonSchema({
          type: "object",
          properties: { a: { type: "string" } },
        })}
      >
        <Schema.List
          render={() => (
            <SchemaField.Row>
              <SchemaField.Title placeholder="Sans titre" />
              <SchemaField.Description placeholder="Ajouter une description" />
            </SchemaField.Row>
          )}
        />
        <Schema.AddField>Ajouter un champ</Schema.AddField>
      </Schema.Root>
    )
    expect(screen.getByPlaceholderText("Sans titre")).toBeTruthy()
    expect(screen.getByPlaceholderText("Ajouter une description")).toBeTruthy()
    expect(
      screen.getByRole("button", { name: "Ajouter un champ" })
    ).toBeTruthy()
  })
})

/* -------------------------------- selection ------------------------------ */

describe("selection + toolbar", () => {
  test("Select in rows, bulk actions in Toolbar", async () => {
    const schema = createJsonSchema(user)
    render(
      <Schema.Root store={schema}>
        <Schema.Toolbar>
          <Schema.SelectAll />
          <Schema.SelectionCount />
          <SchemaAction.Optional />
          <SchemaAction.Remove />
        </Schema.Toolbar>
        <Schema.List
          render={() => (
            <SchemaField.Row>
              <SchemaField.Select />
              <SchemaField.Title />
            </SchemaField.Row>
          )}
        />
      </Schema.Root>
    )
    const toolbar = screen.getByRole("toolbar")
    expect(toolbar.dataset.state).toBe("empty")
    await userEvent.click(within(row(titleOf("ID"))).getByRole("checkbox"))
    await userEvent.click(within(row(titleOf("Name"))).getByRole("checkbox"))
    expect(toolbar.dataset.state).toBe("active")
    expect(within(toolbar).getByText("2 selected")).toBeTruthy()
    expect(row(titleOf("ID")).dataset.selected).toBe("")
    await userEvent.click(
      within(toolbar).getByRole("button", { name: /optional/i })
    )
    expect((schema.toJSON() as any).required).toEqual(["address"])
    await userEvent.click(
      within(toolbar).getByRole("button", { name: /remove/i })
    )
    expect(Object.keys((schema.toJSON() as any).properties)).toEqual([
      "address",
    ])
    expect(toolbar.dataset.state).toBe("empty")
  })
})

/* ------------------------------ type modules ----------------------------- */

describe("type modules in the UI", () => {
  test("a custom type shows up in the type menu and renders its Extra", async () => {
    const regex = defineType({
      key: "regex",
      label: "Pattern",
      description: "Text matching a regular expression",
      icon: types.string.icon,
      color: types.string.color,
      schema: (n) => ({ type: "string", pattern: n.extra?.pattern ?? ".*" }),
      example: () => "abc",
      matches: (s) => s.type === "string" && typeof s.pattern === "string",
      Extra: ({ node, set }) => (
        <input
          aria-label="Pattern"
          value={(node.extra?.pattern as string) ?? ""}
          onChange={(e) =>
            set({ extra: { ...node.extra, pattern: e.target.value } })
          }
        />
      ),
    })
    const schema = createJsonSchema(
      {
        type: "object",
        properties: { code: { type: "string", pattern: "^[A-Z]+$" } },
      },
      { types: [...Object.values(types), regex] }
    )
    render(<JsonSchemaEditor schema={schema} />)
    const code = row(screen.getByDisplayValue("^[A-Z]+$"))
    expect(
      within(code).getByRole("button", { name: /type: pattern/i })
    ).toBeTruthy()
    await userEvent.clear(within(code).getByLabelText("Pattern"))
    await userEvent.type(within(code).getByLabelText("Pattern"), "^[[a-z]+$") // `[[` = literal `[` for user-event
    expect((schema.toJSON() as any).properties.code.pattern).toBe("^[a-z]+$")
  })
})
