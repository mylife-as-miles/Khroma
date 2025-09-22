import { Fragment, useEffect, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

type ReasoningUIPart = {
  type: "reasoning";
  /**
   * The reasoning text.
   */
  reasoning: string;
  details: Array<
    | {
        type: "text";
        text: string;
        signature?: string;
      }
    | {
        type: "redacted";
        data: string;
      }
  >;
};

export default function ReasoningAccordion({
  reasoning,
  isReasoningOver = false,
}: {
  reasoning?: ReasoningUIPart;
  isReasoningOver?: boolean;
}) {
  const [open, setOpen] = useState<string | undefined>("reasoning");

  useEffect(() => {
    if (isReasoningOver) {
      setOpen(undefined);
    }
  }, [isReasoningOver]);

  if (!reasoning?.details?.length) return null;
  return (
    <div className="my-4">
      <Accordion
        type="single"
        collapsible
        className="w-full"
        value={open}
        onValueChange={setOpen}
      >
        <AccordionItem value="reasoning">
          <AccordionTrigger className="max-w-[220px] inline-flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-800/50 w-full !no-underline">
            <span>Thought for a few seconds...</span>
          </AccordionTrigger>
          <AccordionContent
            className="overflow-hidden whitespace-pre-wrap border-l-2 pl-3 text-xs font-medium leading-5 border-gray-200 text-gray-400 dark:border-slate-800 dark:text-slate-400 -my-4"
            style={{ padding: "0.5em 0.5em 0.5em 0" }}
          >
            {reasoning.details.map((detail: any, idx: number) => {
              if (detail.type === "redacted") {
                return <Fragment key={idx}>&lt;redacted&gt;</Fragment>;
              }
              return <Fragment key={idx}>{detail.text}</Fragment>;
            })}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
