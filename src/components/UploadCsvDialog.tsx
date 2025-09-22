"use client";
import React, { useCallback } from "react";
import Dropzone from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn, EXAMPLE_FILE_URL } from "@/lib/utils";
import { FileSpreadsheet, UploadCloud, ShieldCheck, Gauge, CheckCircle2 } from "lucide-react";

interface UploadCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelected: (file: File | null) => void;
  loading?: boolean;
  fileName?: string | null;
  fileSize?: number | null;
  step?: "idle" | "reading" | "saving" | "generating" | "done";
  headers?: string[];
  sampleRows?: { [key: string]: string }[];
}

export function UploadCsvDialog({ open, onOpenChange, onFileSelected, loading = false, fileName, fileSize, step = "idle", headers = [], sampleRows = [] }: UploadCsvDialogProps) {
  const handleDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles?.[0];
    if (!file) {
      toast.warning("Please select a CSV file");
      return;
    }

    // Accept common CSV MIME types and also fall back to .csv extension check
    const allowedMimeTypes = ["text/csv", "application/vnd.ms-excel", "text/plain", ""];
    const isCsv = allowedMimeTypes.includes(file.type) || file.name.toLowerCase().endsWith(".csv");

    if (!isCsv) {
      toast.warning("Only .csv files are supported");
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      toast.warning("File size must be less than 30MB");
      return;
    }

    onFileSelected(file);
  }, [onFileSelected]);

  const onUseExample = useCallback(async () => {
    try {
      const response = await fetch(EXAMPLE_FILE_URL);
      const blob = await response.blob();
      const file = new File([blob], "products.csv", { type: "text/csv" });
  onFileSelected(file);
    } catch (error) {
      toast.error("Failed to load example CSV");
    }
  }, [onFileSelected, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[920px] max-h-[90svh] p-0 overflow-hidden md:overflow-visible border border-border/40 shadow-[0_10px_40px_rgba(2,6,23,0.2)] rounded-2xl bg-popover/90 backdrop-blur-xl text-popover-foreground">
        {/* Header banner */}
  <div className="relative text-popover-foreground p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
          <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(600px 200px at 10% 0%, rgba(255,255,255,0.4), transparent)" }} />
          <div className="relative">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl tracking-tight">Upload your CSV</DialogTitle>
            <DialogDescription className="text-popover-foreground/80">
              Drag and drop a CSV up to 30MB. We’ll parse headers and sample rows to kickstart your analysis.
            </DialogDescription>
          </DialogHeader>
          {!!fileName && (
            <div className="mt-3 flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/40 px-3 py-1 text-sm text-accent-foreground">
                <FileSpreadsheet className="size-4" />
                <span className="truncate max-w-[220px]" title={fileName}>{fileName}</span>
                {typeof fileSize === 'number' && (
                  <span className="text-popover-foreground/80">· {(fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                )}
              </div>
              {/* Stepper */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {(() => {
                  type Step = "idle" | "reading" | "saving" | "generating" | "done";
                  const order: Record<Step, number> = {
                    idle: 0,
                    reading: 1,
                    saving: 2,
                    generating: 3,
                    done: 4,
                  };
                  const STEPS: { key: Exclude<Step, "idle" | "done">; label: string }[] = [
                    { key: "reading", label: "Reading headers" },
                    { key: "saving", label: "Saving locally" },
                    { key: "generating", label: "Generating questions" },
                  ];
                  return STEPS.map(({ key, label }) => {
                    const done = order[step as Step] > order[key];
                    const active = step === key;
                    return (
                      <div key={key} className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className={cn("size-4", done ? "text-emerald-400" : active ? "text-popover-foreground" : "text-popover-foreground/50")} />
                        <span className={cn(done ? "text-popover-foreground" : active ? "text-popover-foreground" : "text-popover-foreground/70")}>{label}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Body */}
  <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
            {/* Features column */}
            <div className="md:col-span-2 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="size-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Private by default</p>
                  <p className="text-xs text-muted-foreground">Your file is only used to answer your questions.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Gauge className="size-5 text-indigo-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Fast preview</p>
                  <p className="text-xs text-muted-foreground">We analyze headers and a small sample, not the entire file.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="size-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">CSV only</p>
                  <p className="text-xs text-muted-foreground">Support for XLSX coming soon.</p>
                </div>
              </div>

              <div className="mt-2">
                <Button variant="outline" onClick={onUseExample} className="gap-2 w-full md:w-auto" disabled={loading}>
                  Try example CSV
                </Button>
              </div>
            </div>

            {/* Dropzone + Preview column */}
            <div className="md:col-span-3">
              {!loading ? (
                <Dropzone multiple={false} accept={{ "text/csv": [".csv"] }} onDrop={handleDrop}>
                  {({ getRootProps, getInputProps, isDragActive }) => (
                    <div
                      {...getRootProps()}
                      className={cn(
                        "rounded-xl border-2 border-dashed p-6 md:p-8 bg-card/80 backdrop-blur-md transition shadow-lg cursor-pointer",
                        isDragActive ? "border-blue-600 bg-blue-50/80" : "border-slate-200"
                      )}
                      style={{ boxShadow: "0 12px 32px rgba(2,6,23,0.10)" }}
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className={cn("rounded-full size-12 flex items-center justify-center",
                          isDragActive ? "bg-blue-600/10" : "bg-slate-100")}
                        >
                          <UploadCloud className={cn("size-6", isDragActive ? "text-blue-700" : "text-muted-foreground")} />
                        </div>
                        <p className="text-sm md:text-base text-foreground font-medium">
                          {isDragActive ? "Drop your CSV here" : "Drag & drop your CSV or click to browse"}
                        </p>
                        <p className="text-xs text-muted-foreground">Max 30MB • .csv only</p>
                      </div>
                    </div>
                  )}
                </Dropzone>
              ) : (
                <div className="rounded-xl border p-6 md:p-8 bg-card/80 backdrop-blur-md shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full border-2 border-blue-500/40 border-t-transparent animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Analyzing CSV…</p>
                      <p className="text-xs text-muted-foreground">Reading headers, uploading and preparing suggestions.</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 animate-[progress_1.6s_ease_infinite]" />
                  </div>
                  <style jsx>{`
                    @keyframes progress {
                      0% { transform: translateX(-50%); }
                      50% { transform: translateX(0%); }
                      100% { transform: translateX(100%); }
                    }
                  `}</style>
                </div>
              )}

              {/* Mini CSV preview table */}
              {headers.length > 0 && sampleRows.length > 0 && (
                <div className="mt-4 rounded-lg border bg-card overflow-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        {headers.slice(0, 6).map((h) => (
                          <th key={h} className="px-2 py-2 font-medium text-slate-700 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sampleRows.slice(0, 4).map((row, i) => (
                        <tr key={i} className="border-t">
                          {headers.slice(0, 6).map((h) => (
                            <td key={h} className="px-2 py-2 text-slate-600 whitespace-nowrap max-w-[180px] truncate" title={row[h] ?? ""}>
                              {row[h] ?? ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
