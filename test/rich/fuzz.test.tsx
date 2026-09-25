import { describe, expect, test } from "bun:test";
import * as React from "react";
import type { RenderResult } from "@testing-library/react";
import {
  defineInputField,
  parse,
  RichInput,
  serialize,
  type InputField,
} from "@/registry/base-nova/ui/rich/editor";
import { type RichHandle } from "@/registry/base-nova/ui/rich/editor";
import { expectParity, trace, type Step, type Subject } from "./parity";

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
      const text = chars(1 + Math.floor(r() * 3));
      // user-event reads {} and [] as key syntax, so they go in escaped
      out.push({
        name: `type ${JSON.stringify(text)}`,
        keys: text.replace(/[{[]/g, "$&$&"),
      });
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

const RUNS = 100;
const STEPS = 12;

describe(`${RUNS} generated scripts, with no fields, are a plain text field`, () => {
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

describe(`${RUNS} generated scripts, with fields, hold the invariants`, () => {
  for (let seed = 1; seed <= RUNS; seed++) {
    test(`seed ${seed}`, async () => {
      const s = script(seed, STEPS);
      const states = await trace(richInput(FIELDS), s.initial, s.steps);
      for (const [i, st] of states.entries()) {
        const where = `seed ${seed}, after ${s.steps[i]!.name}, value ${JSON.stringify(st.value)}`;
        const segs = parse(st.value, FIELDS);
        // the value is whatever the segments say it is, exactly
        expect(serialize(segs), where).toBe(st.value);
        // segments tile the value: no gaps, no overlaps, in order
        let at = 0;
        for (const seg of segs) {
          const [from, to] =
            seg.type === "text" ? [seg.start, seg.end] : [seg.match.start, seg.match.end];
          expect(from, where).toBe(at);
          at = to;
        }
        expect(at, where).toBe(st.value.length);
        // and a caret is never stranded inside a token
        for (const seg of segs)
          if (seg.type === "field")
            expect(
              st.start > seg.match.start && st.start < seg.match.end,
              `${where}: caret ${st.start} inside ${JSON.stringify(seg.match.raw)}`,
            ).toBe(false);
      }
    });
  }
});
