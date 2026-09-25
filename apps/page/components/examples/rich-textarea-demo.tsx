"use client";

import * as React from "react";
import { defineInputField, RichTextarea } from "@/registry/base-nova/ui/rich/editor";

const ref = defineInputField("ref", {
  pattern: /\{\{([\w.]+)\}\}/,
  className: "rounded-sm bg-primary/12 px-1 font-mono text-[0.8em] text-primary",
  render: ({ groups }) => <>{groups[0]}</>,
});

const issue = defineInputField("issue", {
  pattern: /#(\d+)/,
  editable: true,
  className: "rounded-sm bg-muted px-1 text-muted-foreground",
  render: ({ groups }) => <>#{groups[0]}</>,
});

export function RichTextareaDemo() {
  const [value, setValue] = React.useState(
    "The run for {{trigger.customer}} finished.\nFiled as #1354.",
  );
  return (
    <RichTextarea
      aria-label="Rich textarea"
      components={[ref, issue]}
      value={value}
      onValueChange={setValue}
      placeholder="Write something"
    />
  );
}
