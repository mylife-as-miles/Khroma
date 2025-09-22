import { useRef, useState, useEffect, RefObject } from "react";

export function useAutoScroll({
  status,
  isCodeRunning,
}: {
  status: string;
  isCodeRunning: boolean;
}): {
  messagesContainerRef: RefObject<HTMLDivElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  isUserAtBottom: boolean;
} {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [lastManualScrollTime, setLastManualScrollTime] = useState<number>(0);

  // Scroll handler to detect if user is at the bottom
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 40; // px from bottom to still count as "at bottom"
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;
    setIsUserAtBottom(isAtBottom);
    // If user scrolled away from bottom, update lastManualScrollTime
    if (!isAtBottom) {
      setLastManualScrollTime(Date.now());
    }
  };

  // Attach scroll event
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll every 2 seconds if user is at the bottom or hasn't scrolled elsewhere recently
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Only scroll if user is at bottom, or hasn't manually scrolled elsewhere in the last 5 seconds
      // AND only if LLM is streaming or code is running
      if (
        (status === "streaming" || isCodeRunning) &&
        (isUserAtBottom || now - lastManualScrollTime > 5000) &&
        messagesEndRef.current
      ) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isUserAtBottom, lastManualScrollTime, status, isCodeRunning]);

  return { messagesContainerRef, messagesEndRef, isUserAtBottom };
}
