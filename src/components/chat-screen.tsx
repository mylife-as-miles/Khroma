"use client";

import { useChat } from "@ai-sdk/react";
import React, { useEffect, useState, useRef } from "react";
import { Header } from "@/components/header";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatInput } from "@/components/ChatInput";
import { MemoizedMarkdown } from "./MemoizedMarkdown";
import { CodePane } from "./chatTools/CodePane";
import { runPython, type RunPythonResult } from "@/lib/coding";
import { type UIMessage } from "ai";
import { TerminalOutput } from "./chatTools/TerminalOutput";
import { getCsvFromDB } from "@/lib/indexedDb";
import { ErrorOutput } from "./chatTools/ErrorOutput";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { useDraftedInput } from "../hooks/useDraftedInput";
import { DbMessage } from "@/lib/chat-store";
import {
  cn,
  extractCodeFromText,
  formatLLMTimestamp,
  UploadedFile,
} from "@/lib/utils";
import { ErrorBanner } from "./ui/ErrorBanner";
import { ThinkingIndicator } from "./ui/ThinkingIndicator";
import ReasoningAccordion from "./ReasoningAccordion";
import { useLLMModel } from "@/hooks/useLLMModel";
import { CodeRunning } from "./chatTools/CodeRunning";
import { CHAT_MODELS } from "@/lib/models";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type Message = UIMessage & {
  isThinking?: boolean;
  isUser?: boolean;
  toolCall?: {
    toolInvocation: {
      toolName: string;
      args: string;
      state: string;
      result?: any;
    };
  };
  duration?: number; // Duration in seconds for LLM/coding
  model?: string; // Model used for the message
  isAutoErrorResolution?: boolean; // Added for auto error resolution prompt
};

