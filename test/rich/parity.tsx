import { expect } from "bun:test";
import * as React from "react";
import { render, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * The parity contract.
 *
 * A rich input earns its name by being a text field first. With no field
 * modules registered it must be indistinguishable from the native control:
 * same value, same caret, after the same keystrokes. Anything that diverges
 * here is a bug, not a feature — the chip behaviour is a separate suite that
 * only describes where divergence is *intended*.
 *
 * So the suite is differential. Every step runs against two subjects and
 * compares, rather than asserting values a test author guessed.
 */

/** what a subject looks like from the outside; both natives and rich implement it */
export type Subject = {
  name: string;
  /** single line suppresses Enter and never wraps */
  kind: "input" | "textarea";
  render: (props: { defaultValue: string }) => React.ReactElement;
  /** value and caret in VALUE space, not DOM space */
  read: (view: RenderResult) => State;
  /** set the caret in VALUE space; the drop-in half of setSelectionRange */
  setSelection: (view: RenderResult, start: number, end: number) => void;
  /** the element keystrokes go to */
  target: (view: RenderResult) => HTMLElement;
};

export type State = { value: string; start: number; end: number };

/**
 * A named step: keystrokes, or a selection set directly.
 *
 * Shift+arrow does not extend a selection under happy-dom — it moves the caret
 * like a bare arrow. A script that used it to build a range tested nothing and
 * passed, because both subjects were wrong in the same way. Ranges are set
 * through the subject instead, which is also the honest thing to exercise:
 * a drop-in has to implement setSelectionRange regardless.
 */
export type Step = { name: string; keys: string } | { name: string; select: [number, number] };

const show = (s: State) =>
  `${s.value.slice(0, s.start)}[${s.value.slice(s.start, s.end)}]${s.value.slice(s.end)}`;

/**
 * Run one script against one subject, capturing state after every step.
 * Fresh render per script so a failure cannot leak into the next.
 */
export async function trace(subject: Subject, initial: string, steps: Step[]): Promise<State[]> {
  const user = userEvent.setup({ document });
  const view = render(subject.render({ defaultValue: initial }));
  const el = subject.target(view);
  el.focus();
  // start every script from a known caret. set rather than typed: {End} on an
  // empty contenteditable throws inside user-event, and this is setup, not a
  // behaviour under test
  subject.setSelection(view, initial.length, initial.length);
  const out: State[] = [];
  for (const step of steps) {
    if ("select" in step) subject.setSelection(view, ...step.select);
    /**
     * Home and End cannot be aimed at a contenteditable with no child node —
     * user-event throws rather than no-ops. Skipping them on an empty field
     * keeps both subjects on the same script, which is better than dropping
     * the keys from the alphabet: that left them untested on a full one too.
     * Both subjects skip together, because by here their values agree.
     */ else if (!(/\{(Home|End)\}/.test(step.keys) && subject.read(view).value === ""))
      await user.keyboard(step.keys);
    out.push(subject.read(view));
  }
  view.unmount();
  return out;
}

/**
 * The assertion itself: two subjects, one script, step-by-step comparison.
 * Reports the first divergence with the caret drawn in, because "expected 4,
 * got 5" tells you nothing about a caret.
 */
export async function expectParity(a: Subject, b: Subject, initial: string, steps: Step[]) {
  const [ta, tb] = [await trace(a, initial, steps), await trace(b, initial, steps)];
  for (let i = 0; i < steps.length; i++) {
    const [x, y] = [ta[i], tb[i]];
    if (x.value !== y.value || x.start !== y.start || x.end !== y.end) {
      const trail = steps
        .slice(0, i + 1)
        .map((s) => s.name)
        .join(" → ");
      throw new Error(
        `parity lost after: ${trail}\n` +
          `  ${a.name}: ${show(x)}\n` +
          `  ${b.name}: ${show(y)}\n` +
          `  (start/end ${x.start},${x.end} vs ${y.start},${y.end})`,
      );
    }
  }
  expect(ta).toEqual(tb);
}

/* ------------------------------- events ---------------------------------- */

/**
 * What the field told the outside world, per step.
 *
 * A drop-in has to be observable, not just correct: a form library watches
 * `input`, a dirty check watches `change`, an editor toolbar watches `select`.
 * Comparing state alone would pass a component that silently tells nobody
 * anything, which is exactly what a contenteditable does by default.
 */
export async function traceEvents(
  subject: Subject,
  initial: string,
  steps: Step[],
): Promise<string[][]> {
  const user = userEvent.setup({ document });
  const view = render(subject.render({ defaultValue: initial }));
  const el = subject.target(view);
  const seen: string[] = [];
  /**
   * `select` is deliberately not compared.
   *
   * happy-dom emulates when an `<input>` raises it, and that emulation is not
   * the browser's rule — chasing it made the component fit the test environment
   * rather than the platform, trading one set of failures for another. The
   * events a consumer actually binds to are compared here; `select` is asserted
   * on its own terms below, where the claim can be stated honestly.
   */
  const kinds = ["beforeinput", "input", "change", "focus", "blur"];
  for (const k of kinds) el.addEventListener(k, () => seen.push(k));
  el.focus();
  subject.setSelection(view, initial.length, initial.length);
  const out: string[][] = [];
  for (const step of steps) {
    seen.length = 0;
    if ("select" in step) subject.setSelection(view, ...step.select);
    else await user.keyboard(step.keys);
    out.push([...seen]);
  }
  // `change` only lands on blur, and only when something actually changed
  seen.length = 0;
  el.blur();
  out.push([...seen]);
  view.unmount();
  return out;
}

export async function expectEventParity(a: Subject, b: Subject, initial: string, steps: Step[]) {
  const [ea, eb] = [await traceEvents(a, initial, steps), await traceEvents(b, initial, steps)];
  const names = [...steps.map((s) => s.name), "blur"];
  for (let i = 0; i < names.length; i++) {
    if (ea[i]!.join(" ") !== eb[i]!.join(" "))
      throw new Error(
        `different events after: ${names.slice(0, i + 1).join(" → ")}\n` +
          `  ${a.name}: ${ea[i]!.join(" ") || "(none)"}\n` +
          `  ${b.name}: ${eb[i]!.join(" ") || "(none)"}`,
      );
  }
  expect(ea).toEqual(eb);
}

/* ------------------------------ the scripts ------------------------------ */

/** everything a plain text field does, and every one of these must match */
export type Script = {
  name: string;
  initial: string;
  steps: Step[];
  /** claims to exercise a real range; asserted, so the claim cannot rot */
  selects?: boolean;
};

export const SCRIPTS: Script[] = [
  {
    name: "typing at the end",
    initial: "",
    steps: [
      { name: "type a", keys: "a" },
      { name: "type bc", keys: "bc" },
      { name: "type a space and more", keys: " def" },
    ],
  },
  {
    name: "typing in the middle",
    initial: "hello world",
    steps: [
      { name: "left x6", keys: "{ArrowLeft>6/}" },
      { name: "type", keys: "X" },
      { name: "type more", keys: "YZ" },
    ],
  },
  {
    name: "backspace and delete",
    initial: "abcdef",
    steps: [
      { name: "backspace", keys: "{Backspace}" },
      { name: "left x2", keys: "{ArrowLeft>2/}" },
      { name: "backspace mid-string", keys: "{Backspace}" },
      { name: "delete forward", keys: "{Delete}" },
      { name: "delete at the end", keys: "{End}{Delete}" },
      { name: "backspace at the start", keys: "{Home}{Backspace}" },
    ],
  },
  {
    name: "caret movement",
    initial: "one two three",
    steps: [
      { name: "home", keys: "{Home}" },
      { name: "right x4", keys: "{ArrowRight>4/}" },
      { name: "end", keys: "{End}" },
      { name: "right past the end", keys: "{ArrowRight}" },
      { name: "home then left past the start", keys: "{Home}{ArrowLeft}" },
    ],
  },
  {
    name: "selection replaces",
    initial: "abcdef",
    selects: true,
    steps: [
      { name: "select cde", select: [2, 5] },
      { name: "type over it", keys: "Z" },
    ],
  },
  {
    name: "select all then retype",
    initial: "throw this away",
    selects: true,
    steps: [
      { name: "select all", keys: "{Control>}a{/Control}" },
      { name: "type", keys: "new" },
    ],
  },
  {
    name: "backspace a selection",
    initial: "keep DROP keep",
    selects: true,
    steps: [
      { name: "select DROP", select: [5, 9] },
      { name: "backspace", keys: "{Backspace}" },
      { name: "type in its place", keys: "KEPT" },
    ],
  },
  {
    name: "a collapsed range is just a caret",
    initial: "abcdef",
    steps: [
      { name: "collapse at 3", select: [3, 3] },
      { name: "type", keys: "X" },
      { name: "select to the end then delete", select: [1, 7] },
      { name: "delete", keys: "{Delete}" },
    ],
    selects: true,
  },
  {
    name: "empty field edge cases",
    initial: "",
    steps: [
      { name: "backspace when empty", keys: "{Backspace}" },
      { name: "delete when empty", keys: "{Delete}" },
      // Home/End are exercised on a populated field by "caret movement".
      // user-event cannot simulate them on an empty contenteditable — it aims
      // at firstChild, and there isn't one — so asserting them here would test
      // the environment, not the component
      { name: "arrows when empty", keys: "{ArrowLeft}{ArrowRight}" },
      { name: "then type", keys: "a" },
    ],
  },
];

/** multiline only; a single-line field must swallow Enter instead */
export const MULTILINE_SCRIPTS: Script[] = [
  {
    name: "enter makes a line",
    initial: "one",
    steps: [
      { name: "enter", keys: "{Enter}" },
      { name: "type on the new line", keys: "two" },
      { name: "enter again", keys: "{Enter}three" },
    ],
  },
];
