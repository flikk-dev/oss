import { describe, expect, test } from "bun:test";
import * as React from "react";
import type { RenderResult } from "@testing-library/react";
import { expectParity, MULTILINE_SCRIPTS, SCRIPTS, trace, type Subject } from "./parity";

/**
 * The harness proving itself, before anything is built on it.
 *
 * `<input>` and `<textarea>` are separate implementations that happen to agree
 * on every text behaviour except Enter. Running the scripts across the pair
 * shows the scripts are fair (nothing in them depends on which control it is)
 * and that the comparison is real (it catches Enter, where they genuinely
 * differ). Without this, a green rich-vs-native run would prove nothing — a
 * harness that always passes passes for a stub too.
 */

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
  setSelection: (view: RenderResult, start: number, end: number) => {
    (view.getByTestId("subject") as HTMLInputElement).setSelectionRange(start, end);
  },
  target: (view: RenderResult) => view.getByTestId("subject"),
});

const input = native("input");
const textarea = native("textarea");

describe("the scripts describe text editing, not one control", () => {
  for (const s of SCRIPTS) {
    test(s.name, async () => {
      await expectParity(input, textarea, s.initial, s.steps);
    });
  }
});

describe("a script that claims a selection makes one", () => {
  // the comparison only proves two subjects agree. it cannot notice that both
  // failed to select anything — which is what shift+arrow did here, silently
  // turning scripts into caret-movement tests wearing selection names. so the
  // claim gets asserted rather than trusted.
  for (const s of SCRIPTS.filter((s) => s.selects)) {
    test(s.name, async () => {
      const states = await trace(input, s.initial, s.steps);
      expect(states.some((t) => t.start !== t.end)).toBe(true);
    });
  }
});

describe("the harness can fail", () => {
  test("Enter separates the two controls, and parity says so", async () => {
    const s = MULTILINE_SCRIPTS[0]!;
    // a negative control: if this ever passes, the comparison has gone blind
    // and every green test above is worthless
    expect(expectParity(input, textarea, s.initial, s.steps)).rejects.toThrow(/parity lost/);
  });

  test("a textarea does take the newline", async () => {
    const s = MULTILINE_SCRIPTS[0]!;
    const steps = await trace(textarea, s.initial, s.steps);
    expect(steps.at(-1)!.value).toBe("one\ntwo\nthree");
  });

  test("an input does not", async () => {
    const s = MULTILINE_SCRIPTS[0]!;
    const steps = await trace(input, s.initial, s.steps);
    expect(steps.at(-1)!.value).toBe("onetwothree");
  });
});
