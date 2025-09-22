import { useState, useEffect } from "react";

export function useDraftedInput(
  key: string = "chatInputDraft"
): [string, (v: string) => void, () => void] {
  const [inputValue, setInputValue] = useState("");

  // Load draft from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const draft = localStorage.getItem(key);
      if (draft) {
        setInputValue(draft);
      }
    }
  }, [key]);

  // Save inputValue to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (inputValue) {
        localStorage.setItem(key, inputValue);
      } else {
        localStorage.removeItem(key);
      }
    }
  }, [inputValue, key]);

  const clearInputValue = () => {
    setInputValue("");
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  };

  return [inputValue, setInputValue, clearInputValue];
}
