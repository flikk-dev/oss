import { describe, expect, test } from "bun:test";
import * as React from "react";
import { act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RichInput, type RichHandle } from "@/registry/base-nova/ui/rich/editor";

/**
 * The rest of being a text field.
 *
 * A contenteditable submits nothing, ignores readOnly and maxLength, and has no
 * select() or blur(), because none of that is a contenteditable's job. It is all
 * a text field's job, and this claims to be one.
 */

const flush = () => act(async () => {});

function mount(props: Partial<React.ComponentProps<typeof RichInput>> = {}) {
  let handle: RichHandle | null = null;
  const view = render(
    <form data-testid="form">
      <RichInput
        ref={(h) => {
          handle = h;
        }}
        data-testid="subject"
        {...props}
      />
    </form>,
  );
  return {
    view,
    el: view.getByTestId("subject"),
    form: view.getByTestId("form") as HTMLFormElement,
    handle: () => handle!,
  };
}

describe("a form", () => {
  test("carries the value under the name it was given", () => {
    const { form } = mount({ name: "note", defaultValue: "hello @sam" });
    expect(new FormData(form).get("note")).toBe("hello @sam");
  });

  test("keeps up as it is typed into", async () => {
    const u = userEvent.setup({ document });
    const { form, el, handle } = mount({ name: "note", defaultValue: "" });
    el.focus();
    handle().setSelectionRange(0, 0);
    await u.keyboard("typed");
    expect(new FormData(form).get("note")).toBe("typed");
  });

  test("carries nothing when it was given no name", () => {
    const { form } = mount({ defaultValue: "hello" });
    expect([...new FormData(form).keys()]).toHaveLength(0);
  });
});

describe("readOnly", () => {
  test("refuses edits", async () => {
    const u = userEvent.setup({ document });
    const { el, handle } = mount({ readOnly: true, defaultValue: "fixed" });
    el.focus();
    handle().setSelectionRange(5, 5);
    await u.keyboard("more");
    expect(handle().value).toBe("fixed");
  });

  test("but still takes focus and a selection, where disabled does not", async () => {
    const { el, handle } = mount({ readOnly: true, defaultValue: "fixed" });
    el.focus();
    expect(el.ownerDocument.activeElement).toBe(el);
    handle().setSelectionRange(0, 5);
    await flush();
    expect(handle().selectionEnd).toBe(5);
  });
});

describe("maxLength", () => {
  test("stops the value growing past it", async () => {
    const u = userEvent.setup({ document });
    const { el, handle } = mount({ maxLength: 6, defaultValue: "abcd" });
    el.focus();
    handle().setSelectionRange(4, 4);
    await u.keyboard("efgh");
    expect(handle().value).toBe("abcdef");
  });

  test("lets a replacement through that does not grow it", async () => {
    const u = userEvent.setup({ document });
    const { el, handle } = mount({ maxLength: 4, defaultValue: "abcd" });
    el.focus();
    handle().setSelectionRange(0, 4);
    await u.keyboard("wxyz");
    expect(handle().value).toBe("wxyz");
  });
});

describe("the handle", () => {
  test("selects everything", async () => {
    const { el, handle } = mount({ defaultValue: "all of it" });
    el.focus();
    handle().select();
    await flush();
    expect([handle().selectionStart, handle().selectionEnd]).toEqual([0, 9]);
  });

  test("gives focus up", async () => {
    const { el, handle } = mount({ defaultValue: "x" });
    handle().focus();
    expect(el.ownerDocument.activeElement).toBe(el);
    handle().blur();
    expect(el.ownerDocument.activeElement).not.toBe(el);
  });
});

describe("autoFocus", () => {
  test("takes focus on mount", () => {
    const { el } = mount({ autoFocus: true, defaultValue: "x" });
    expect(el.ownerDocument.activeElement).toBe(el);
  });
});
