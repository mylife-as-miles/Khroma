"use client";
import React from "react";
import {
  Code,
  CodeBlock,
  CodeHeader,
} from "@/components/animate-ui/components/animate/code";
import { File } from "lucide-react";

export function CodePane({
  code,
  lang = "python",
  fileLabel = "analysis.py",
  animate = true,
  duration = 8,
  delay = 0.2,
}: {
  code: string;
  lang?: string;
  fileLabel?: string;
  animate?: boolean;
  duration?: number;
  delay?: number;
}) {
  return (
    <div className="mt-3">
      <Code
        key={`${duration}-${delay}-${animate}-${code?.length}`}
        className="w-full md:w-[620px] h-[320px] md:h-[420px]"
        code={code}
      >
        <CodeHeader icon={File} copyButton>
          {fileLabel}
        </CodeHeader>
        <CodeBlock
          cursor={animate}
          lang={lang}
          writing={animate}
          duration={duration}
          delay={delay}
        />
      </Code>
    </div>
  );
}
