import { describe, expect, test } from "bun:test";
import * as React from "react";
import type { RenderResult } from "@testing-library/react";
import { RichInput, RichTextarea, type RichHandle } from "@/registry/base-nova/ui/rich/editor";
import { expectParity, MULTILINE_SCRIPTS, SCRIPTS, type Subject } from "./parity";

/**
 * The claim, tested: with no field modules registered, a rich input is a text
 * field. Every divergence from the native control here is a bug — chip
 * behaviour lives in its own suite, because that is the only place where
 * differing is the point.
 */

const handles = new WeakMap<object, RichHandle>();

const native = (kind: "input" | "textarea"): Subject => ({
  name: `<${kind}>`,
  kind,
  render: ({ defaultValue }) =>
    kind === "input" ? (
      <input data-testid="subject" defaultValue={defaultValue} />
    ) : (
      <textarea data-testid="subject" defaultValue={defaultValue} />
    ),
  read: (view: RenderResult) => {
    const el = view.getByTestId("subject") as HTMLInputElement;
    return { value: el.value, start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
  },
  setSelection: (view: RenderResult, start: number, end: number) =>
    (view.getByTestId("subject") as HTMLInputElement).setSelectionRange(start, end),
  target: (view: RenderResult) => view.getByTestId("subject"),
});

/** the rich surface, read through the same input-shaped handle a host would use */
const rich = (kind: "input" | "textarea"): Subject => {
  const key = {};
  const Mount = ({ defaultValue }: { defaultValue: string }) => {
    const ref = React.useCallback((h: RichHandle | null) => {
      if (h) handles.set(key, h);
    }, []);
    const props = { ref, defaultValue, "data-testid": "subject" } as const;
    return kind === "input" ? <RichInput {...props} /> : <RichTextarea {...props} />;
  };
  return {
    name: `<Rich${kind === "input" ? "Input" : "Textarea"}>`,
    kind,
    render: ({ defaultValue }) => <Mount defaultValue={defaultValue} />,
    read: () => {
      const h = handles.get(key)!;
      return { value: h.value, start: h.selectionStart, end: h.selectionEnd };
    },
    setSelection: (_view, start, end) => handles.get(key)!.setSelectionRange(start, end),
    target: (view: RenderResult) => view.getByTestId("subject"),
  };
};

describe("RichInput is an <input>", () => {
  for (const s of SCRIPTS) {
    test(s.name, async () => {
      await expectParity(native("input"), rich("input"), s.initial, s.steps);
    });
  }
});

describe("RichTextarea is a <textarea>", () => {
  for (const s of [...SCRIPTS, ...MULTILINE_SCRIPTS]) {
    test(s.name, async () => {
      await expectParity(native("textarea"), rich("textarea"), s.initial, s.steps);
    });
  }
});

describe("and the single-line one swallows Enter", () => {
  test("like <input> does", async () => {
    const s = MULTILINE_SCRIPTS[0]!;
    await expectParity(native("input"), rich("input"), s.initial, s.steps);
  });
});

test("the harness is actually looking at the rich surface", () => {
  // guards against a subject that silently reads the native control instead
  expect(rich("input").name).toBe("<RichInput>");
});
