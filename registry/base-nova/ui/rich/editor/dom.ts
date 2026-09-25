/**
 * The bridge between value space and DOM space.
 *
 * Everything outside this file counts in characters of the serialized string.
 * Only here does anyone care that a chip is an element — it contributes its
 * raw length and nothing else, which is what makes a chip one object.
 */

/** a chip carries the text it stands for, so reading the DOM never guesses */
export const RAW = "data-raw";

type Walk = { node: Node; start: number; len: number };

/** every leaf that contributes to the value, in order, with its offset */
function leaves(root: HTMLElement): Walk[] {
  const out: Walk[] = [];
  let at = 0;
  const visit = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) {
      const len = n.nodeValue?.length ?? 0;
      out.push({ node: n, start: at, len });
      at += len;
      return;
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return;
    const el = n as HTMLElement;
    const raw = el.getAttribute(RAW);
    if (raw !== null) {
      out.push({ node: el, start: at, len: raw.length });
      at += raw.length;
      return;
    }
    // Every newline in the value is a "\n" React rendered into a text node, so
    // any <br> here is the filler a browser adds to keep a trailing empty line
    // reachable. Counting it would add a character the value does not have.
    if (el.tagName === "BR") return;
    for (const child of Array.from(el.childNodes)) visit(child);
  };
  for (const child of Array.from(root.childNodes)) visit(child);
  return out;
}

export function readValue(root: HTMLElement): string {
  return leaves(root)
    .map((w) =>
      w.node.nodeType === Node.TEXT_NODE
        ? (w.node.nodeValue ?? "")
        : ((w.node as HTMLElement).getAttribute(RAW) ?? ""),
    )
    .join("");
}

/** a DOM position → an offset in the value */
export function toOffset(root: HTMLElement, node: Node, offset: number): number {
  const ls = leaves(root);
  if (node === root) {
    // the caret sits between children; count everything before that index
    let at = 0;
    const kids = Array.from(root.childNodes).slice(0, offset);
    for (const k of kids) {
      const w = ls.find((l) => l.node === k || k.contains(l.node));
      if (!w) continue;
      const tail = ls.filter((l) => k === l.node || k.contains(l.node));
      at = tail[tail.length - 1]!.start + tail[tail.length - 1]!.len;
    }
    return at;
  }
  for (const w of ls) {
    if (w.node === node) return w.start + Math.min(offset, w.len);
    if (w.node.nodeType === Node.ELEMENT_NODE && (w.node as HTMLElement).contains(node))
      return w.start + (offset > 0 ? w.len : 0);
  }
  return readValue(root).length;
}

export function readSelection(root: HTMLElement): { start: number; end: number } {
  const sel = root.ownerDocument.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.anchorNode || !root.contains(sel.anchorNode)) {
    const len = readValue(root).length;
    return { start: len, end: len };
  }
  const a = toOffset(root, sel.anchorNode, sel.anchorOffset);
  const b = sel.focusNode ? toOffset(root, sel.focusNode, sel.focusOffset) : a;
  return { start: Math.min(a, b), end: Math.max(a, b) };
}

/** an offset in the value → a DOM position */
function toDom(root: HTMLElement, offset: number): { node: Node; offset: number } {
  const ls = leaves(root);
  for (const w of ls) {
    if (offset <= w.start + w.len) {
      if (w.node.nodeType === Node.TEXT_NODE)
        return { node: w.node, offset: Math.max(0, offset - w.start) };
      // a chip or a <br>: land beside it, never within
      const parent = w.node.parentNode!;
      const index = Array.from(parent.childNodes).indexOf(w.node as ChildNode);
      return { node: parent, offset: offset <= w.start ? index : index + 1 };
    }
  }
  return { node: root, offset: root.childNodes.length };
}

export function writeSelection(root: HTMLElement, start: number, end: number) {
  const sel = root.ownerDocument.getSelection();
  if (!sel) return;
  const a = toDom(root, start);
  const b = start === end ? a : toDom(root, end);
  const range = root.ownerDocument.createRange();
  try {
    range.setStart(a.node, a.offset);
    range.setEnd(b.node, b.offset);
  } catch {
    return;
  }
  sel.removeAllRanges();
  sel.addRange(range);
}
