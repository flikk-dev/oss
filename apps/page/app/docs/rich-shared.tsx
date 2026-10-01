import { Prose } from "@/components/docs";

/** what the two rich fields say identically, stated once */

export const INSTALL = {
  // one item ships both fields: they are one core with two heads
  cli: "shadcn@latest add https://oss.flikk.dev/ui/r/rich-input.json",
  manual: `git clone https://github.com/flikk-dev/oss
cp -r oss/registry/base-nova/ui/rich components/ui/rich`,
};

export const FIELD_API = {
  code: `defineInputField(key, {
  pattern:   RegExp                      // a complete token
  render:    (match) => ReactNode        // or { draft, resolved }
  opens?:    RegExp                      // an unfinished one, anchored at the caret
  resolved?: RegExp                      // the settled form of an async token
  resolve?:  (match) => Promise<string | null>
  editable?: boolean                     // caret may re-enter it. default false
  className?: string                     // the chip shell
})`,
  notes: (
    <Prose>
      Only pattern and render are load bearing. The rest is a thing you may want, and the surface
      never branches on what a token means.
    </Prose>
  ),
};

export const PICKER_API = {
  code: `<RichPicker
  query        what is being typed
  search       (query) => items | Promise<items>
  items        or a fixed list
  searchable   render an input of its own
  rect side    bottom | top | left | right
  onPick close
/>`,
  notes: (
    <Prose>
      A convenience, not the interface. It owns the arrows, Tab, Enter, Escape and the care about a
      slow search landing after a faster one, so a host does not write that twice. Render your own
      list whenever the arrangement matters.
    </Prose>
  ),
};
