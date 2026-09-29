import { describe, expect, test } from "bun:test";
import * as React from "react";
import { act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defineInputField, RichInput, type RichHandle } from "@/registry/base-nova/ui/rich/editor";

/** when the picker is open, and when it has no business being */

const flush = () => act(async () => {});

const user = defineInputField("user", {
  pattern: /@([\w-]+)/,
  opens: /@([\w-]*)$/,
  render: ({ groups }) => <span>{groups[0]}</span>,
});

function mount(value = "") {
  let handle: RichHandle | null = null;
  const view = render(
    <div>
      <button data-testid="elsewhere">elsewhere</button>
      <RichInput
        ref={(h) => {
          handle = h;
        }}
        data-testid="subject"
        components={[user]}
        defaultValue={value}
        renderPicker={({ query }) => (
          // a picker must not let the field blur, or it closes itself out from
          // under the pointer. RichPicker does this on every row
          <ul data-testid="picker" onMouseDown={(e) => e.preventDefault()}>
            {query}
          </ul>
        )}
      />
    </div>,
  );
  return { view, el: view.getByTestId("subject"), handle: () => handle! };
}

const open = (view: ReturnType<typeof mount>["view"]) => view.queryByTestId("picker");

describe("the picker", () => {
  test("opens while a token is being typed", async () => {
    const u = userEvent.setup({ document });
    const { view, el, handle } = mount("hi ");
    el.focus();
    handle().setSelectionRange(3, 3);
    await u.keyboard("@na");
    await flush();
    expect(open(view)).not.toBeNull();
  });

  test("closes on a click elsewhere", async () => {
    const u = userEvent.setup({ document });
    const { view, el, handle } = mount("hi ");
    el.focus();
    handle().setSelectionRange(3, 3);
    await u.keyboard("@na");
    await flush();
    expect(open(view)).not.toBeNull();

    await u.click(view.getByTestId("elsewhere"));
    await flush();
    expect(open(view)).toBeNull();
  });

  test("closes when you click back into the field", async () => {
    const u = userEvent.setup({ document });
    const { view, el, handle } = mount("hi ");
    el.focus();
    handle().setSelectionRange(3, 3);
    await u.keyboard("@na");
    await flush();
    expect(open(view)).not.toBeNull();

    // putting the caret somewhere is not asking to keep choosing
    await u.click(view.getByTestId("subject"));
    await flush();
    expect(open(view)).toBeNull();
  });

  test("but a click in the list itself leaves it alone", async () => {
    const u = userEvent.setup({ document });
    const { view, el, handle } = mount("hi ");
    el.focus();
    handle().setSelectionRange(3, 3);
    await u.keyboard("@na");
    await flush();

    await u.click(view.getByTestId("picker"));
    await flush();
    expect(open(view)).not.toBeNull();
  });
});
