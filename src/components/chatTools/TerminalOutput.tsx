import React from "react";
import { CodeRender } from "../code-render";

interface TerminalOutputProps {
  data: string;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({ data }) => (
  <div className="mt-4 rounded-lg overflow-hidden border border-slate-700 bg-[#1e1e1e]">
    <h3 className="text-slate-200 text-xs font-semibold px-4 py-2 border-b border-slate-700">
      Bash Output (stdout):
    </h3>
    <CodeRender code={data} language="bash" theme="dark" />
  </div>
);
