import { describe, expect, test } from "bun:test";
import * as React from "react";
import { act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  defineInputField,
  RichTextarea,
  type RichHandle,
} from "@/registry/base-nova/ui/rich/editor";

/**
 * Typing CJK, without an IME.
 *
 * happy-dom has no input method, so these drive the composition events by hand
 * — which is the honest thing to test anyway: what the component must survive
 * is *an IME writing into its DOM*, and every bug here came from trusting that
 * DOM afterwards. The tests reproduce the write, then check the value came from
 * the snapshot instead.
 */

const user = defineInputField("user", {
  pattern: /@([\w-]+)/,
  render: ({ groups }) => <span>{groups[0]}</span>,
});

const flush = () => act(async () => {});

function mount(value: string) {
  let handle: RichHandle | null = null;
  const view = render(
    <RichTextarea
      ref={(h) => {
        handle = h;
      }}
      data-testid="subject"
      components={[user]}
      defaultValue={value}
    />,
  );
  const el = view.getByTestId("subject");
  el.focus();
  return { el, handle: () => handle! };
}

/** happy-dom drops `data` from the constructor, so it goes on by hand */
function composition(el: HTMLElement, type: string, data = "") {
  const e = new CompositionEvent(type, { bubbles: true });
  Object.defineProperty(e, "data", { value: data });
  el.dispatchEvent(e);
}

/**
 * What an IME does between start and end: it writes provisional text straight
 * into the DOM, without asking and without React knowing.
 */
function imeWrites(el: HTMLElement, text: string) {
  el.appendChild(el.ownerDocument.createTextNode(text));
}

describe("a composed run", () => {
  test("lands once, not twice", async () => {
    const { el, handle } = mount("");
    composition(el, "compositionstart");
    imeWrites(el, "おはよう");
    composition(el, "compositionend", "おはよう");
    await flush();
    expect(handle().value).toBe("おはよう");
  });

  test("lands at the caret, not at the end", async () => {
    const { el, handle } = mount("ab");
    handle().setSelectionRange(1, 1);
    composition(el, "compositionstart");
    imeWrites(el, "ございます");
    composition(el, "compositionend", "ございます");
    await flush();
    expect(handle().value).toBe("aございますb");
    expect(handle().selectionStart).toBe(6);
  });

  test("replaces a selection", async () => {
    const { el, handle } = mount("keep DROP keep");
    handle().setSelectionRange(5, 9);
    composition(el, "compositionstart");
    composition(el, "compositionend", "はい");
    await flush();
    expect(handle().value).toBe("keep はい keep");
  });

  test("survives the IME leaving rubbish behind", async () => {
    const { el, handle } = mount("");
    composition(el, "compositionstart");
    // an orphan React never made, and a second copy for good measure — the
    // shape that produced おはようおはよう
    imeWrites(el, "おはよう");
    imeWrites(el, "おはよう");
    composition(el, "compositionend", "おはよう");
    await flush();
    expect(handle().value).toBe("おはよう");
  });

  test("an abandoned composition changes nothing", async () => {
    const { el, handle } = mount("おはよう");
    composition(el, "compositionstart");
    composition(el, "compositionend", "");
    await flush();
    expect(handle().value).toBe("おはよう");
  });
});

describe("after a composition", () => {
  test("a newline goes in once", async () => {
    const u = userEvent.setup({ document });
    const { el, handle } = mount("");
    composition(el, "compositionstart");
    imeWrites(el, "おはよう");
    composition(el, "compositionend", "おはよう");
    await flush();
    handle().setSelectionRange(4, 4);
    await u.keyboard("{Enter}");
    expect(handle().value).toBe("おはよう\n");
  });

  test("deleting takes one character, not a duplicated line", async () => {
    const u = userEvent.setup({ document });
    const { el, handle } = mount("");
    composition(el, "compositionstart");
    imeWrites(el, "おはよう");
    composition(el, "compositionend", "おはよう");
    await flush();
    handle().setSelectionRange(4, 4);
    await u.keyboard("{Backspace}");
    expect(handle().value).toBe("おはよ");
  });

  test("latin typed after it does not drift", async () => {
    const u = userEvent.setup({ document });
    const { el, handle } = mount("");
    composition(el, "compositionstart");
    imeWrites(el, "おはよう");
    composition(el, "compositionend", "おはよう");
    await flush();
    handle().setSelectionRange(4, 4);
    await u.keyboard("Marc");
    // the diagonal bug wrote this as Mおはよう, おはようt, and so on
    expect(handle().value).toBe("おはようMarc");
  });

  test("a token typed after it still becomes a chip", async () => {
    const u = userEvent.setup({ document });
    const { el, handle } = mount("");
    composition(el, "compositionstart");
    imeWrites(el, "おはよう");
    composition(el, "compositionend", "おはよう");
    await flush();
    handle().setSelectionRange(4, 4);
    await u.keyboard(" @sam");
    handle().setSelectionRange(0, 0);
    await flush();
    expect(handle().value).toBe("おはよう @sam");
    expect(el.querySelectorAll("[data-slot=chip]")).toHaveLength(1);
  });
});
