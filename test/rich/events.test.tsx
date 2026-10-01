import { describe, expect, test } from "bun:test";
import * as React from "react";
import { render, type RenderResult } from "@testing-library/react";
import { RichInput, type RichHandle } from "@/registry/base-nova/ui/rich/editor";
import userEvent from "@testing-library/user-event";
import { expectEventParity, SCRIPTS, traceEvents, type Subject } from "./parity";

/**
 * Being observable is part of being a text field.
 *
 * `onValueChange` tells the component's owner, and nothing else. A form
 * library, an autosave, a dirty check and an analytics hook all listen to the
 * DOM — `input` on every edit, `change` on a blur that followed one, `select`
 * when the selection moves. A contenteditable fires none of them for the edits
 * we intercept, so unless the component raises them itself it is a text field
 * that nobody downstream can hear.
 */

const handles = new WeakMap<object, RichHandle>();

const nativeInput: Subject = {
  name: "<input>",
  kind: "input",
  render: ({ defaultValue }) => <input data-testid="subject" defaultValue={defaultValue} />,
  read: (view: RenderResult) => {
    const el = view.getByTestId("subject") as HTMLInputElement;
    return { value: el.value, start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
  },
  setSelection: (view: RenderResult, start: number, end: number) =>
    (view.getByTestId("subject") as HTMLInputElement).setSelectionRange(start, end),
  target: (view: RenderResult) => view.getByTestId("subject"),
};

const richInput: Subject = (() => {
  const key = {};
  const Mount = ({ defaultValue }: { defaultValue: string }) => (
    <RichInput
      ref={(h) => {
        if (h) handles.set(key, h);
      }}
      data-testid="subject"
      defaultValue={defaultValue}
    />
  );
  return {
    name: "<RichInput>",
    kind: "input",
    render: ({ defaultValue }) => <Mount defaultValue={defaultValue} />,
    read: () => {
      const h = handles.get(key)!;
      return { value: h.value, start: h.selectionStart, end: h.selectionEnd };
    },
    setSelection: (_v, start, end) => handles.get(key)!.setSelectionRange(start, end),
    target: (view: RenderResult) => view.getByTestId("subject"),
  };
})();

describe("it raises what a text field raises", () => {
  for (const s of SCRIPTS) {
    test(s.name, async () => {
      await expectEventParity(nativeInput, richInput, s.initial, s.steps);
    });
  }
});

describe("the events say the right things", () => {
  test("a native input is the reference, and it does fire", async () => {
    // guards the suite: if the reference ever goes quiet, every comparison
    // above passes for a component that fires nothing at all
    const log = await traceEvents(nativeInput, "", [{ name: "type", keys: "ab" }]);
    expect(log[0]).toContain("input");
  });

  test("change lands on blur, once, only after an edit", async () => {
    const edited = await traceEvents(nativeInput, "", [{ name: "type", keys: "a" }]);
    expect(edited.at(-1)).toContain("change");
    const untouched = await traceEvents(nativeInput, "hi", [
      { name: "just move", keys: "{ArrowLeft}" },
    ]);
    expect(untouched.at(-1)).not.toContain("change");
  });
});

describe("select, which parity cannot judge", () => {
  // the differential suite skips `select`: happy-dom emulates when an <input>
  // raises it, and that emulation is not the platform's rule. the claim worth
  // making is narrower, and it is made directly.
  const log = async (steps: Parameters<typeof traceEvents>[2]) => {
    const seen: string[] = [];
    const view = render(richInput.render({ defaultValue: "hello world" }));
    const el = richInput.target(view);
    el.addEventListener("select", () => seen.push("select"));
    el.focus();
    richInput.setSelection(view, 11, 11);
    seen.length = 0;
    const u = userEvent.setup({ document });
    for (const step of steps)
      if ("select" in step) richInput.setSelection(view, ...step.select);
      else await u.keyboard(step.keys);
    view.unmount();
    return seen;
  };

  test("fires when the caret moves", async () => {
    expect(await log([{ name: "left", keys: "{ArrowLeft}" }])).toEqual(["select"]);
  });

  test("fires when a range is set", async () => {
    expect((await log([{ name: "range", select: [0, 5] }])).length).toBeGreaterThan(0);
  });

  test("stays quiet while typing, where the caret only follows the text", async () => {
    expect(await log([{ name: "type", keys: "abc" }])).toEqual([]);
  });
});
