"use client";

import * as React from "react";
import { defineInputField, RichTextarea } from "@/registry/base-nova/ui/rich/editor";

/**
 * Both @ signs: a Japanese IME types the full width one (U+FF20) and a US
 * keyboard types U+0040. The same character to a reader, two code points to a
 * regex, and which ones count is the host's call.
 */
const user = defineInputField("user", {
  pattern: /[@＠]([\w-]+)/,
  className: "font-medium text-foreground",
  render: ({ groups }) => <span>{groups[0]}</span>,
});

export function RichComposedDemo() {
  const [value, setValue] = React.useState("おはようございます、@sam さん。");
  return (
    <RichTextarea
      aria-label="Composed input"
      components={[user]}
      value={value}
      onValueChange={setValue}
      placeholder="かな入力でどうぞ"
    />
  );
}
