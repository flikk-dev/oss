import { describe, expect, test } from "bun:test";
import * as React from "react";
import { render, type RenderResult } from "@testing-library/react";
import {
  defineInputField,
  parse,
  RichInput,
  RichTextarea,
  serialize,
  type InputField,
} from "@/registry/base-nova/ui/rich/editor";
import { type RichHandle } from "@/registry/base-nova/ui/rich/editor";
import userEvent from "@testing-library/user-event";
import { expectParity, type Step, type Subject } from "./parity";

/**
 * The handwritten scripts say what we thought to check. These say what we did
 * not.
 *
 * Every case is generated from a seed and the seed is printed on failure, so a
 * fuzz failure is a bug report with a reproduction attached rather than a
 * shrug. The alphabet is weighted towards the characters that start tokens —
 * `@`, `{`, `}`, `#` — because that is where the interesting states live.
 */

/** mulberry32: small, seeded, and the same sequence on every machine */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ALPHABET = [..."aab@@{{}}##112  "];

/**
 * Newlines are generated only for the multiline runs.
 *
 * happy-dom's `<input>` drops a typed newline but still advances its caret for
 * it, so comparing against that would teach the component the emulator's habits
 * rather than the platform's. Where a newline genuinely belongs — a textarea —
 * it is generated and compared.
 */
function script(seed: number, steps: number, newlines = false) {
  const r = rng(seed);
  const alphabet = newlines ? [...ALPHABET, "\n"] : ALPHABET;
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)]!;
  const chars = (n: number) => Array.from({ length: n }, () => pick(alphabet)).join("");

  // never empty: user-event cannot aim Home/End at a contenteditable with no
  // child node, and an empty field is covered by a handwritten script anyway
  const initial = chars(1 + Math.floor(r() * 9));
  const out: Step[] = [];
  for (let i = 0; i < steps; i++) {
    const roll = r();
    if (roll < 0.35) {
      /**
       * Braces and brackets are never *typed*.
       *
       * user-event reads `{Key}` and `[Code]` as key descriptors, and escaping
       * only the openers leaves `}` to close a descriptor that was never
       * opened — which makes the keystrokes, not the component, the thing under
       * test. They still appear in generated initial values, so `{{ref}}`
       * tokens get selected, deleted and split as much as any other.
       */
      const text = chars(1 + Math.floor(r() * 3)).replace(/[{}[\]]/g, "a");
      out.push({ name: `type ${JSON.stringify(text)}`, keys: text });
    } else if (roll < 0.52) out.push({ name: "backspace", keys: "{Backspace}" });
    else if (roll < 0.64) out.push({ name: "delete", keys: "{Delete}" });
    else if (roll < 0.85) {
      const n = 1 + Math.floor(r() * 3);
      const dir = r() < 0.5 ? "ArrowLeft" : "ArrowRight";
      out.push({ name: `${dir} x${n}`, keys: `{${dir}>${n}/}` });
    } else {
      // Home and End are not generated: a run can delete the field down to
      // empty, and user-event cannot aim them at a contenteditable with no
      // child node. The handwritten "caret movement" script covers them.

      const a = Math.floor(r() * 12);
      const b = Math.floor(r() * 12);
      out.push({ name: `select ${a}-${b}`, select: [Math.min(a, b), Math.max(a, b)] });
    }
  }
  return { initial, steps: out };
}

/* ---------------------------- the subjects ------------------------------- */

const handles = new WeakMap<object, RichHandle>();

