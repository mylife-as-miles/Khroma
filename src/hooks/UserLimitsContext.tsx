"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface UserLimits {
  remainingMessages: number | null;
  resetTimestamp: number | null;
  loading: boolean;
  refetch: () => void;
}

const UserLimitsContext = createContext<UserLimits | undefined>(undefined);

export const UserLimitsProvider = ({ children }: { children: ReactNode }) => {
  const [remainingMessages, setRemainingMessages] = useState<number | null>(
    null
  );
  const [resetTimestamp, setResetTimestamp] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch limits
  const fetchLimits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/limits`);
      const data = await res.json();
      setRemainingMessages(data.remaining);
      setResetTimestamp(data.reset ?? null);
    } catch {
      setRemainingMessages(null);
      setResetTimestamp(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  const refetch = () => {
    fetchLimits();
  };

  return (
    <UserLimitsContext.Provider
      value={{ remainingMessages, resetTimestamp, loading, refetch }}
    >
      {children}
    </UserLimitsContext.Provider>
  );
};

export function useUserLimits(): UserLimits {
  const context = useContext(UserLimitsContext);
  if (context === undefined) {
    throw new Error("useUserLimits must be used within a UserLimitsProvider");
  }
  return context;
}
