import { describe, expect, test } from "bun:test"
import {
  createJsonSchema,
  defineType,
  fromJsonSchema,
  toJsonSchema,
  types,
} from "@/store"

/**
 * Target behaviour for the core. Written before the implementation — every
 * `expect` here is a contract, not a description of what exists.
 *
 * Value in / value out is real JSON Schema (draft 2020-12). The tree is an
 * implementation detail; consumers only see the handle and JSON.
 */

/* ------------------------------- fixtures -------------------------------- */

/** what the sample editor shows today, as the schema it should emit */
const user = {
  type: "object",
  properties: {
    id: {
      type: "integer",
      title: "ID",
      description: "Unique numeric identifier",
      examples: ["1042"],
    },
    fullName: {
      type: "string",
      title: "Full name",
      description: "Display name shown in the app",
      examples: ["Ada Lovelace"],
    },
    email: {
      type: "string",
      format: "email",
      title: "Email",
      examples: ["ada@example.com"],
    },
    active: { type: "boolean", title: "Active", examples: ["true"] },
    role: {
      type: "string",
      title: "Role",
      description: "Permission level",
      oneOf: [
        { const: "admin", title: "Admin", description: "Full access" },
        { const: "editor", title: "Editor" },
        { const: "viewer", title: "Viewer", description: "Read only" },
      ],
    },
    address: {
      type: "object",
      title: "Address",
      description: "Postal address",
      properties: {
        street: {
          type: "string",
          title: "Street",
          examples: ["12 Grimmauld Place"],
        },
        zip: {
          type: "string",
          title: "ZIP",
          description: "Postal code",
          examples: ["10115"],
        },
      },
      required: ["street", "zip"],
      additionalProperties: false,
    },
    tags: {
      type: "array",
      title: "Tags",
      items: {
        type: "string",
        title: "Tags",
        description: "Free-form labels",
        examples: ["vip"],
      },
    },
    contact: {
      title: "Contact",
      description: "How to reach them",
      oneOf: [
        {
          type: "string",
          title: "Phone",
          description: "E.164 number",
          examples: ["+41791234567"],
        },
        {
          type: "object",
          title: "Social",
          properties: {
            network: {
              type: "string",
              title: "Network",
              oneOf: [
                { const: "x", title: "X" },
                { const: "bluesky", title: "Bluesky" },
              ],
            },
            username: { type: "string", title: "Username", examples: ["ada"] },
          },
          required: ["network", "username"],
          additionalProperties: false,
        },
      ],
    },
    createdAt: {
      type: "string",
      format: "date-time",
      title: "Created at",
      examples: ["2026-09-14T10:00:00Z"],
    },
  },
  required: ["id", "fullName", "email", "active", "contact", "createdAt"],
  additionalProperties: false,
}

/** things the editor has no UI for must survive untouched */
const withForeignKeywords = {
  type: "object",
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://flikk.dev/user.json",
  properties: {
    name: {
      type: "string",
      title: "Name",
      minLength: 1,
      maxLength: 80,
      "x-ui": { widget: "big" },
    },
    age: { type: "integer", title: "Age", minimum: 0 },
  },
  required: ["name", "age"],
  additionalProperties: false,
}

const nullable = {
  type: "object",
  properties: {
    nick: { type: ["string", "null"], title: "Nick" },
    home: {
      anyOf: [
        { type: "object", properties: {}, additionalProperties: false },
        { type: "null" },
      ],
      title: "Home",
    },
  },
  required: ["nick", "home"],
  additionalProperties: false,
}

/* ------------------------------ round trips ------------------------------ */

describe("fromJsonSchema → toJsonSchema", () => {
  test("the sample user schema round-trips losslessly", () => {
    expect(toJsonSchema(fromJsonSchema(user))).toEqual(user)
  })

  test("unknown keywords ride along on the node and are written back", () => {
    expect(toJsonSchema(fromJsonSchema(withForeignKeywords))).toEqual(
      withForeignKeywords
    )
  })

  test("nullable primitives and nullable objects", () => {
    expect(toJsonSchema(fromJsonSchema(nullable))).toEqual(nullable)
  })

  test("the root is an object node; an empty schema is a root with no children", () => {
    const empty = {
      type: "object",
      properties: {},
      additionalProperties: false,
    }
    const root = fromJsonSchema(empty)
    expect(root).toMatchObject({ type: "object", key: "", children: [] })
    expect(toJsonSchema(root)).toEqual(empty)
  })
})

/* ---------------------------------- tree --------------------------------- */

describe("tree shape", () => {
  const tree = fromJsonSchema(user).children!

  test("property key is the node key; title and description come along", () => {
    const id = tree.find((n) => n.key === "id")!
    expect(id).toMatchObject({
      type: "integer",
      title: "ID",
      description: "Unique numeric identifier",
      examples: ["1042"],
    })
  })

  test("required ↔ optional", () => {
    expect(tree.find((n) => n.key === "role")!.optional).toBe(true)
    expect(tree.find((n) => n.key === "id")!.optional).toBe(false)
  })

  test("format types are their own type, not string + format", () => {
    expect(tree.find((n) => n.key === "email")!.type).toBe("email")
    expect(tree.find((n) => n.key === "createdAt")!.type).toBe("date")
  })

  test("array of X is X with repeated: true", () => {
    expect(tree.find((n) => n.key === "tags")!).toMatchObject({
      type: "string",
      repeated: true,
    })
  })

  test("a choice of only fixed values is a choice with const children", () => {
    const role = tree.find((n) => n.key === "role")!
    expect(role.type).toBe("oneOf")
    expect(role.children!.map((c) => [c.type, c.key, c.title])).toEqual([
      ["const", "admin", "Admin"],
      ["const", "editor", "Editor"],
      ["const", "viewer", "Viewer"],
    ])
  })

  test("a choice of shapes keeps each alternative as a child", () => {
    const contact = tree.find((n) => n.key === "contact")!
    expect(contact.children!.map((c) => c.type)).toEqual(["string", "object"])
  })

  test("unknown keywords land in node.extra", () => {
    const root = fromJsonSchema(withForeignKeywords)
    expect(root.extra).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://flikk.dev/user.json",
    })
    const name = root.children!.find((n) => n.key === "name")!
    expect(name.extra).toEqual({
      minLength: 1,
      maxLength: 80,
      "x-ui": { widget: "big" },
    })
  })
})