const nativeTextarea: Subject = {
  name: "<textarea>",
  kind: "textarea",
  render: ({ defaultValue }) => <textarea data-testid="subject" defaultValue={defaultValue} />,
  read: (view: RenderResult) => {
    const el = view.getByTestId("subject") as HTMLTextAreaElement;
    return { value: el.value, start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
  },
  setSelection: (view: RenderResult, start: number, end: number) =>
    (view.getByTestId("subject") as HTMLTextAreaElement).setSelectionRange(start, end),
  target: (view: RenderResult) => view.getByTestId("subject"),
};

const richTextarea = (): Subject => {
  const key = {};
  const Mount = ({ defaultValue }: { defaultValue: string }) => (
    <RichTextarea
      ref={(h) => {
        if (h) handles.set(key, h);
      }}
      data-testid="subject"
      defaultValue={defaultValue}
    />
  );
  return {
    name: "<RichTextarea>",
    kind: "textarea",
    render: ({ defaultValue }) => <Mount defaultValue={defaultValue} />,
    read: () => {
      const h = handles.get(key)!;
      return { value: h.value, start: h.selectionStart, end: h.selectionEnd };
    },
    setSelection: (_v, start, end) => handles.get(key)!.setSelectionRange(start, end),
    target: (view: RenderResult) => view.getByTestId("subject"),
  };
};

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

const richInput = (components?: InputField[]): Subject => {
  const key = {};
  const Mount = ({ defaultValue }: { defaultValue: string }) => (
    <RichInput
      ref={(h) => {
        if (h) handles.set(key, h);
      }}
      data-testid="subject"
      components={components}
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
};

const FIELDS = [
  defineInputField("user", { pattern: /@([\w-]+)/, render: ({ raw }) => <span>{raw}</span> }),
  defineInputField("ref", {
    pattern: /\{\{([\w.]+)\}\}/,
    render: ({ raw }) => <span>{raw}</span>,
  }),
  defineInputField("issue", { pattern: /#(\d+)/, render: ({ raw }) => <span>{raw}</span> }),
];

/* ------------------------------- the runs -------------------------------- */

/**
 * Off by default: three hundred scripts take minutes, which is too slow to sit
 * in front of every `bun test`. `bun run test:fuzz` runs it, and FUZZ_RUNS
 * turns it up when something needs shaking out harder.
 */
const RUNS = Number(process.env.FUZZ_RUNS ?? 100);
const STEPS = Number(process.env.FUZZ_STEPS ?? 12);
const when = describe.skipIf(process.env.FUZZ !== "1");

when(`${RUNS} generated scripts, with no fields, are a plain text field`, () => {
  for (let seed = 1; seed <= RUNS; seed++) {
    test(`seed ${seed}`, async () => {
      const s = script(seed, STEPS);
      try {
        await expectParity(nativeInput, richInput(), s.initial, s.steps);
      } catch (e) {
        throw new Error(
          `seed ${seed} · initial ${JSON.stringify(s.initial)}\n` +
            `steps: ${s.steps.map((x) => x.name).join(", ")}\n${(e as Error).message}`,
        );
      }
    });
  }
});

/**
 * Walk the rendered field and report where each chip actually sits.
 *
 * The invariant is about chips, not about matches: a token still being typed
 * parses as a field but renders as plain text, and a caret inside *that* is
 * correct. Only what is really a chip on screen can strand one.
 */
function chipRanges(el: HTMLElement): [number, number][] {
  const out: [number, number][] = [];
  let at = 0;
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      at += node.nodeValue?.length ?? 0;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const raw = (node as HTMLElement).getAttribute("data-raw");
    if (raw !== null) {
      out.push([at, at + raw.length]);
      at += raw.length;
      return;
    }
    for (const kid of Array.from(node.childNodes)) walk(kid);
  };
  for (const kid of Array.from(el.childNodes)) walk(kid);
  return out;
}

when(`${RUNS} generated scripts: RichTextarea is a <textarea>, newlines and all`, () => {
  for (let seed = 1; seed <= RUNS; seed++) {
    test(`seed ${seed}`, async () => {
      const s = script(seed, STEPS, true);
      try {
        await expectParity(nativeTextarea, richTextarea(), s.initial, s.steps);
      } catch (e) {
        throw new Error(
          `seed ${seed} · initial ${JSON.stringify(s.initial)}\n` +
            `steps: ${s.steps.map((x) => x.name).join(", ")}\n${(e as Error).message}`,
        );
      }
    });
  }
});

when(`${RUNS} generated scripts, with fields, hold the invariants`, () => {
  for (let seed = 1; seed <= RUNS; seed++) {
    test(`seed ${seed}`, async () => {
      const s = script(seed, STEPS);
      const subject = richInput(FIELDS);
      const u = userEvent.setup({ document });
      const view = render(subject.render({ defaultValue: s.initial }));
      const el = subject.target(view);
      el.focus();
      subject.setSelection(view, s.initial.length, s.initial.length);

      for (const step of s.steps) {
        if ("select" in step) subject.setSelection(view, ...step.select);
        else await u.keyboard(step.keys);
        const st = subject.read(view);
        const where = `seed ${seed}, after ${step.name}, value ${JSON.stringify(st.value)}`;
        const segs = parse(st.value, FIELDS);

        // the value is exactly what its segments say it is
        expect(serialize(segs), where).toBe(st.value);

        // and they tile it: in order, no gaps, no overlaps
        let at = 0;
        for (const seg of segs) {
          const [from, to] =
            seg.type === "text" ? [seg.start, seg.end] : [seg.match.start, seg.match.end];
          expect(from, where).toBe(at);
          at = to;
        }
        expect(at, where).toBe(st.value.length);

        // no caret is ever stranded inside something rendered as one object
        for (const [from, to] of chipRanges(el))
          expect(
            st.start > from && st.start < to,
            `${where}: caret ${st.start} inside the chip at ${from}-${to}`,
          ).toBe(false);
      }
      view.unmount();
    });
  }
});
