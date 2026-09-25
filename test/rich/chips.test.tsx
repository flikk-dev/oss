import { describe, expect, test } from "bun:test";
import * as React from "react";
import { act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defineInputField, RichInput, type RichHandle } from "@/registry/base-nova/ui/rich/editor";

/** where a rich input is meant to differ from a text field */

const user = defineInputField("user", {
  pattern: /@([\w-]+)/,
  render: ({ groups }) => <span>{groups[0]}</span>,
});

function mount(value: string) {
  let handle: RichHandle | null = null;
  const view = render(
    <RichInput
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
  return { view, el, handle: () => handle! };
}

/**
 * Let React settle.
 *
 * Kept separate from the action that caused it: wrapping `setSelectionRange`
 * itself in act() swallows the keystrokes that follow, while asserting without
 * a flush reads the render before the selection landed.
 */
const flush = () => act(async () => {});

const chips = (el: HTMLElement) =>
  Array.from(el.querySelectorAll("[data-slot=chip]")) as HTMLElement[];

describe("a chip", () => {
  test("is one object in the DOM, carrying the text it stands for", () => {
    const { el } = mount("hi @sam there");
    expect(chips(el)).toHaveLength(1);
    expect(chips(el)[0]!.getAttribute("data-raw")).toBe("@sam");
    expect(chips(el)[0]!.getAttribute("contenteditable")).toBe("false");
  });

  test("paints when the selection covers it", async () => {
    const { el, handle } = mount("hi @sam there");
    expect(chips(el)[0]!.hasAttribute("data-selected")).toBe(false);
    await act(async () => {
      handle().setSelectionRange(0, 13);
      await flush();
    });
    expect(chips(el)[0]!.hasAttribute("data-selected")).toBe(true);
  });

  test("does not paint when the selection stops short of it", async () => {
    const { el, handle } = mount("hi @sam there");
    await act(async () => {
      handle().setSelectionRange(0, 3);
      await flush();
    });
    expect(chips(el)[0]!.hasAttribute("data-selected")).toBe(false);
  });
});

describe("a committed chip only melts for the right reasons", () => {
  test("a delete that pulls the caret up against it leaves it alone", async () => {
    const u = userEvent.setup({ document });
    const { el, handle } = mount("@sam, hi");
    expect(chips(el)).toHaveLength(1);
    // caret just past the comma, then take the comma out: the caret now sits
    // at the chip's right edge, which is inside its range but not authoring it
    handle().setSelectionRange(5, 5);
    await flush();
    await u.keyboard("{Backspace}");
    expect(handle().value).toBe("@sam hi");
    expect(chips(el)).toHaveLength(1);
  });

  test("typing at its edge re-opens it, because that is authoring again", async () => {
    const u = userEvent.setup({ document });
    const { el, handle } = mount("@sam");
    expect(chips(el)).toHaveLength(1);
    handle().setSelectionRange(4, 4);
    await u.keyboard("m");
    // now being written, so it is letters again and the caret can stay in it
    expect(handle().value).toBe("@samm");
    expect(chips(el)).toHaveLength(0);
  });

  test("and sets again once the caret leaves", async () => {
    const u = userEvent.setup({ document });
    const { el, handle } = mount("@sam");
    handle().setSelectionRange(4, 4);
    await u.keyboard("m");
    expect(chips(el)).toHaveLength(0);
    handle().setSelectionRange(0, 0);
    await flush();
    expect(chips(el)).toHaveLength(1);
  });
});
