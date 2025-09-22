"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function QuestionSuggestionCard({
  question,
  onClick,
  isLoading,
}: {
  question: string;
  onClick?: () => void;
  isLoading?: boolean;
}) {
  return (
    <Card
      className={cn(
        isLoading ? "animate-pulse" : "",
        onClick ? "cursor-pointer" : "",
        "group flex justify-start items-start overflow-hidden gap-3 px-3.5 py-2.5 rounded-xl bg-muted/60 supports-[backdrop-filter]:bg-muted/40 backdrop-blur border border-border w-full transition-colors hover:border-ring"
      )}
      onClick={onClick && onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-card flex items-center justify-center flex-shrink-0 mt-0.5 border border-border">
          <img
            src={isLoading ? "/loading.svg" : "/suggestion.svg"}
            alt="suggestion"
            className={cn(isLoading ? "animate-spin" : "", "size-[18px] opacity-90 group-hover:opacity-100 transition-opacity")}
          />
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed line-clamp-2">
          {question}
        </p>
      </div>
    </Card>
  );
}
