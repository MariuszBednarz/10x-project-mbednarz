import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { authenticatedFetch } from "@/lib/utils/api-client";

export interface NavbarState {
  isOpen: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  showInsightIcon: boolean;
}

export function useNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if AI insight was dismissed
  const [showInsightIcon, setShowInsightIcon] = useState(false);

  useEffect(() => {
    // Fetch user profile
    const fetchUser = async () => {
      try {
        const response = await authenticatedFetch("/api/users/me");
        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated - redirect will be handled elsewhere
            setUser(null);
            setIsLoading(false);
            return;
          }
          throw new Error("Failed to fetch user");
        }
        const data = await response.json();
        setUser(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Check if insight was dismissed (from sessionStorage)
  useEffect(() => {
    const isDismissed = sessionStorage.getItem("insightDismissed") === "true";
    setShowInsightIcon(isDismissed);
  }, []);

  // Handlers
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleRestoreInsight = () => {
    sessionStorage.removeItem("insightDismissed");
    setShowInsightIcon(false);
  };

  return {
    isOpen,
    toggleMenu,
    closeMenu,
    user,
    isLoading,
    error,
    showInsightIcon,
    handleRestoreInsight,
  };
}
