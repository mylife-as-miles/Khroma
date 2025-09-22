"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { ModelDropdown } from "./ModelDropdown";
import { useLLMModel } from "@/hooks/useLLMModel";
import { useEffect, useRef } from "react";
import { cn, UploadedFile } from "@/lib/utils";
import { DropdownFileActions } from "./DropdownFileActions";

export function PromptInput({
  isLLMAnswering,
  onStopLLM,
  textAreaClassName,
  value,
  onChange,
  onSend,
  uploadedFile,
  placeholder = "Ask anything...",
}: {
  isLLMAnswering: boolean;
  onStopLLM: () => void;
  textAreaClassName?: string;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  uploadedFile?: UploadedFile;
  placeholder?: string;
}) {
  const { selectedModelSlug, setModel, models } = useLLMModel();
  // Autofocus logic
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData("text");
    onChange(pastedText.trim());
    e.preventDefault(); // Prevent default paste behavior
  };

  return (
    <div className="relative border border-border/80 bg-card/80 supports-[backdrop-filter]:bg-card/60 backdrop-blur rounded-xl p-4 md:p-5 shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring focus-within:border-transparent">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full resize-none text-base md:text-[1.05rem] leading-6 md:leading-7 placeholder:text-muted-foreground/70 focus:outline-none bg-transparent text-foreground min-h-[52px] md:min-h-[64px] max-h-[40svh]",
          textAreaClassName
        )}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />

      <div className="flex flex-row flex-wrap items-center justify-between gap-2 sm:gap-3 mt-3 min-w-0">
        <ModelDropdown
          models={models}
          value={selectedModelSlug}
          onChange={setModel}
        />

        <div className="flex flex-row gap-2 items-center min-w-0">
          {uploadedFile && (
            <div
              className="flex flex-row items-center justify-center min-w-0 relative overflow-hidden gap-1.5 pl-2 pr-1 py-1.5 rounded-md bg-muted border border-border md:pl-3 md:pr-2 hover:border-ring transition-colors"
              style={{ boxShadow: "0px 1px 7px -3px rgba(0,0,0,0.25)" }}
            >
              <img src="/uploaded-file.svg" alt="" className="w-4 h-4" />
              <div className="flex justify-center items-center  relative gap-1.5">
                <div className="flex flex-col justify-start items-start  relative gap-1">
                  <p
                    className="max-w-[40vw] sm:max-w-[200px] text-xs font-medium text-left text-foreground truncate"
                    title={uploadedFile.name || ""}
                  >
                    {uploadedFile.name}
                  </p>
                </div>
              </div>
              <DropdownFileActions uploadedFile={uploadedFile} />
            </div>
          )}

          {isLLMAnswering ? (
            <Button
              onClick={onStopLLM}
              size="sm"
              className="p-0 bg-foreground text-background disabled:opacity-50 hover:opacity-90 size-[32px] md:size-[36px] flex items-center justify-center cursor-pointer rounded-md shadow-sm"
            >
              <img src="/stop.svg" className="size-3.5" />
            </Button>
          ) : (
            <Button
              onClick={onSend}
              disabled={!value.trim()}
              size="sm"
              className="p-0 bg-foreground text-background disabled:opacity-50 hover:opacity-90 size-[32px] md:size-[36px] flex items-center justify-center cursor-pointer rounded-md shadow-sm"
            >
              <img src="/send.svg" className="size-3 min-w-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] md:text-xs text-muted-foreground/80">
        <span>Press Enter to send • Shift+Enter for new line</span>
        <span>{value.trim().length} chars</span>
      </div>
    </div>
  );
}