export function ChatScreen({
  uploadedFile,
  id,
  initialMessages,
}: {
  uploadedFile: UploadedFile;
  id?: string;
  initialMessages?: DbMessage[];
}) {
  const router = useRouter();
  const { selectedModelSlug } = useLLMModel();

  const modelContextLength = CHAT_MODELS.find(
    (model) => model.slug === selectedModelSlug
  )?.contextLength;

  const { messages, setMessages, append, stop, status } = useChat({
    id, // use the provided chat ID
    initialMessages: initialMessages || [], // initial messages if provided
    sendExtraMessageFields: true, // send id and createdAt for each message
    experimental_prepareRequestBody({ messages, id }) {
      return {
        message: messages[messages.length - 1].content,
        id,
        model: selectedModelSlug,
        chatData: {
          datasetId: uploadedFile?.datasetId,
          csvHeaders: uploadedFile?.csvHeaders,
          csvRows: uploadedFile?.csvRows,
        },
      };
    },
    async onResponse(res) {
      // Surface backend errors to the user
      if (!res.ok) {
        try {
          const data = await res.clone().json();
          toast.error(
            (data as any)?.error || (data as any)?.message || `Chat error: ${res.status}`
          );
        } catch {
          toast.error(`Chat error: ${res.status}`);
        }
      }
    },
    onError(e) {
      toast.error((e as any)?.message || "Chat request failed");
    },
    onFinish: async (message) => {
      // Only execute if a Python fenced block is present
      const pyMatch = /```python\s*([\s\S]*?)\s*```/m.exec(
        message.content || ""
      );
      const code = pyMatch?.[1];
      if (!code) return;

      // Add a "tool-invocation" message with a "start" state
      setMessages((prev) => [
        ...prev,
        {
          id: message.id + "_tool_call",
          role: "assistant",
          content: "",
          isThinking: true,
          toolCall: {
            toolInvocation: {
              toolName: "runCode",
              args: code,
              state: "start",
            },
          },
        },
      ]);

      setIsCodeRunning(true);
      let result: RunPythonResult;
      try {
        // Reconstruct the file from IndexedDB
        if (!uploadedFile.datasetId) {
          throw new Error("No dataset ID found.");
        }
        const csvData = await getCsvFromDB(uploadedFile.datasetId);
        if (!csvData) {
          throw new Error("Could not find file data in local storage.");
        }
        const header = csvData.headers.join(",") + "\\n";
        const body = csvData.rows
          .map((row) => csvData.headers.map((h) => row[h] ?? "").join(","))
          .join("\\n");
        const csvString = header + body;
        const file = new File([csvString], csvData.fileName || "data.csv", {
          type: "text/csv",
        });

        // Run the code client-side
        result = await runPython(code, [file]);
      } catch (error: any) {
        result = {
          status: "error",
          outputs: [],
          error_message: error?.message || "Unknown error",
        } as RunPythonResult;
      }

      const errorOccurred = result.status === "error";
      const errorMessage = result.error_message || "";

      if (errorOccurred) {
        // Send error back to AI for resolution
        const errorResolutionPrompt = `The following error occurred when running the code you provided: ${errorMessage}. Please try to fix the code and try again.`;
        setTimeout(() => {
          append(
            { role: "user", content: errorResolutionPrompt },
            { headers: { "X-Auto-Error-Resolved": "true" } }
          );
        }, 1000);
      }

      // Update the tool call message with the "result" state
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === message.id + "_tool_call") {
            return {
              ...msg,
              isThinking: false,
              content: errorOccurred
                ? "Code execution failed."
                : "Code execution complete.",
              toolCall: {
                toolInvocation: {
                  toolName: "runCode",
                  args: code,
                  state: "result",
                  result: result,
                },
              },
            };
          }
          return msg;
        })
      );
      setIsCodeRunning(false);
    },
  });

  // On mount, check for pendingMessage in localStorage and append it if present
  const didAppendPending = React.useRef(false);
  useEffect(() => {
    if (
      !didAppendPending.current &&
      messages.length === 0 &&
      typeof window !== "undefined"
    ) {
      const pending = localStorage.getItem("pendingMessage");
      if (pending) {
        append({
          role: "user",
          content: pending,
        });
        localStorage.removeItem("pendingMessage");
        didAppendPending.current = true;
      }
    }
  }, [append, messages.length]);

  // Use a unique key for each chat window's draft input
  const [inputValue, setInputValue, clearInputValue] = useDraftedInput(
    id ? `chatInputDraft-${id}` : "chatInputDraft"
  );

  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const codeAbortController = useRef<AbortController | null>(null);
  const { messagesContainerRef, messagesEndRef, isUserAtBottom } =
    useAutoScroll({ status, isCodeRunning });

  // Token counting logic (approximate: 1 token ≈ 4 chars)
  const [tokenInfo, setTokenInfo] = useState({
    tokens: 0,
    percent: 0,
    max: modelContextLength || 0,
  });

  useEffect(() => {
    if (!modelContextLength) return;
    // Only count user/assistant messages (not tool calls)
    const text = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => m.content)
      .join("\n");
    // Approximate token count: 1 token ≈ 3 chars
    const approxTokens = Math.ceil(text.length / 3);
    const percent = Math.min(100, (approxTokens / modelContextLength) * 100);
    setTokenInfo({ tokens: approxTokens, percent, max: modelContextLength });
  }, [messages, modelContextLength]);

  return (
  <div className="flex flex-col md:flex-row bg-background w-full flex-1 min-h-[100svh] md:h-screen overflow-hidden">
      <AppSidebar chatId={id} />
      <div className="flex flex-1">
        <div className="p-2 md:p-10 rounded-tl-2xl border border-border bg-card flex flex-col gap-2 flex-1 w-full h-full max-w-screen-2xl mx-auto">
          {/* Context usage bar */}
          <div className="w-full flex flex-col items-center py-2">
            <div className="w-full max-w-screen-lg lg:max-w-screen-xl px-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Context used</span>
                <span>
                  {tokenInfo.tokens} / {tokenInfo.max} tokens (
                  {tokenInfo.percent.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded">
                <div
                  className="h-2 bg-foreground rounded"
                  style={{ width: `${tokenInfo.percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 gap-4 flex flex-col mx-auto w-full max-w-screen-lg lg:max-w-screen-xl"
            ref={messagesContainerRef}
          >
          {messages.map((message, messageIdx) => {
            const currentMessage = message as Message; // Cast to our custom Message interface

            const codeResults =
              currentMessage.toolCall?.toolInvocation.toolName === "runCode"
                ? (currentMessage.toolCall?.toolInvocation.result as RunPythonResult)
                : undefined;

            const stdOut =
              codeResults?.status === "success" && codeResults.outputs.length > 0
                ? codeResults.outputs[0]
                : undefined;

            const errorCode =
              codeResults?.status === "error"
                ? {
                    type: "error",
                    data: codeResults.error_message || "Unknown error",
                  }
                : undefined;

            const isThisLastMessage = messages.length - 1 === messageIdx;

            const isUserMessage = currentMessage.role === "user";

            const reasoning = currentMessage.parts.find(
              (part) => part.type === "reasoning"
            );

            return (
              <div
                key={currentMessage.id}
                className={cn(
                  "flex justify-end flex-col",
                  isUserMessage ? "items-end" : "items-start"
                )}
              >
                {isUserMessage ? (
                  <>
                    {currentMessage.content.startsWith(
                      "The following error occurred when running the code you provided:"
                    ) ? (
                      <ErrorBanner isWaiting={isThisLastMessage} />
                    ) : (
                      <div
                        className="flex justify-end items-center relative overflow-hidden gap-2.5 px-3 py-2 rounded bg-muted border border-border max-w-[240px] md:max-w-[50%]"
                        style={{
                          boxShadow: "0px 0px 7px -5px rgba(0,0,0,0.25)",
                        }}
                      >
                        <p className="text-sm text-left text-foreground">
                          {currentMessage.content}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full">
                    <ReasoningAccordion
                      reasoning={reasoning}
                      isReasoningOver={
                        !!currentMessage.content &&
                        currentMessage.content.length > 0
                      }
                    />

                    {/* Render animated code pane for Python blocks, plus normal markdown below */}
                    {(() => {
                      const content = currentMessage.content || "";
                      // Prefer python fenced blocks, else any fenced block
                      const pyMatch = /```python\s*([\s\S]*?)\s*```/m.exec(content);
                      const anyMatch = pyMatch ? null : /```([a-zA-Z0-9_-]*)\s*([\s\S]*?)\s*```/m.exec(content);
                      const code = pyMatch?.[1] ?? anyMatch?.[2];
                      const lang = pyMatch ? "python" : (anyMatch?.[1] || "text");
                      if (!code) return null;
                      return <CodePane code={code} lang={lang} fileLabel={lang === "python" ? "analysis.py" : `snippet.${lang}`} />;
                    })()}

                    {(() => {
                      // If we showed a CodePane already, strip the first fenced code block from markdown to avoid duplicate preview
                      const content = currentMessage.content || "";
                      const showedPython = /```python\s*[\s\S]*?\s*```/m.test(content);
                      const showedAny = showedPython || /```[a-zA-Z0-9_-]*\s*[\s\S]*?\s*```/m.test(content);
                      let markdown = content;
                      if (showedAny) {
                        markdown = content.replace(/```[a-zA-Z0-9_-]*\s*[\s\S]*?\s*```/m, "");
                      }
                      return (
                        <div className="text-foreground text-sm prose mt-3">
                          <MemoizedMarkdown id={currentMessage.id} content={markdown} />
                        </div>
                      );
                    })()}

                    {currentMessage.isThinking && <CodeRunning />}

                    {currentMessage.toolCall?.toolInvocation.state ===
                      "result" && (
                      <div className="text-foreground text-sm leading-relaxed">
                        {errorCode && <ErrorOutput data={errorCode.data} />}
                        {stdOut && <TerminalOutput data={stdOut.data} />}
                      </div>
                    )}
                    {/* Timestamp for assistant messages */}
                    {currentMessage.role === "assistant" &&
                      currentMessage.createdAt && (
                        <div className="flex justify-start mt-3">
                          <span className="text-xs text-muted-foreground">
                            {typeof currentMessage.duration === "number" && (
                              <>
                                <span className="mr-0.5">
                                  {currentMessage.duration.toFixed(2)}s -
                                </span>
                              </>
                            )}
                            {formatLLMTimestamp(currentMessage.createdAt)}{" "}
                            {currentMessage?.model && (
                              <>
                                <span className="mr-0.5">
                                  -{" "}
                                  {
                                    CHAT_MODELS.find(
                                      (model) =>
                                        model.model === currentMessage.model
                                    )?.title
                                  }
                                </span>
                              </>
                            )}
                          </span>
                        </div>
                      )}
                  </div>
                )}

                {isThisLastMessage && status === "submitted" && (
                  <ThinkingIndicator />
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          value={inputValue}
          onChange={(value) => setInputValue(value)}
          onSend={async () => {
            // Clear input and localStorage immediately on submit
            const newMessage = inputValue;
            clearInputValue();
            await append({
              role: "user",
              content: newMessage,
            });
          }}
          uploadedFile={uploadedFile}
          onStopLLM={() => {
            if (status === "submitted" || status === "streaming") {
              return stop();
            }
            if (isCodeRunning && codeAbortController.current) {
              codeAbortController.current.abort();
              console.log("Aborted code execution frontend");
              setIsCodeRunning(false);
            }
          }}
          isLLMAnswering={
            status === "submitted" || status === "streaming" || isCodeRunning
          }
        />
        </div>
      </div>
    </div>
  );
}
