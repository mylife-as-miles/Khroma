import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Add this helper function at the top-level (outside the component)
export function formatLLMTimestamp(dateString: string | number | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
  let timeAgo = "";
  if (secondsAgo < 60) {
    timeAgo = `${secondsAgo}s`;
  } else if (secondsAgo < 3600) {
    timeAgo = `${Math.floor(secondsAgo / 60)}m`;
  } else {
    timeAgo = `${Math.floor(secondsAgo / 3600)}h`;
  }
  // Format: Apr 8, 06:17:50 PM
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };
  const formatted = date.toLocaleString("en-US", options);
  return formatted;
}

export function extractCodeFromText(text: string) {
  if (!text) return null;
  // Prefer python fenced blocks
  const pyRegex = /```python\s*([\s\S]*?)\s*```/m;
  const pyMatch = pyRegex.exec(text);
  if (pyMatch) return pyMatch[1];

  // Fallback: any fenced block
  const anyRegex = /```[a-zA-Z0-9_-]*\s*([\s\S]*?)\s*```/m;
  const anyMatch = anyRegex.exec(text);
  return anyMatch ? anyMatch[1] : null;
}

export type UploadedFile = {
  name?: string;
  datasetId?: string;
  csvHeaders?: string[];
  csvRows?: { [key: string]: string }[];
};

export const APP_NAME = "Khroma";

export const EXAMPLE_FILE_URL = "/products-100.csv";
