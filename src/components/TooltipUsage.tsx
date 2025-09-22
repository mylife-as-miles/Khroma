import React, { useMemo, useState, useEffect } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { intervalToDuration, differenceInSeconds } from "date-fns";
import { useUserLimits } from "@/hooks/UserLimitsContext";

function formatTimeRemaining(resetTimestamp: number) {
  const now = new Date();
  const reset =
    typeof resetTimestamp === "string"
      ? new Date(parseInt(resetTimestamp, 10))
      : new Date(resetTimestamp);
  if (isNaN(reset.getTime())) return "--:--:--";
  // Only show if in the future
  if (reset.getTime() <= now.getTime()) return "00:00:00";
  // Use date-fns to get the duration breakdown
  const duration = intervalToDuration({ start: now, end: reset });
  // Calculate total hours (including days, months, years)
  const totalSeconds = differenceInSeconds(reset, now);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = (duration.minutes ?? 0).toString().padStart(2, "0");
  const seconds = (duration.seconds ?? 0).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export default function TooltipUsage() {
  const { remainingMessages, resetTimestamp, loading } = useUserLimits();

  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [open]);

  const formattedTime = useMemo(() => {
    if (!resetTimestamp) return undefined;
    return formatTimeRemaining(resetTimestamp);
    // Include tick so it recalculates every second when open
  }, [resetTimestamp, tick]);

  return (
    <Tooltip onOpenChange={setOpen} open={open}>
      <TooltipTrigger asChild>
        <div className="w-[60px] h-14 relative bg-slate-100 border border-slate-200">
          <div className="flex flex-col justify-center items-center absolute left-[11px] top-[12.5px] gap-[3px]">
            <div className="flex justify-start items-start relative gap-[3px]">
              <img src="/tooltip.svg" className="w-3.5 h-3.5" />
              <p className=" text-xs text-left text-[#1d293d]">
                {remainingMessages}
              </p>
            </div>
            <p className=" text-xs text-left text-[#45556c]">credits</p>
          </div>
        </div>
      </TooltipTrigger>
      {formattedTime && (
        <TooltipContent className="min-w-[265px] bg-[#1d293d] m-1">
          <div className="flex justify-center items-center gap-2">
            <p className="text-sm font-medium text-left text-slate-200 leading-0.5">
              Time remaining until refill:
            </p>
            <p className="text-sm text-left text-white">{formattedTime}</p>
          </div>
        </TooltipContent>
      )}
    </Tooltip>
  );
}
