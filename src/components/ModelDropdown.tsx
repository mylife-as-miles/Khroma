import React from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChatModel } from "@/lib/models";
import { cn } from "@/lib/utils";

export function ModelDropdown({
  models,
  value,
  onChange,
}: {
  models: ChatModel[];
  value?: string;
  onChange: (model: string) => void;
}) {
  // Find the selected model for displaying logo in the trigger
  const selectedModel = models.find((m) => m.slug === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "flex flex-row justify-betweem items-center overflow-hidden gap-2.5 px-2 py-1.5 rounded-sm bg-card border border-border !h-[28px] min-w-[148px]",
          "cursor-pointer"
        )}
        style={{ boxShadow: "0px 1px 7px -3px rgba(0,0,0,0.25)" }}
      >
        <span className="flex items-center gap-2">
          {selectedModel && (
            <img
              src={selectedModel.logo}
              alt={selectedModel.title}
              width={16}
              height={16}
              className="w-4 h-4 object-contain"
            />
          )}
          <span className="text-sm text-left text-foreground truncate">
            {selectedModel ? <>{selectedModel.title}</> : "Select model"}
          </span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {models.map((m) => (
          <SelectItem key={m.model} value={m.slug}>
            <span className="flex items-center gap-2">
              <img
                src={m.logo}
                alt={m.title}
                width={16}
                height={16}
                className="w-4 h-4 object-contain"
              />
              <span className="text-sm text-left text-foreground truncate">
                {m.title}
                {m.hasReasoning && <span title="Has reasoning"> 🧠</span>}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
