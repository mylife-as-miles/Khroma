"use client";
import Dropzone from "react-dropzone";
import React from "react";
import { toast } from "sonner";
import { cn, EXAMPLE_FILE_URL } from "@/lib/utils";

interface UploadAreaProps {
  onFileChange: (file: File | null) => void;
  uploadedFile: File | null;
}

export function UploadArea({ onFileChange, uploadedFile }: UploadAreaProps) {
  if (uploadedFile) return <></>;

  const onUseExample = async () => {
    try {
      const response = await fetch(EXAMPLE_FILE_URL);
      const blob = await response.blob();
      const file = new File([blob], "products.csv", {
        type: "text/csv",
      });
      onFileChange(file);
    } catch (error) {
      toast.error("Failed to load example CSV");
    }
  };

  return (
    <>
      <div className="flex items-center justify-center pointer-events-none w-full flex-col">
        <Dropzone
          multiple={false}
          accept={{
            "text/csv": [".csv"],
            "application/vnd.ms-excel": [".csv"],
            "text/plain": [".csv"],
          }}
          onDrop={(acceptedFiles) => {
            const file = acceptedFiles[0];
            if (!file) {
              toast.warning("Please upload a CSV file");
              return;
            }
            // fallback: check extension too
            if (
              !(
                file.type === "text/csv" ||
                file.type === "application/vnd.ms-excel" ||
                file.name.toLowerCase().endsWith(".csv")
              )
            ) {
              toast.warning("Please upload a CSV file");
              return;
            }

            if (file.size > 30 * 1024 * 1024) {
              toast.warning("File size must be less than 30MB");
              return;
            }
            onFileChange(file);
          }}
        >
          {({ getRootProps, getInputProps, isDragAccept }) => (
            <div
              className="w-full h-full flex flex-col justify-center items-center pointer-events-auto"
              {...getRootProps()}
            >
              <input required={!uploadedFile} {...getInputProps()} />

              <div
                className={`w-full h-40 flex flex-col justify-between overflow-hidden rounded-lg p-4 cursor-pointer transition-all duration-300 ease-in-out ${
                  isDragAccept
                    ? "border-blue-700 ring-8 ring-blue-300 bg-blue-100"
                    : "border-[#cad5e2] bg-white"
                }`}
                style={{
                  boxShadow: "0px 1px 7px -4px rgba(0,0,0,0.25)",
                  backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='10' ry='10' stroke='%23CAD5E2' stroke-width='4' stroke-dasharray='6%2c 14' stroke-dashoffset='8' stroke-linecap='square'/%3e%3c/svg%3e")`,
                }}
              >
                <p className="text-base text-left text-muted-foreground">
                  Upload your CSV first, then ask a question
                </p>

                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground text-center">
                    or drag and drop here
                  </p>
                  <div
                    className={`w-full h-[45px] flex items-center justify-center rounded-md border-[0.7px] border-[#cad5e2] transition-all duration-300 ease-in-out ${
                      isDragAccept ? "bg-blue-200" : "bg-slate-50"
                    }`}
                    style={{ boxShadow: "0px 1px 7px -4px rgba(0,0,0,0.25)" }}
                  >
                    <div className="flex justify-center items-center gap-2">
                      <img
                        src="/upload.svg"
                        className={`size-5 transition-transform duration-300 ease-in-out ${
                          isDragAccept ? "scale-125" : ""
                        }`}
                      />
                      <p className="flex-grow-0 flex-shrink-0 text-base font-medium text-left text-foreground">
                        Upload CSV
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Dropzone>
      </div>
      <button
        className={cn(
          "underline text-muted-foreground underline-offset-2 mt-3 cursor-pointer"
        )}
        onClick={onUseExample}
      >
        Use example CSV
      </button>
    </>
  );
}