/* --------------------------------- handle -------------------------------- */

describe("createJsonSchema handle", () => {
  test("toJSON returns what went in", () => {
    const schema = createJsonSchema(user)
    expect(schema.toJSON()).toEqual(user)
  })

  test("edits show up in toJSON", () => {
    const schema = createJsonSchema(user)
    const id = schema.find("id")!
    schema.update(id, { title: "Identifier" })
    expect((schema.toJSON().properties as any).id.title).toBe("Identifier")
  })

  test("insert with a type creates a node keyed from the type", () => {
    const schema = createJsonSchema({ type: "object", properties: {} })
    const id = schema.insert(schema.root, "string")
    expect(schema.get(id)).toMatchObject({
      type: "string",
      key: "text",
      title: "",
    })
    expect(Object.keys(schema.toJSON().properties as object)).toEqual(["text"])
  })

  test("move reparents and reorders in one step", () => {
    const schema = createJsonSchema(user)
    const street = schema.find("address.street")!
    schema.move(street, schema.root, 0)
    const json = schema.toJSON() as any
    expect(Object.keys(json.properties)[0]).toBe("street")
    expect(Object.keys(json.properties.address.properties)).toEqual(["zip"])
  })

  test("a moved key that collides with a sibling is suffixed", () => {
    const schema = createJsonSchema({
      type: "object",
      properties: {
        a: { type: "string" },
        g: { type: "object", properties: { a: { type: "string" } } },
      },
    })
    schema.move(schema.find("g.a")!, schema.root, 1)
    expect(Object.keys(schema.toJSON().properties as object)).toEqual([
      "a",
      "a2",
      "g",
    ])
  })

  test("subscribe fires once per change with the new JSON", () => {
    const schema = createJsonSchema(user)
    const seen: unknown[] = []
    const off = schema.subscribe((json) => seen.push(json))
    schema.update(schema.find("id")!, { title: "X" })
    schema.update(schema.find("id")!, { title: "Y" })
    off()
    schema.update(schema.find("id")!, { title: "Z" })
    expect(seen).toHaveLength(2)
    expect((seen[1] as any).properties.id.title).toBe("Y")
  })

  test("reset replaces everything", () => {
    const schema = createJsonSchema(user)
    schema.reset(nullable)
    expect(schema.toJSON()).toEqual(nullable)
  })

  test("selection lives on the handle", () => {
    const schema = createJsonSchema(user)
    schema.select([schema.find("id")!, schema.find("email")!])
    expect(schema.selected().length).toBe(2)
    schema.removeSelected()
    expect(Object.keys(schema.toJSON().properties as object)).not.toContain(
      "id"
    )
    expect(schema.selected()).toEqual([])
  })
})

/* ------------------------------ type modules ----------------------------- */

describe("type modules", () => {
  test("the editor emits whatever the type's schema() says", () => {
    const regex = defineType({
      key: "regex",
      label: "Pattern",
      description: "Text matching a regular expression",
      icon: types.string.icon,
      color: types.string.color,
      schema: (n) => ({ type: "string", pattern: n.extra?.pattern ?? ".*" }),
      example: () => "abc",
      matches: (s) => s.type === "string" && typeof s.pattern === "string",
    })
    const schema = createJsonSchema(
      { type: "object", properties: {} },
      { types: [...Object.values(types), regex] }
    )
    const id = schema.insert(schema.root, "regex")
    schema.update(id, { extra: { pattern: "^[a-z]+$" } })
    expect((schema.toJSON().properties as any).pattern).toMatchObject({
      type: "string",
      pattern: "^[a-z]+$",
    })
  })

  test("parsing picks the most specific matching type", () => {
    const root = fromJsonSchema({
      type: "object",
      properties: {
        e: { type: "string", format: "email" },
        s: { type: "string" },
      },
    })
    expect(root.children!.map((n) => n.type)).toEqual(["email", "string"])
  })

  test("groups declare what they accept", () => {
    expect(types.object.accepts).toBe(true)
    expect(types.oneOf.accepts).toBe(true)
    expect(types.string.children).toBe(false)
  })
})

/* -------------------------------- examples ------------------------------- */

describe("toExample", () => {
  test("uses the first example, else a type default, first option for choices", async () => {
    const { toExample } = await import("@/store")
    expect(toExample(fromJsonSchema(user))).toMatchObject({
      id: 1042,
      fullName: "Ada Lovelace",
      role: "admin",
      address: { street: "12 Grimmauld Place", zip: "10115" },
      tags: ["vip"],
      contact: "+41791234567",
    })
  })
})
