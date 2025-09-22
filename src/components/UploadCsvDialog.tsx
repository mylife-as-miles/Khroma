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
import { cn } from "@/lib/utils";
import { FileSpreadsheet, UploadCloud, ShieldCheck, Gauge, CheckCircle2, Image as ImageIcon, AlertTriangle } from "lucide-react";

interface UploadCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelected: (csvFile: File, imageFiles: File[]) => void;
  loading?: boolean;
  fileName?: string | null;
  imageFileCount?: number;
  fileSize?: number | null;
  step?: "idle" | "reading" | "saving" | "generating" | "done";
  headers?: string[];
  sampleRows?: { [key: string]: string }[];
}

export function UploadCsvDialog({
  open,
  onOpenChange,
  onFileSelected,
  loading = false,
  fileName,
  imageFileCount = 0,
  fileSize,
  step = "idle",
  headers = [],
  sampleRows = [],
}: UploadCsvDialogProps) {
  const handleDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles.find(f => f.name.toLowerCase().endsWith('.csv'));
    const imageFiles = acceptedFiles.filter(f => !f.name.toLowerCase().endsWith('.csv'));

    if (!csvFile) {
      toast.warning("A CSV file is required.");
      return;
    }
    if (imageFiles.length === 0) {
        toast.warning("Please select at least one image file.");
        return;
    }

    if (csvFile.size > 30 * 1024 * 1024) {
      toast.warning("CSV file size must be less than 30MB");
      return;
    }

    onFileSelected(csvFile, imageFiles);
  }, [onFileSelected]);

  // const onUseExample = useCallback(async () => {
  //   // This functionality is temporarily disabled as it doesn't include images.
  //   toast.info("Example CSV functionality is disabled for multimodal search.");
  // }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[920px] max-h-[90svh] p-0 overflow-hidden md:overflow-visible border border-border/40 shadow-[0_10px_40px_rgba(2,6,23,0.2)] rounded-2xl bg-popover/90 backdrop-blur-xl text-popover-foreground">
        {/* Header banner */}
        <div className="relative text-popover-foreground p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
          <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(600px 200px at 10% 0%, rgba(255,255,255,0.4), transparent)" }} />
          <div className="relative">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl tracking-tight">Upload Your Product Data</DialogTitle>
            <DialogDescription className="text-popover-foreground/80">
              Drag & drop a CSV and product images. Images must be named with the product's ID (e.g., 56.jpg).
            </DialogDescription>
          </DialogHeader>
          {!!fileName && (
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-accent/40 px-3 py-1 text-sm text-accent-foreground">
                  <FileSpreadsheet className="size-4" />
                  <span className="truncate max-w-[220px]" title={fileName}>{fileName}</span>
                  {typeof fileSize === 'number' && (
                    <span className="text-popover-foreground/80">· {(fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                  )}
                </div>
                {imageFileCount > 0 && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-accent/40 px-3 py-1 text-sm text-accent-foreground">
                        <ImageIcon className="size-4" />
                        <span>{imageFileCount} image{imageFileCount > 1 ? 's' : ''}</span>
                    </div>
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
                    { key: "reading", label: "Reading files" },
                    { key: "saving", label: "Processing data" },
                    { key: "generating", label: "Generating embeddings" },
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
              <div className="flex items-start gap-3 text-amber-600">
                <AlertTriangle className="size-5 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-500">Important Requirement</p>
                  <p className="text-xs text-amber-600/80">Image files must be named after the product ID from the CSV (e.g., '56.jpg').</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="size-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Private by default</p>
                  <p className="text-xs text-muted-foreground">Your files are processed to create embeddings.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="size-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">CSV & Images</p>
                  <p className="text-xs text-muted-foreground">Requires one CSV and one or more images.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-amber-600">
                <AlertTriangle className="size-5 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Image Naming Requirement</p>
                  <p className="text-xs text-amber-600/80">Image files must be named after the 'Internal ID' or 'Index' from the CSV (e.g., '56.jpg', '29.png').</p>
                </div>
              </div>
            </div>

            {/* Dropzone + Preview column */}
            <div className="md:col-span-3">
              {!loading ? (
                <Dropzone multiple={true} accept={{ "text/csv": [".csv"], "image/*": [".jpeg", ".jpg", ".png", ".webp"] }} onDrop={handleDrop}>
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
                          {isDragActive ? "Drop your files here" : "Drag & drop your CSV and images"}
                        </p>
                        <p className="text-xs text-muted-foreground">Or click to browse</p>
                      </div>
                    </div>
                  )}
                </Dropzone>
              ) : (
                <div className="rounded-xl border p-6 md:p-8 bg-card/80 backdrop-blur-md shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full border-2 border-blue-500/40 border-t-transparent animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Processing Data…</p>
                      <p className="text-xs text-muted-foreground">Generating embeddings and indexing your products.</p>
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
