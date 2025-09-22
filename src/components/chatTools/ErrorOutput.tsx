import React, { useState } from "react";
import { CodeRender } from "../code-render";

interface ErrorOutputProps {
  data: string;
}

export const ErrorOutput: React.FC<ErrorOutputProps> = ({ data }) => {
  const [expanded, setExpanded] = useState(false);
  const lines = data.split("\n");
  const isLong = lines.length > 10;
  const preview = lines.slice(0, 10).join("\n");

  return (
    <div className="mt-4 rounded-lg overflow-hidden border border-red-700 bg-[#2d1e1e] relative">
      <h3 className="text-red-300 text-xs font-semibold px-4 py-2 border-b border-red-700">
        Error during Code Execution
      </h3>
      <CodeRender
        code={expanded || !isLong ? data : preview}
        language="bash"
        theme="dark"
      />
      {isLong && (
        <button
          className="absolute left-0 right-0 bottom-0 bg-[#2d1e1e] bg-opacity-90 text-red-300 text-xs font-semibold py-2 hover:bg-red-900 transition-colors border-t border-red-700"
          style={{ borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Show less" : `Show ${lines.length - 10} more lines`}
        </button>
      )}
    </div>
  );
};
