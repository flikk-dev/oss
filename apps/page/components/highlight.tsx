import * as React from "react";

/**
 * Tiny TSX tokenizer: enough for the snippets on this page, colours from
 * the `--code-*` tokens. Not a grammar: comments, strings, keywords, JSX
 * tags and attributes, numbers, punctuation; everything else is plain.
 */
const KEYWORDS = new Set(
  "import export from default function return const let var if else new async await type interface extends typeof null undefined true false".split(
    " ",
  ),
);

type Kind = "comment" | "string" | "keyword" | "tag" | "attr" | "number" | "punct" | "plain";

const RULES: [RegExp, Kind][] = [
  [/^\/\/[^\n]*|^\{\/\*[\s\S]*?\*\/\}/, "comment"],
  [/^"(?:[^"\\]|\\.)*"|^'(?:[^'\\]|\\.)*'|^`(?:[^`\\]|\\.)*`/, "string"],
  [/^<\/?[A-Za-z][\w.]*|^\/?>/, "tag"],
  [/^[A-Za-z_$][\w$]*(?==)/, "attr"],
  [/^\d+(?:\.\d+)?/, "number"],
  [/^[A-Za-z_$][\w$]*/, "plain"],
  [/^[{}()[\].,;:=<>|&!?+\-*/]/, "punct"],
  [/^\s+|^./, "plain"],
];

const color: Record<Kind, string> = {
  comment: "text-code-comment italic",
  string: "text-code-string",
  keyword: "text-code-keyword",
  tag: "text-code-tag",
  attr: "text-code-attr",
  number: "text-code-number",
  punct: "text-code-punct",
  plain: "",
};

export function tokenize(src: string): [Kind, string][] {
  const out: [Kind, string][] = [];
  let rest = src;
  while (rest) {
    for (const [re, kind] of RULES) {
      const m = re.exec(rest);
      if (!m) continue;
      const text = m[0];
      out.push([kind === "plain" && KEYWORDS.has(text) ? "keyword" : kind, text]);
      rest = rest.slice(text.length);
      break;
    }
  }
  return out;
}

export function Highlight({ code }: { code: string }) {
  return (
    <>
      {tokenize(code).map(([kind, text], i) =>
        color[kind] ? (
          <span key={i} className={color[kind]}>
            {text}
          </span>
        ) : (
          <React.Fragment key={i}>{text}</React.Fragment>
        ),
      )}
    </>
  );
}
