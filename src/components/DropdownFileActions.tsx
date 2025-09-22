import React, { useState, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { UploadedFile } from "@/lib/utils";
import { CsvPreviewModal } from "./CsvPreviewModal";
import { getCsvFromDB } from "@/lib/indexedDb";
import { toast } from "sonner";

export function DropdownFileActions({
  uploadedFile,
}: {
  uploadedFile?: UploadedFile;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const hasPreview =
    !!uploadedFile?.csvHeaders?.length && !!uploadedFile?.csvRows?.length;

  const hasDownload = !!uploadedFile?.datasetId;

  const handleDownload = useCallback(async () => {
    if (!uploadedFile?.datasetId) {
      toast.error("Could not download file: No dataset ID found.");
      return;
    }
    try {
      const csvData = await getCsvFromDB(uploadedFile.datasetId);
      if (!csvData) {
        toast.error("Could not find file data in local storage.");
        return;
      }

      // Reconstruct CSV string
      const header = csvData.headers.join(",") + "\\n";
      const body = csvData.rows
        .map((row) => csvData.headers.map((h) => row[h] ?? "").join(","))
        .join("\\n");
      const csvString = header + body;

      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", csvData.fileName || "data.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error("Failed to download file: " + error.message);
    }
  }, [uploadedFile]);

  if (!hasPreview && !hasDownload) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 cursor-pointer">
            <img src="/3dots.svg" alt="" className="size-2.5 min-w-2.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[140px] p-0 flex flex-col"
        >
          {hasDownload && (
            <DropdownMenuItem
              onClick={handleDownload}
              className="h-[39px] pl-3 pr-2 py-2 cursor-pointer flex flex-row items-center gap-3"
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                preserveAspectRatio="none"
              >
                <path
                  d="M13 9.5V7.75C13 7.15326 12.7629 6.58097 12.341 6.15901C11.919 5.73705 11.3467 5.5 10.75 5.5H9.75C9.55109 5.5 9.36032 5.42098 9.21967 5.28033C9.07902 5.13968 9 4.94891 9 4.75V3.75C9 3.15326 8.76295 2.58097 8.34099 2.15901C7.91903 1.73705 7.34674 1.5 6.75 1.5H5.5M6 9.5L8 11.5L6 9.5ZM8 11.5L10 9.5L8 11.5ZM8 11.5V7.5V11.5ZM7 1.5H3.75C3.336 1.5 3 1.836 3 2.25V13.75C3 14.164 3.336 14.5 3.75 14.5H12.25C12.664 14.5 13 14.164 13 13.75V7.5C13 5.9087 12.3679 4.38258 11.2426 3.25736C10.1174 2.13214 8.5913 1.5 7 1.5Z"
                  fill="#F1F5F9"
                />
                <path
                  d="M13 9.5V7.75C13 7.15326 12.7629 6.58097 12.341 6.15901C11.919 5.73705 11.3467 5.5 10.75 5.5H9.75C9.55109 5.5 9.36032 5.42098 9.21967 5.28033C9.07902 5.13968 9 4.94891 9 4.75V3.75C9 3.15326 8.76295 2.58097 8.34099 2.15901C7.91903 1.73705 7.34674 1.5 6.75 1.5H5.5M6 9.5L8 11.5M8 11.5L10 9.5M8 11.5V7.5M7 1.5H3.75C3.336 1.5 3 1.836 3 2.25V13.75C3 14.164 3.336 14.5 3.75 14.5H12.25C12.664 14.5 13 14.164 13 13.75V7.5C13 5.9087 12.3679 4.38258 11.2426 3.25736C10.1174 2.13214 8.5913 1.5 7 1.5Z"
                  stroke="#45556C"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm text-left text-[#314158]">
                Download
              </span>
            </DropdownMenuItem>
          )}
          {hasPreview ? (
            <DropdownMenuItem
              className="h-[39px] pl-3 pr-2 py-2 cursor-pointer flex flex-row items-center gap-3"
              onClick={() => setPreviewOpen(true)}
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                preserveAspectRatio="none"
              >
                <path
                  d="M1.35732 8.21467C1.31131 8.07639 1.31131 7.92694 1.35732 7.78867C2.28199 5.00667 4.90665 3 7.99999 3C11.092 3 13.7153 5.00467 14.642 7.78533C14.6887 7.92333 14.6887 8.07267 14.642 8.21133C13.718 10.9933 11.0933 13 7.99999 13C4.90799 13 2.28399 10.9953 1.35732 8.21467Z"
                  fill="#E2E8F0"
                  stroke="#45556C"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 8C10 8.53043 9.78929 9.03914 9.41421 9.41421C9.03914 9.78929 8.53043 10 8 10C7.46957 10 6.96086 9.78929 6.58579 9.41421C6.21071 9.03914 6 8.53043 6 8C6 7.46957 6.21071 6.96086 6.58579 6.58579C6.96086 6.21071 7.46957 6 8 6C8.53043 6 9.03914 6.21071 9.41421 6.58579C9.78929 6.96086 10 7.46957 10 8Z"
                  stroke="#45556C"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm text-left text-[#314158]">Preview</span>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {hasPreview && (
        <CsvPreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          headers={uploadedFile.csvHeaders!}
          rows={uploadedFile.csvRows!}
        />
      )}
    </>
  );
}
