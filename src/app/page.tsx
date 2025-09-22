"use client";

import React, { Suspense, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import { AppSidebar } from "@/components/AppSidebar";
// import { UploadArea } from "@/components/upload-area";
import { HeroSection } from "@/components/hero-section";
import { QuestionSuggestionCard } from "@/components/question-suggestion-card";
import { extractCsvData } from "@/lib/csvUtils";
import { createChat } from "@/lib/chat-store";
import { PromptInput } from "@/components/PromptInput";
import { toast } from "sonner";
import { useLLMModel } from "@/hooks/useLLMModel";
import { redirect } from "next/navigation";
import { UploadCsvDialog } from "@/components/UploadCsvDialog";
import Loading from "./chat/[id]/loading";
import { saveCsvToDB } from "@/lib/indexedDb";

export interface SuggestedQuestion {
  id: string;
  text: string;
}

function AskableClient({
  setIsLoading,
  onUploadSuccess,
  heroHidden = false,
}: {
  setIsLoading: (load: boolean) => void;
  onUploadSuccess?: () => void;
  heroHidden?: boolean;
}) {
  const { selectedModelSlug } = useLLMModel();
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState<
    "idle" | "reading" | "saving" | "generating" | "done"
  >("idle");
  const [suggestedQuestions, setSuggestedQuestions] = useState<
    SuggestedQuestion[]
  >([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<{ [key: string]: string }[]>([]);
  const [datasetId, setDatasetId] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (file: File | null) => {
    if (!file) return;

    setLocalFile(file);
    setIsProcessing(true);
    setUploadStep("reading");

    try {
      const { headers, sampleRows } = await extractCsvData(file);

      if (headers.length === 0 || sampleRows.length === 0) {
        alert("Please upload a CSV with headers.");
        setLocalFile(null);
        setIsProcessing(false);
        setUploadStep("idle");
        return;
      }

      setCsvRows(sampleRows);
      setCsvHeaders(headers);
      setUploadStep("saving");

      const newId = `csv-${Date.now()}`;
      await saveCsvToDB({
        id: newId,
        headers,
        rows: sampleRows, // Note: only storing sample rows for now as per original logic
        fileName: file.name,
      });

  setDatasetId(newId);
  toast.success("CSV saved locally. Ask a question →");
  setUploadOpen(false);
  // Hide hero section once upload is saved successfully, mirroring dialog close
  onUploadSuccess?.();

      setUploadStep("generating");
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ columns: headers }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSuggestedQuestions(data.questions);

      setUploadStep("done");
    } catch (error: any) {
      console.error("Failed to process CSV file:", error);
      toast.error("Failed to save/process CSV: " + (error?.message ?? "unknown error"));
      setUploadStep("idle");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Open dialog when clicking the hero "Upload CSV" button (#upload hash)
  React.useEffect(() => {
    const openIfUploadHash = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash === "#upload") {
        setUploadOpen(true);
        // remove the hash without reloading
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };
    openIfUploadHash();
    window.addEventListener("hashchange", openIfUploadHash);
    // Also capture any direct clicks on anchors to #upload to open the dialog immediately
    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Traverse up to find an anchor element
      const anchor = target.closest('a[href="#upload"]') as HTMLAnchorElement | null;
      if (anchor) {
        e.preventDefault();
        setUploadOpen(true);
        // Clean the hash if the browser applied it
        if (typeof window !== "undefined") {
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    };
    document.addEventListener("click", clickHandler, true);
    return () => window.removeEventListener("hashchange", openIfUploadHash);
  }, []);

  const handleSuggestionClick = (question: string) => {
    handleSendMessage(question);
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    if (!datasetId) {
      toast.warning("Please upload a CSV file first.");
      return;
    }

    if (csvHeaders.length === 0) {
      toast.warning("Please upload a CSV with headers.");
      return;
    }

    if (csvRows.length === 0) {
      toast.warning("Please upload a CSV with data.");
      return;
    }

    localStorage.setItem("pendingMessage", text);

    setIsLoading(true);

    if (!localFile) {
      toast.warning("Cannot find file details.");
      return;
    }

    const id = await createChat({
      userQuestion: text, // it's not stored in db here just used for chat title!
      csvHeaders: csvHeaders,
      datasetId: datasetId,
      csvRows: csvRows,
      fileName: localFile.name,
    });
    // Persist chat id and basic metadata locally for history (works without DB)
    try {
      const key = "visitedChatIds";
      const metaKey = (id: string) => `chatMeta:${id}`;
      const now = new Date().toISOString();
      const title = text.slice(0, 50);
      const raw = localStorage.getItem(key);
      let ids: string[] = [];
      try { ids = JSON.parse(raw || "[]"); } catch {}
      // add to front, ensure uniqueness
      ids = [id, ...ids.filter((x) => x !== id)].slice(0, 50);
      localStorage.setItem(key, JSON.stringify(ids));
      localStorage.setItem(
        metaKey(id),
        JSON.stringify({ id, title, createdAt: now, fileName: localFile.name, modelSlug: selectedModelSlug })
      );
    } catch {}
    // Pass datasetId via query so the chat page can reconstruct from IndexedDB when DB is unavailable
    redirect(`/chat/${id}?model=${selectedModelSlug}&datasetId=${encodeURIComponent(datasetId)}`);
  };

  return (
    <>
      <UploadCsvDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onFileSelected={handleFileUpload}
        loading={isProcessing}
        fileName={localFile?.name ?? null}
        fileSize={localFile?.size ?? null}
        step={uploadStep}
        headers={csvHeaders}
        sampleRows={csvRows}
      />
      {/* Large Input Area */}
  {localFile && (
    <div className={cn(
            "w-full max-w-screen-lg lg:max-w-screen-xl mx-auto flex justify-center",
            heroHidden ? "mt-6 md:mt-8" : ""
          )}>
          <PromptInput
            value={inputValue}
            onChange={setInputValue}
            onSend={() => {
              handleSendMessage(inputValue);
            }}
            uploadedFile={{
              name: localFile.name,
              csvHeaders: csvHeaders,
              csvRows: csvRows,
            }}
            textAreaClassName="h-[120px] md:h-[140px]"
            isLLMAnswering={false}
            onStopLLM={() => {}}
          />
        </div>
      )}
      {/* Processing State */}
      {isProcessing && (
        <div className="w-full max-w-sm my-8 md:max-w-3xl mx-auto text-center">
          <p className="text-muted-foreground text-sm mb-4 animate-pulse">
            <span className="font-medium">Generating suggestions</span>{" "}
            <span className="text-muted-foreground">...</span>
          </p>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, idx: number) => (
              <QuestionSuggestionCard key={`loading-${idx}`} question={""} isLoading />
            ))}
          </div>
        </div>
      )}
      {/* Suggestions */}
      {suggestedQuestions.length > 0 && !isProcessing && (
        <div className="w-full max-w-screen-lg lg:max-w-screen-xl my-10 mx-auto text-center">
          <p className="text-muted-foreground text-sm mb-4 md:mb-5">
            <span className="font-medium">Suggestions</span>{" "}
            <span className="text-muted-foreground">based on your uploaded CSV:</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 justify-items-stretch">
            {suggestedQuestions.map((suggestion: SuggestedQuestion) => (
              <QuestionSuggestionCard
                key={suggestion.id}
                question={suggestion.text}
                onClick={() => handleSuggestionClick(suggestion.text)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function Askable() {
  const [isLoading, setIsLoading] = useState(false);
  const [hideHero, setHideHero] = useState(false);

  if (isLoading) {
    return <Loading />;
  }

  return (
  <div className="flex flex-col md:flex-row bg-background w-full flex-1 min-h-[100svh] md:h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1">
        <div className="p-2 md:p-10 rounded-tl-2xl border border-border bg-card flex flex-col gap-2 flex-1 w-full h-full max-w-screen-2xl mx-auto">
          {!hideHero ? (
            <div className="flex flex-col items-center md:items-start pt-16 md:pt-[132px] pb-8 mx-auto w-full">
              <HeroSection />
            </div>
          ) : (
            <div className="w-full px-4">
              <div className="w-full max-w-screen-xl mx-auto flex flex-col items-center text-center gap-6 pt-8 md:pt-10">
                <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
                  What can I analyze for you?
                </h1>
              </div>
            </div>
          )}
          <Suspense fallback={<div>Loading...</div>}>
            <AskableClient
              setIsLoading={setIsLoading}
              onUploadSuccess={() => setHideHero(true)}
              heroHidden={hideHero}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
