import { describe, expect, test } from "bun:test";
import * as React from "react";
import { act, render } from "@testing-library/react";
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
    });
    expect(chips(el)[0]!.hasAttribute("data-selected")).toBe(true);
  });

  test("does not paint when the selection stops short of it", async () => {
    const { el, handle } = mount("hi @sam there");
    await act(async () => {
      handle().setSelectionRange(0, 3);
    });
    expect(chips(el)[0]!.hasAttribute("data-selected")).toBe(false);
  });
});
