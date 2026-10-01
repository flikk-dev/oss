import { describe, expect, test } from "bun:test";
import * as React from "react";
import { act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defineInputField, RichInput, type RichHandle } from "@/registry/base-nova/ui/rich/editor";

/**
 * Undo, which is ours to own.
 *
 * Not a parity suite: happy-dom gives a native `<input>` no undo at all, so
 * comparing against one would pass whatever we did. It is also not really
 * native behaviour we are copying — intercepting every edit desynchronises the
 * browser's own history, which is why Cmd+Z currently does nothing. So this
 * states the contract directly.
 */

const user = defineInputField("user", {
  pattern: /@([\w-]+)/,
  render: ({ groups }) => <span>{groups[0]}</span>,
});

const flush = () => act(async () => {});

function mount(value = "") {
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
  return { el, handle: () => handle! };
}

/** the keyboard path, since user-event raises no historyUndo of its own */
function history(el: HTMLElement, which: "historyUndo" | "historyRedo") {
  const e = new InputEvent("beforeinput", { bubbles: true, cancelable: true });
  Object.defineProperty(e, "inputType", { value: which });
  el.dispatchEvent(e);
}

describe("undo", () => {
  test("puts back the value and the caret together", async () => {
    const u = userEvent.setup({ document });
    const { handle } = mount("hi ");
    handle().setSelectionRange(3, 3);
    await u.keyboard("there");
    expect(handle().value).toBe("hi there");
    handle().undo();
    await flush();
    expect(handle().value).toBe("hi ");
    // a caret left at the end of text that no longer exists is the usual bug
    expect(handle().selectionStart).toBe(3);
  });

  test("takes a run of typing as one step, not one per key", async () => {
    const u = userEvent.setup({ document });
    const { handle } = mount("");
    await u.keyboard("hello");
    handle().undo();
    await flush();
    expect(handle().value).toBe("");
  });

  test("keeps a delete as its own step", async () => {
    const u = userEvent.setup({ document });
    const { handle } = mount("abc");
    handle().setSelectionRange(3, 3);
    await u.keyboard("d");
    await u.keyboard("{Backspace}{Backspace}");
    expect(handle().value).toBe("ab");
    handle().undo();
    await flush();
    expect(handle().value).toBe("abcd");
  });

  test("does nothing at the beginning of history", async () => {
    const { handle } = mount("untouched");
    handle().undo();
    handle().undo();
    await flush();
    expect(handle().value).toBe("untouched");
  });

  test("restores a chip as one object", async () => {
    const u = userEvent.setup({ document });
    const { el, handle } = mount("hi ");
    handle().setSelectionRange(3, 3);
    await u.keyboard("@sam");
    handle().setSelectionRange(0, 0);
    await flush();
    expect(el.querySelectorAll("[data-slot=chip]")).toHaveLength(1);
    handle().undo();
    await flush();
    expect(handle().value).toBe("hi ");
    expect(el.querySelectorAll("[data-slot=chip]")).toHaveLength(0);
  });

  test("answers the keyboard, not just the API", async () => {
    const u = userEvent.setup({ document });
    const { el, handle } = mount("");
    await u.keyboard("gone");
    history(el, "historyUndo");
    await flush();
    expect(handle().value).toBe("");
  });
});

describe("redo", () => {
  test("puts back what undo took", async () => {
    const u = userEvent.setup({ document });
    const { handle } = mount("");
    await u.keyboard("hello");
    handle().undo();
    await flush();
    handle().redo();
    await flush();
    expect(handle().value).toBe("hello");
  });

  test("is dropped by a new edit, so the future cannot fork", async () => {
    const u = userEvent.setup({ document });
    const { handle } = mount("");
    await u.keyboard("first");
    handle().undo();
    await flush();
    await u.keyboard("second");
    handle().redo();
    await flush();
    expect(handle().value).toBe("second");
  });
});
