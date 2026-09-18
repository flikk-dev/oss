import { afterEach, describe, expect, test } from "bun:test"
import * as React from "react"
import { act, cleanup, render, screen, within } from "@testing-library/react"

afterEach(cleanup)
import userEvent from "@testing-library/user-event"
import { createJsonSchema, defineType, types, type SchemaNode } from "@/store"
import {
  JsonSchemaEditor,
  Schema,
  SchemaAction,
  SchemaField,
  useField,
  useJsonSchema,
  useSchema,
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
  const Head = () => (
    <div className="head">
      <SchemaAction.Drag />
      <SchemaAction.ChangeType />
      <SchemaField.Title />
      <SchemaField.Key />
      <SchemaField.Optional />
      <SchemaField.ChildrenCount />
      <SchemaAction.Remove />
      <SchemaField.Menu>
        <SchemaAction.Optional />
        <SchemaAction.Duplicate />
      </SchemaField.Menu>
      <SchemaField.Description />
    </div>
  )
  const template = (node: SchemaNode) => (
    <SchemaField.Row className="my-row">
      {node.isGroup ? (
        <SchemaField.Nested>
          <Head />
          <SchemaField.NestedToggle />
          <SchemaField.NestedList />
        </SchemaField.Nested>
      ) : (
        <Head />
      )}
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
        <SchemaField.Nested>
          <SchemaField.NestedList>
            <Schema.List variant="compact" render={leaf} />
          </SchemaField.NestedList>
        </SchemaField.Nested>
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

  test("parts take a look variant: Type badge, input fields, badge looks", () => {
    render(
      <Schema.Root store={createJsonSchema(user)}>
        <Schema.List
          render={() => (
            <SchemaField.Row>
              <SchemaField.Type variant="badge" />
              <SchemaField.Title variant="input" />
              <SchemaField.Key variant="input" />
              <SchemaField.Optional variant="outline" />
              <SchemaField.ChildrenCount variant="secondary" />
            </SchemaField.Row>
          )}
        />
      </Schema.Root>
    )
    const name = row(titleOf("Name"))
    expect(within(name).getByText("Text")).toBeTruthy()
    expect(within(name).getByDisplayValue("Name").dataset.variant).toBe("input")
    // input variant: key stands alone, no "@" prefix
    expect(within(name).queryByText("@")).toBeNull()
    expect(within(name).getByDisplayValue("name").dataset.slot).toBe("key")
    expect(within(name).getByText("optional").dataset.variant).toBe("outline")
    expect(
      within(row(titleOf("Address"))).getByText("2 fields").dataset.variant
    ).toBe("secondary")
  })

  test("EditDetails from a closing menu still opens the dialog", async () => {
    render(
      <JsonSchemaEditor schema={createJsonSchema(user)} variant="compact" />
    )
    const name = row(titleOf("Name"))
    await userEvent.click(
      within(name).getByRole("button", { name: /field settings/i })
    )
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /edit details/i })
    )
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByDisplayValue("Display name")).toBeTruthy()
  })

  test("SchemaAction.Command: your own action, targets from scope", async () => {
    const schema = createJsonSchema(user)
    const seen: string[][] = []
    render(
      <Schema.Root store={schema}>
        <Schema.Toolbar>
          <SchemaAction.Command
            onClick={({ nodes }) => seen.push(nodes.map((n) => n.key))}
          >
            Export
          </SchemaAction.Command>
        </Schema.Toolbar>
        <Schema.List
          render={() => (
            <SchemaField.Row>
              <SchemaAction.Select />
              <SchemaField.Title />
              <SchemaAction.Command
                onClick={({ ids, schema }) =>
                  schema.update(ids[0], { title: "Zapped" })
                }
              >
                Zap
              </SchemaAction.Command>
            </SchemaField.Row>
          )}
        />
      </Schema.Root>
    )
    const name = row(titleOf("Name"))
    await userEvent.click(within(name).getByRole("button", { name: "Zap" }))
    expect(screen.getByDisplayValue("Zapped")).toBeTruthy()
    await userEvent.click(within(name).getByRole("checkbox"))
    await userEvent.click(
      within(screen.getByRole("toolbar")).getByRole("button", {
        name: "Export",
      })
    )
    expect(seen).toEqual([["name"]])
  })

  test("hooks: useSchema() is the tree + ops by slug; useField() is the row", async () => {
    let api: ReturnType<typeof useSchema> | null = null
    function MyRow() {
      const f = useField()
      return (
        <>
          <input
            aria-label="my title"
            value={f.field.title}
            onChange={(e) => f.update({ title: e.target.value })}
          />
          <span>{f.type.label}</span>
          <button onClick={() => f.update({ optional: !f.field.optional })}>
            opt
          </button>
          <button onClick={() => f.select()}>pick</button>
          {f.issue && <mark>{f.issue.code}</mark>}
          {f.field.isGroup && <em>{f.childrenCount} kids</em>}
          <button onClick={f.drop}>x</button>
          {f.field.isGroup && <Schema.List parentId={f.field.id} depth={1} />}
        </>
      )
    }
    function Probe() {
      api = useSchema()
      return <output>{api.schema.fields!.map((f) => f.key).join(",")}</output>
    }
    const handle = createJsonSchema(user)
    render(
      <Schema.Root store={handle}>
        <Probe />
        <Schema.List
          render={() => (
            <SchemaField.Row>
              <MyRow />
            </SchemaField.Row>
          )}
        />
      </Schema.Root>
    )
    const out = () => screen.getByRole("status").textContent
    expect(out()).toBe("id,name,address")

    // row hook
    const name = row(titleOf("Name"))
    expect(within(name).getByText("Text")).toBeTruthy()
    await userEvent.type(within(name).getByLabelText("my title"), "!")
    expect(api!.schema.fields![1].title).toBe("Name!")
    await userEvent.click(within(name).getByRole("button", { name: "opt" }))
    expect((handle.toJSON() as any).required).toContain("name")
    expect(within(row(titleOf("Address"))).getByText("2 kids")).toBeTruthy()
    expect(row(titleOf("Street")).dataset.depth).toBe("1")
    await userEvent.click(within(name).getByRole("button", { name: "pick" }))
    expect(api!.selectedFields.map((f) => f.key)).toEqual(["name"])

    // schema hook: ops by slug
    act(() => {
      api!.fields.add({ type: "boolean", title: "Active" }, "address")
      api!.fields.update("address.zip", { title: "Postcode", optional: true })
      api!.fields.drop(["id", "address.street"])
      api!.fields.move("address.active", "", 0)
      api!.setSelectedFields(["address", "name"])
    })
    expect(out()).toBe("active,name,address")
    expect(api!.fields.get("address")!.fields!.map((f) => f.key)).toEqual([
      "zip",
    ])
    expect(api!.fields.get("address.zip")!.title).toBe("Postcode")
    expect(api!.selectedFields.map((f) => f.key)).toEqual(["address", "name"])
    act(() =>
      api!.setSchema({ type: "object", properties: { a: { type: "string" } } })
    )
    expect(out()).toBe("a")
  })

  test("Schema.Column: per-row cells beside the template, inherited by nested lists", async () => {
    const schema = createJsonSchema(user)
    render(
      <Schema.Root store={schema}>
        <Schema.List
          render={() => (
            <SchemaField.Row>
              <div data-slot="card">
                <SchemaField.Title />
                <SchemaField.Nested>
                  <SchemaField.NestedList />
                </SchemaField.Nested>
              </div>
            </SchemaField.Row>
          )}
        >
          <Schema.Column side="left">
            <SchemaAction.Select />
          </Schema.Column>
          <Schema.Column side="right">
            <SchemaAction.Remove />
          </Schema.Column>
        </Schema.List>
      </Schema.Root>
    )
    const street = row(titleOf("Street"))
    // cells are the row's own children, around the template, not inside the card
    const kids = Array.from(street.children).map(
      (c) => (c as HTMLElement).dataset.slot
    )
    expect(kids).toEqual(["columns", "row-content", "columns"])
    expect(
      street.querySelector("[data-slot=card] [data-slot=select]")
    ).toBeNull()
    await userEvent.click(within(street).getByRole("checkbox"))
    expect(schema.selected()).toEqual([schema.find("address.street")!])
    await userEvent.click(
      within(street).getByRole("button", { name: /remove/i })
    )
    expect(schema.find("address.street")).toBeUndefined()
  })

  test("NestedToggle / NestedList refuse to render outside Nested", () => {
    const err = console.error
    console.error = () => {}
    try {
      expect(() =>
        render(
          <Schema.Root store={createJsonSchema(user)}>
            <Schema.List
              render={() => (
                <SchemaField.Row>
                  <SchemaField.NestedList />
                </SchemaField.Row>
              )}
            />
          </Schema.Root>
        )
      ).toThrow(/inside <SchemaField.Nested>/)
    } finally {
      console.error = err
    }
  })

  test("Drag is the only drag start when present", () => {
    render(
      <Schema.Root store={createJsonSchema(user)}>
        <Schema.List
          render={() => (
            <SchemaField.Row>
              <SchemaAction.Drag />
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
  test("shift-click on Select extends the selection in document order", async () => {
    const schema = createJsonSchema(user)
    render(
      <Schema.Root store={schema}>
        <Schema.List
          render={(n) => (
            <SchemaField.Row>
              <SchemaAction.Select />
              <SchemaField.Title />
              <SchemaField.Nested>
                <SchemaField.NestedList />
              </SchemaField.Nested>
            </SchemaField.Row>
          )}
        />
      </Schema.Root>
    )
    const ue = userEvent.setup()
    const box = (t: string) => within(row(titleOf(t))).getByRole("checkbox")
    await ue.click(box("Name"))
    await ue.keyboard("{Shift>}")
    await ue.click(box("ZIP"))
    await ue.keyboard("{/Shift}")
    expect(schema.selected()).toEqual(
      ["name", "address", "address.street", "address.zip"].map((p) =>
        schema.find(p)!
      )
    )
    // range from the anchor backwards, on top of what is selected
    await ue.keyboard("{Shift>}")
    await ue.click(box("ID"))
    await ue.keyboard("{/Shift}")
    expect(schema.selected()).toContain(schema.find("id")!)
    expect(schema.selected()).toHaveLength(5)
    // plain click still toggles one
    await ue.click(box("Street"))
    expect(schema.selected()).not.toContain(schema.find("address.street")!)
  })

  test("MoveInto lists groups, moves the selection into the pick", async () => {
    const schema = createJsonSchema(user)
    render(
      <Schema.Root store={schema}>
        <Schema.Toolbar>
          <SchemaAction.MoveInto />
        </Schema.Toolbar>
        <Schema.List
          render={(n) => (
            <SchemaField.Row>
              <SchemaAction.Select />
              <SchemaField.Title />
              <SchemaField.Nested>
                <SchemaField.NestedList />
              </SchemaField.Nested>
            </SchemaField.Row>
          )}
        />
      </Schema.Root>
    )
    await userEvent.click(within(row(titleOf("ID"))).getByRole("checkbox"))
    await userEvent.click(within(row(titleOf("Name"))).getByRole("checkbox"))
    await userEvent.click(screen.getByRole("button", { name: /move into/i }))
    const menu = await screen.findByRole("menu")
    // top level + the one other group; selected rows and leaves are not targets
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((i) => i.textContent)
    ).toEqual(["Top level", "Address"])
    await userEvent.click(
      within(menu).getByRole("menuitem", { name: "Address" })
    )
    const json = schema.toJSON() as any
    expect(Object.keys(json.properties)).toEqual(["address"])
    expect(Object.keys(json.properties.address.properties)).toEqual([
      "street",
      "zip",
      "id",
      "name",
    ])
    expect(schema.selected()).toEqual([
      schema.find("address.id")!,
      schema.find("address.name")!,
    ])
  })

  test("Select in rows, bulk actions in Toolbar", async () => {
    const schema = createJsonSchema(user)
    render(
      <Schema.Root store={schema}>
        <Schema.Toolbar>
          <Schema.SelectAll />
          <Schema.SelectionCount />
          <SchemaAction.Optional />
          <SchemaAction.Remove />
          <SchemaAction.ClearSelection />
        </Schema.Toolbar>
        <Schema.List
          render={() => (
            <SchemaField.Row>
              <SchemaAction.Select />
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
      within(toolbar).getByRole("button", { name: /clear selection/i })
    )
    expect(toolbar.dataset.state).toBe("empty")
    await userEvent.click(within(row(titleOf("ID"))).getByRole("checkbox"))
    await userEvent.click(within(row(titleOf("Name"))).getByRole("checkbox"))
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
