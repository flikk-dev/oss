import { describe, expect, test } from "bun:test";
import * as React from "react";
import { act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  defineInputField,
  RichInput,
  RichTextarea,
  type RichHandle,
} from "@/registry/base-nova/ui/rich/editor";

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

describe("filler line breaks the browser leaves behind", () => {
  /**
   * happy-dom does not add them, so they are added here on purpose.
   *
   * A real browser drops a <br> into a contenteditable to keep a trailing empty
   * line reachable. React never removes it, because React never rendered it, so
   * deleting the newline that caused it leaves a line break the value does not
   * have. This is that <br>, and the component has to sweep it.
   */
  function mountArea(value: string) {
    let handle: RichHandle | null = null;
    const view = render(
      <RichTextarea
        ref={(h) => {
          handle = h;
        }}
        data-testid="subject"
        defaultValue={value}
      />,
    );
    const el = view.getByTestId("subject");
    el.focus();
    return { el, handle: () => handle! };
  }

  test("are rendered for a trailing newline, so the last line has height", async () => {
    const { el } = mountArea("ab\n");
    await flush();
    // pre-wrap gives a trailing newline no height; without this, Enter at the
    // end of the value looks like nothing happened
    expect(el.querySelectorAll("br[data-filler]")).toHaveLength(1);
  });

  test("and not when it does not end in one", async () => {
    const { el } = mountArea("ab");
    await flush();
    expect(el.querySelectorAll("br")).toHaveLength(0);
  });

  test("are swept when the value has no newline", async () => {
    const { el, handle } = mountArea("ab");
    el.appendChild(el.ownerDocument.createElement("br"));
    expect(el.querySelectorAll("br")).toHaveLength(1);
    handle().setSelectionRange(2, 2);
    await flush();
    expect(el.querySelectorAll("br")).toHaveLength(0);
    expect(handle().value).toBe("ab");
  });

  test("but the one we render is left alone", async () => {
    const { el, handle } = mountArea("ab\n");
    el.appendChild(el.ownerDocument.createElement("br"));
    handle().setSelectionRange(3, 3);
    await flush();
    // the browser's goes, ours stays
    expect(el.querySelectorAll("br")).toHaveLength(1);
    expect(el.querySelectorAll("br[data-filler]")).toHaveLength(1);
  });
});

describe("a lookup that comes back with nothing", () => {
  const slow = (answer: string | null) =>
    defineInputField("who", {
      pattern: /@([\w-]+)/,
      resolved: /@\[([^\]]+)\]\(([\w-]+)\)/,
      resolve: async () => answer,
      render: {
        draft: ({ state, groups }) => (
          <span data-testid="chip" data-state={state ?? "idle"}>
            {groups[0]}
          </span>
        ),
        resolved: ({ groups }) => <span data-testid="chip">{groups[0]}</span>,
      },
    });

  function mountWith(field: ReturnType<typeof slow>) {
    let handle: RichHandle | null = null;
    const view = render(
      <RichInput
        ref={(h) => {
          handle = h;
        }}
        data-testid="subject"
        components={[field]}
        defaultValue="hi @nadia"
      />,
    );
    return { view, el: view.getByTestId("subject"), handle: () => handle! };
  }

  test("says so, instead of looking like it is still loading", async () => {
    const { view } = mountWith(slow(null));
    await flush();
    await flush();
    expect(view.getByTestId("chip").getAttribute("data-state")).toBe("failed");
  });

  test("and a lookup that finds something does not", async () => {
    const { view } = mountWith(slow("@[Nadia Rahman](nadia)"));
    await flush();
    await flush();
    expect(view.queryByTestId("chip")?.getAttribute("data-state")).not.toBe("failed");
  });
});

describe("the DOM is held to the value", () => {
  test("a stray node someone else wrote cannot get into the value", async () => {
    const u = userEvent.setup({ document });
    let handle: RichHandle | null = null;
    const view = render(
      <RichTextarea
        ref={(h) => {
          handle = h;
        }}
        data-testid="subject"
        defaultValue="ab"
      />,
    );
    view.getByTestId("subject").focus();
    handle!.setSelectionRange(2, 2);
    await flush();

    // whatever put it there, the field now shows more than it holds
    view.getByTestId("subject").appendChild(document.createTextNode("XY"));
    await u.keyboard("c");
    await flush();

    // the edit was computed from the value, so the rubbish never became real,
    // and the mismatch rebuilt the element that was showing it
    expect(handle!.value).toBe("abc");
    expect(view.getByTestId("subject").textContent).toBe("abc");
  });
});
