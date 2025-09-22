"use client";

import React from "react";
import {
  Prism as SyntaxHighlighter,
  createElement,
} from "react-syntax-highlighter";
import { prism, dark } from "react-syntax-highlighter/dist/esm/styles/prism";

export function CodeRender({
  code,
  language,
  theme = "dark",
}: {
  code: string;
  language: string;
  theme?: "light" | "dark";
}) {
  const selectedTheme = theme === "dark" ? dark : prism;

  return (
    <div className="rounded-lg overflow-hidden my-4">
      <SyntaxHighlighter
        language={language}
        style={selectedTheme}
        customStyle={{
          padding: "16px",
          borderRadius: "8px",
          backgroundColor: theme === "dark" ? "#1e1e1e" : "#f3f3f3", // VS Code like background
          color: theme === "dark" ? "#d4d4d4" : "#333333", // VS Code like text color
          border: "1px solid " + (theme === "dark" ? "#333333" : "#e0e0e0"),
          overflowX: "auto",
          fontSize: "12px",
        }}
        showLineNumbers={language === "python"}
        lineProps={{ style: { flexWrap: "wrap" } }}
        renderer={({ rows, stylesheet, useInlineStyles }) => {
          return rows.map((row, index) => {
            const children = row.children;
            const lineNumberElement = children?.shift();
            if (lineNumberElement) {
              row.children = [
                lineNumberElement,
                {
                  children,
                  properties: {
                    className: [],
                    style: { whiteSpace: "pre-wrap", wordBreak: "break-all" },
                  },
                  tagName: "span",
                  type: "element",
                },
              ];
            }
            return createElement({
              node: row,
              stylesheet,
              useInlineStyles,
              key: index,
            });
          });
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
