"use client";

import type React from "react";
import { useUserLimits } from "@/hooks/UserLimitsContext";
import { PromptInput } from "./PromptInput";
import { UploadedFile } from "@/lib/utils";

export function ChatInput({
  isLLMAnswering,
  value,
  onChange,
  onSend,
  uploadedFile,
  onStopLLM,
  placeholder = "Ask anything...",
}: {
  isLLMAnswering: boolean;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStopLLM: () => void;
  uploadedFile?: UploadedFile;
  placeholder?: string;
}) {
  const { refetch } = useUserLimits();

  const handleSendMessage = async () => {
    if (value.trim() === "") return;
    onSend();
    setTimeout(() => {
      refetch();
    }, 1000);
  };

  return (
    <>
  <div className="h-[130px] w-full md:hidden" />
  <div className="w-full max-w-screen-lg lg:max-w-screen-xl mx-auto fixed inset-x-0 bottom-0 bg-card md:relative pb-4 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))] px-3 sm:px-4 border-t border-border z-40 md:px-0 md:border-t-0 md:z-auto min-w-0">
        <PromptInput
          isLLMAnswering={isLLMAnswering}
          value={value}
          onChange={onChange}
          onSend={handleSendMessage}
          uploadedFile={uploadedFile}
          placeholder={placeholder}
          onStopLLM={onStopLLM}
        />
      </div>
    </>
  );
}
