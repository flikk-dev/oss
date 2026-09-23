"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  clampOut,
  parse,
  rendererFor,
  type InputField,
  type Segment,
} from "@/registry/base-nova/ui/rich/core";
import { RAW, readSelection, readValue, toOffset as domOffset, writeSelection } from "./dom";

/**
 * A text field first. With no fields declared it is an `<input>` that happens
 * to be a div; every token the host declares becomes one object inside it.
 */

export type RichHandle = {
  readonly value: string;
  readonly selectionStart: number;
  readonly selectionEnd: number;
  setSelectionRange: (start: number, end: number) => void;
  focus: () => void;
};

type Props = {
  components?: InputField[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ref?: React.Ref<RichHandle>;
  "aria-label"?: string;
};

/** the chip: one line tall, always, whatever the host renders into it */
function Chip({
  segment,
  pending,
  selected,
}: {
  segment: Extract<Segment, { type: "field" }>;
  pending?: boolean;
  selected?: boolean;
}) {
  return (
    <span
      contentEditable={false}
      data-slot="chip"
      data-field={segment.field.key}
      data-form={segment.match.form}
      data-pending={pending ? "" : undefined}
      data-selected={selected ? "" : undefined}
      {...{ [RAW]: segment.match.raw }}
      className={cn(
        // structural only. items-baseline keeps the chip's text on the
        // sentence's baseline, so it reads as a word rather than a box dropped
        // into the line; an avatar or icon centres itself against that line
        // instead of dragging the text with it
        "inline-flex max-h-[1lh] items-baseline gap-1 overflow-hidden align-baseline",
        // an avatar or icon centres on the line; anything else the host renders
        // keeps the baseline, and can opt in with self-center of its own
        // deliberately NOT select-none: that is what tells the browser to leave
        // an element out of the painted selection, and a chip that stays clear
        // while the text around it highlights reads as untouched right when it
        // is about to be deleted. contenteditable=false already makes it atomic
        // to edit; being selectable is what makes it look atomic
        "[&_img]:self-center [&_svg]:self-center [&_svg]:shrink-0",
        // only its width changes when the answer lands, so no text moves
        "data-pending:opacity-60",
        // the browser paints the selection now, so this is only a hook for a
        // host that wants more than the native highlight
        "rounded-[0.2em]",
        segment.field.className,
      )}
    >
      {rendererFor(segment.field, segment.match.form)(segment.match)}
    </span>
  );
}

function Surface({
  multiline,
  components = [],
  value: controlled,
  defaultValue = "",
  onValueChange,
  placeholder,
  disabled,
  className,
  ref,
  ...rest
}: Props & { multiline: boolean }) {
  const root = React.useRef<HTMLDivElement>(null);
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const value = controlled ?? uncontrolled;
  const [caret, setCaret] = React.useState<number | null>(null);
  /**
   * The token being authored right now, if any.
   *
   * `@sam` matches at `@s`, so a token has to stay plain text while it is being
   * typed or it would freeze under the caret and become untypeable. But that
   * grace belongs to the run the user is *writing*, not to any token the caret
   * later wanders into — otherwise a committed chip would melt every time you
   * arrowed past it. So it is tracked as a range, set when an edit lands inside
   * a match and dropped the moment the caret leaves.
   */
  const [draft, setDraft] = React.useState<{ start: number; end: number } | null>(null);
  const segments = React.useMemo(() => {
    const segs = parse(value, components);
    const melt = (s: Extract<Segment, { type: "field" }>): Segment => ({
      type: "text",
      text: s.match.raw,
      start: s.match.start,
      end: s.match.end,
    });
    return segs.map((s) => {
      if (s.type !== "field") return s;
      const { start, end } = s.match;
      // still being written
      if (draft && draft.start <= start && draft.end >= end) return melt(s);
      // or declared amendable, and the caret has come back inside it
      if (s.field.editable && caret !== null && caret > start && caret < end) return melt(s);
      return s;
    });
  }, [value, components, caret, draft]);
  // where the caret should sit once React has painted this value
  const pending = React.useRef<{ start: number; end: number } | null>(null);
  /**
   * An IME owns the DOM while it composes.
   *
   * Between compositionstart and compositionend the browser is writing
   * provisional text — 'k' 'a' becoming か — and it must not be interrupted:
   * preventing the input rejects the keystroke, and re-rendering from React
   * deletes the text the IME is still holding a range on. So we stand back
   * entirely and read the result once, at the end.
   */
  const composing = React.useRef(false);
  /**
   * Rebuild the subtree on every commit instead of reconciling it.
   *
   * React assumes it owns the DOM it renders into. Here it does not: the
   * browser writes to a contenteditable directly — an IME most obviously, but
   * any input we did not intercept as well — so by the time React diffs, its
   * picture of the children and the live nodes disagree. It then splices new
   * content into stale nodes, which is what leaves a half-typed token wearing
   * an old chip and letters stranded beside it.
   *
   * Changing this key throws the whole subtree away and rebuilds it from the
   * value. Node identity is lost every keystroke, which costs nothing: the
   * caret is ours to restore anyway, and the value is the only truth here.
   */
  const [gen, setGen] = React.useState(0);
  /** tokens looked up already, so a rewrite never loops or refetches */
  const tried = React.useRef(new Set<string>());
  const [inFlight, setInFlight] = React.useState<ReadonlySet<string>>(new Set());
  // resolution lands late; it must rewrite whatever the value is by then
  const latest = React.useRef(value);
  latest.current = value;
  const caretRef = React.useRef(0);
  /**
   * The live selection, so a chip inside it can paint itself.
   *
   * The browser will not do it: a chip is `contenteditable=false`, and native
   * selection highlighting skips or half-paints those, so dragging across one
   * leaves it looking untouched right as you are about to delete it.
   */
  const [range, setRange] = React.useState<{ start: number; end: number } | null>(null);

  const commit = (next: string, caret: { start: number; end: number }) => {
    setCaret(caret.start === caret.end ? caret.start : null);
    caretRef.current = caret.start;
    const segs = parse(next, components);
    // an edit landing in a match means that match is still being written
    const under = segs.find(
      (s): s is Extract<Segment, { type: "field" }> =>
        s.type === "field" && caret.start >= s.match.start && caret.end <= s.match.end,
    );
    setDraft(under ? { start: under.match.start, end: under.match.end } : null);
    pending.current = {
      start: clampOut(segs, caret.start, -1),
      end: clampOut(segs, caret.end, 1),
    };
    if (controlled === undefined) setUncontrolled(next);
    setGen((g) => g + 1);
    onValueChange?.(next);
  };

  /**
   * Settle draft tokens once they stop being edited.
   *
   * Held until the draft closes on purpose: rewriting `@sam` into
   * `@[Sam Okoye](sam)` while the word is still being typed would yank the
   * caret out from under the user. Once it lands the value carries the answer,
   * so nothing looks it up again — including a paste into another field.
   */
  React.useEffect(() => {
    if (draft) return;
    for (const seg of parse(value, components)) {
      if (seg.type !== "field" || seg.match.form !== "draft") continue;
      const { resolve } = seg.field;
      if (!resolve) continue;
      const id = `${seg.field.key}:${seg.match.raw}`;
      if (tried.current.has(id)) continue;
      tried.current.add(id);
      setInFlight((p) => new Set(p).add(id));
      const { raw, start } = seg.match;
      resolve(seg.match)
        .then((settled) => {
          if (!settled || settled === raw) return;
          const now = latest.current;
          // it may have moved while we were away; trust the text, not the offset
          const at = now.slice(start, start + raw.length) === raw ? start : now.indexOf(raw);
          if (at < 0) return;
          const shift = settled.length - raw.length;
          const c = caretRef.current;
          const moved = c > at ? c + shift : c;
          commit(now.slice(0, at) + settled + now.slice(at + raw.length), {
            start: moved,
            end: moved,
          });
        })
        .catch(() => {})
        .finally(() =>
          setInFlight((p) => {
            const n = new Set(p);
            n.delete(id);
            return n;
          }),
        );
    }
    // eslint-disable-next-line
  }, [value, draft, components]);

  // an edit or a click moves the caret, and which token is "live" follows it
  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    const doc = el.ownerDocument;
    const sync = () => {
      // a re-render mid-composition would destroy the IME's own range
      if (composing.current) return;
      if (doc.activeElement !== el) {
        setCaret(null);
        setRange(null);
        return setDraft(null);
      }
      const { start, end } = readSelection(el);
      caretRef.current = start;
      setCaret(start === end ? start : null);
      setRange(start === end ? null : { start, end });
      // the caret has left what was being written; let it set
      setDraft((d) => (d && start >= d.start && end <= d.end ? d : null));
    };
    doc.addEventListener("selectionchange", sync);
    el.addEventListener("focus", sync);
    el.addEventListener("blur", sync);
    return () => {
      doc.removeEventListener("selectionchange", sync);
      el.removeEventListener("focus", sync);
      el.removeEventListener("blur", sync);
    };
  }, []);

  // the DOM is ours: React renders the value, then we put the caret back
  React.useLayoutEffect(() => {
    const el = root.current;
    if (!el || !pending.current) return;
    const { start, end } = pending.current;
    pending.current = null;
    if (el.ownerDocument.activeElement === el) writeSelection(el, start, end);
  });

  React.useImperativeHandle(
    ref,
    (): RichHandle => ({
      get value() {
        return value;
      },
      get selectionStart() {
        return root.current ? readSelection(root.current).start : 0;
      },
      get selectionEnd() {
        return root.current ? readSelection(root.current).end : 0;
      },
      setSelectionRange: (start, end) => {
        const el = root.current;
        if (!el) return;
        const segs = parse(readValue(el), components);
        writeSelection(el, clampOut(segs, start, -1), clampOut(segs, end, 1));
      },
      focus: () => root.current?.focus(),
    }),
    [value, components],
  );

  /**
   * Every edit is intercepted rather than let into the DOM, because the browser
   * would happily split a chip down the middle. The next value is computed in
   * value space, where a chip is an indivisible run of characters.
   *
   * Native listener, not React's `onBeforeInput`: that one is a legacy
   * synthetic event polyfilled from keypress and carries no `inputType`, so
   * every branch below would read undefined.
   */
  React.useEffect(() => {
    const el = root.current;
    if (!el) return;

    const onBeforeInput = (e: InputEvent) => {
      if (disabled || composing.current) return;
      const type = e.inputType;
      const current = readValue(el);
      const segs = parse(current, components);
      const live = readSelection(el);

      /**
       * What the browser intends to replace. It reports this for word and line
       * deletes too, so Alt+Backspace and Cmd+Backspace need no key handling of
       * their own — we take the range it worked out and widen it to whole chips.
       */
      const targeted = () => {
        const r = e.getTargetRanges?.()[0];
        if (!r) return live;
        const a = domOffset(el, r.startContainer, r.startOffset);
        const b = domOffset(el, r.endContainer, r.endOffset);
        return { start: Math.min(a, b), end: Math.max(a, b) };
      };
      /**
       * Widen a range to cover any atomic chip it touches — that is what makes
       * one an object rather than a run of letters. An `editable` token is
       * deliberately left alone: it deletes a character at a time, like text.
       */
      const whole = ({ start, end }: { start: number; end: number }) => {
        let [from, to] = [start, end];
        for (const seg of segs) {
          if (seg.type !== "field" || seg.field.editable) continue;
          const { start: s0, end: e0 } = seg.match;
          if (s0 < to && e0 > from) {
            from = Math.min(from, s0);
            to = Math.max(to, e0);
          }
        }
        return { from, to };
      };
      const apply = (from: number, to: number, insert: string) => {
        e.preventDefault();
        commit(current.slice(0, from) + insert + current.slice(to), {
          start: from + insert.length,
          end: from + insert.length,
        });
      };

      if (type === "insertText" || type === "insertReplacementText") {
        const { from, to } = whole(live);
        return apply(from, to, e.data ?? "");
      }
      if (type === "insertParagraph" || type === "insertLineBreak") {
        e.preventDefault();
        if (!multiline) return; // a single-line field swallows Enter, like <input>
        const { from, to } = whole(live);
        return apply(from, to, "\n");
      }
      if (type === "insertFromPaste" || type === "insertFromDrop") {
        e.preventDefault();
        return; // the clipboard is only readable on the paste event
      }
      if (type.startsWith("delete")) {
        const t = targeted();
        // a collapsed target means the browser had nothing to offer: step ourselves
        const range =
          t.start !== t.end
            ? t
            : type.includes("Backward")
              ? { start: Math.max(0, t.start - 1), end: t.start }
              : { start: t.start, end: Math.min(current.length, t.end + 1) };
        const { from, to } = whole(range);
        if (from === to) return void e.preventDefault();
        return apply(from, to, "");
      }
      if (type === "historyUndo" || type === "historyRedo") e.preventDefault();
    };

    const onStart = () => {
      composing.current = true;
    };
    const onEnd = () => {
      composing.current = false;
      // the IME already put its text in the DOM; adopt it, and commit rebuilds
      commit(readValue(el), readSelection(el));
    };

    el.addEventListener("beforeinput", onBeforeInput);
    el.addEventListener("compositionstart", onStart);
    el.addEventListener("compositionend", onEnd);
    return () => {
      el.removeEventListener("beforeinput", onBeforeInput);
      el.removeEventListener("compositionstart", onStart);
      el.removeEventListener("compositionend", onEnd);
    };
  });

  /**
   * Copy the value, not the rendering.
   *
   * A chip renders as whatever the host chose — a name, a face, an icon — and
   * the browser would put *that* on the clipboard, so `@sam` came back as
   * "Sam Okoye" and pasted as dead text. Taking the slice out of the value
   * instead means a copied chip is the characters that made it, and pasting
   * anywhere re-tokenizes it back into the same object.
   */
  const onClip = (cut: boolean) => (e: React.ClipboardEvent<HTMLDivElement>) => {
    const el = root.current;
    if (!el) return;
    const current = readValue(el);
    const { start, end } = readSelection(el);
    if (start === end) return; // nothing selected: let the browser have it
    e.preventDefault();
    e.clipboardData.setData("text/plain", current.slice(start, end));
    if (cut && !disabled)
      commit(current.slice(0, start) + current.slice(end), { start, end: start });
  };

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const el = root.current;
    if (!el || disabled) return;
    e.preventDefault();
    const raw = e.clipboardData.getData("text/plain");
    const text = multiline ? raw : raw.replace(/\r?\n/g, " ");
    const current = readValue(el);
    const { start, end } = readSelection(el);
    commit(current.slice(0, start) + text + current.slice(end), {
      start: start + text.length,
      end: start + text.length,
    });
  };

  return (
    <div
      {...rest}
      ref={root}
      role="textbox"
      aria-multiline={multiline}
      aria-disabled={disabled || undefined}
      contentEditable={!disabled}
      suppressContentEditableWarning
      spellCheck={false}
      tabIndex={disabled ? -1 : 0}
      data-slot={multiline ? "rich-textarea" : "rich-input"}
      data-empty={value === "" ? "" : undefined}
      onPaste={onPaste}
      onCopy={onClip(false)}
      onCut={onClip(true)}
      className={cn(
        "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
        // the placeholder is ours: a contenteditable has none
        "before:pointer-events-none before:text-muted-foreground before:content-[attr(data-placeholder)]",
        "not-data-empty:before:content-none",
        multiline
          ? "min-h-20 whitespace-pre-wrap"
          : "overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:h-0",
        className,
      )}
      data-placeholder={placeholder}
    >
      <React.Fragment key={gen}>
        {segments.map((s, i) =>
          s.type === "text" ? (
            <React.Fragment key={i}>{s.text}</React.Fragment>
          ) : (
            <Chip
              key={i}
              segment={s}
              pending={inFlight.has(`${s.field.key}:${s.match.raw}`)}
              selected={!!range && s.match.start < range.end && s.match.end > range.start}
            />
          ),
        )}
      </React.Fragment>
    </div>
  );
}

export function RichInput(props: Props) {
  return <Surface {...props} multiline={false} />;
}

export function RichTextarea(props: Props) {
  return <Surface {...props} multiline />;
}
