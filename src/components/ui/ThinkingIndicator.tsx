// Thinking indicator component
export function ThinkingIndicator({ thought }: { thought?: string }) {
  return (
    <div className="flex items-start justify-start my-4 self-start">
      <img
        src="/loading.svg"
        alt="Thinking..."
        className="size-4 animate-spin"
      />
      <span className="ml-2 text-[#006597] font-semibold text-sm">
        {thought || "Thinking"} <span className="animate-pulse">...</span>
      </span>
    </div>
  );
}
