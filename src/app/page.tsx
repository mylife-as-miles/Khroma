"use client";

import React, { Suspense, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/AppSidebar";
import { HeroSection } from "@/components/hero-section";
import { createChat } from "@/lib/chat-store";
import { PromptInput } from "@/components/PromptInput";
import { toast } from "sonner";
import { useLLMModel } from "@/hooks/useLLMModel";
import { redirect } from "next/navigation";
import { UploadCsvDialog } from "@/components/UploadCsvDialog";
import Loading from "./chat/[id]/loading";

// SuggestedQuestion is no longer needed as the backend handles processing.

function KhromaClient({
  setIsLoading,
  onUploadSuccess,
  heroHidden = false,
}: {
  setIsLoading: (load: boolean) => void;
  onUploadSuccess?: () => void;
  heroHidden?: boolean;
}) {
  const { selectedModelSlug } = useLLMModel();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState<"idle" | "reading" | "saving" | "generating" | "done">("idle");
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  // The concept of a client-side datasetId from IndexedDB is no longer the primary way.
  // We can consider the dataset to be "live" after a successful upload.
  const [isDatasetReady, setIsDatasetReady] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);

  const handleFileUpload = useCallback(async (csv: File, images: File[]) => {
    if (!csv || images.length === 0) return;

    setCsvFile(csv);
    setImageFiles(images);
    setIsProcessing(true);
    setUploadStep("reading"); // "reading" can now mean "uploading"

    const formData = new FormData();
    formData.append('csv', csv);
    images.forEach(image => {
        formData.append('images', image);
    });

    try {
      setUploadStep("saving"); // "saving" can now mean "processing on backend"
      const response = await fetch("/api/process-data", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      setCsvHeaders(result.headers || []);
      setUploadStep("done");
      toast.success(result.message || "Data processed successfully!");
      setIsDatasetReady(true);
      setUploadOpen(false);
      onUploadSuccess?.(); // Hides the hero section

    } catch (error: any) {
      console.error("Failed to process files:", error);
      toast.error("Failed to process files: " + (error?.message ?? "unknown error"));
      setUploadStep("idle");
    } finally {
      setIsProcessing(false);
    }
  }, [onUploadSuccess]);

  // Open dialog when clicking the hero "Upload CSV" button (#upload hash)
  React.useEffect(() => {
    const openIfUploadHash = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash === "#upload") {
        setUploadOpen(true);
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };
    openIfUploadHash();
    window.addEventListener("hashchange", openIfUploadHash);
    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest('a[href="#upload"]') as HTMLAnchorElement | null;
      if (anchor) {
        e.preventDefault();
        setUploadOpen(true);
        if (typeof window !== "undefined") {
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    };
    document.addEventListener("click", clickHandler, true);
    return () => window.removeEventListener("hashchange", openIfUploadHash);
  }, []);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    if (!isDatasetReady) {
      toast.warning("Please upload your product data first.");
      return;
    }

    localStorage.setItem("pendingMessage", text);
    setIsLoading(true);

    // The chat creation logic is now simpler.
    // It doesn't need to know about the CSV content, as the backend has it.
    const id = await createChat({
      userQuestion: text,
      fileName: csvFile?.name || "Product Data",
      csvHeaders: csvHeaders,
    });

    // Persist chat id locally for history
    try {
      const key = "visitedChatIds";
      const metaKey = (id: string) => `chatMeta:${id}`;
      const now = new Date().toISOString();
      const title = text.slice(0, 50);
      const raw = localStorage.getItem(key);
      let ids: string[] = [];
      try { ids = JSON.parse(raw || "[]"); } catch {}
      ids = [id, ...ids.filter((x) => x !== id)].slice(0, 50);
      localStorage.setItem(key, JSON.stringify(ids));
      localStorage.setItem(
        metaKey(id),
        JSON.stringify({ id, title, createdAt: now, fileName: csvFile?.name || "Product Data", modelSlug: selectedModelSlug })
      );
    } catch {}

    // The chat page no longer needs datasetId from the client,
    // as the backend will handle the context.
    redirect(`/chat/${id}?model=${selectedModelSlug}`);
  };

  return (
    <>
      <UploadCsvDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onFileSelected={handleFileUpload}
        loading={isProcessing}
        fileName={csvFile?.name ?? null}
        fileSize={csvFile?.size ?? null}
        imageFileCount={imageFiles.length}
        step={uploadStep}
        // We no longer show a client-side preview, so headers/rows are not needed.
        headers={[]}
        sampleRows={[]}
      />
      {/* Large Input Area */}
      {isDatasetReady && (
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
            // The uploadedFile prop is simplified
            uploadedFile={{
              name: csvFile?.name || "Product Data",
            }}
            textAreaClassName="h-[120px] md:h-[140px]"
            isLLMAnswering={false}
            onStopLLM={() => {}}
          />
        </div>
      )}
      {/* Processing State is handled by the loading prop in the dialog */}
      {/* Suggestions are removed as processing is now on the backend */}
    </>
  );
}

export default function Khroma() {
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
            <KhromaClient
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
