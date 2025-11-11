import { useState, useCallback } from "react";
import { apiClient } from "@/lib/utils/api-client";

interface UseFavoritesOptions {
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export const useFavorites = (options?: UseFavoritesOptions) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loadingWards, setLoadingWards] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const toggleFavorite = useCallback(
    async (wardName: string) => {
      const isFavorite = favorites.has(wardName);
      const previousFavorites = new Set(favorites);

      try {
        setError(null);
        setLoadingWards((prev) => new Set(prev).add(wardName));

        if (isFavorite) {
          setFavorites((prev) => {
            const next = new Set(prev);
            next.delete(wardName);
            return next;
          });
        } else {
          setFavorites((prev) => new Set(prev).add(wardName));
        }

        const response = isFavorite
          ? await apiClient.delete(`/api/users/me/favorites/by-ward/${encodeURIComponent(wardName)}`)
          : await apiClient.post(`/api/users/me/favorites`, { ward_name: wardName });

        if (!response.ok) {
          setFavorites(previousFavorites);

          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || `Failed to ${isFavorite ? "remove from" : "add to"} favorites`;

          setError(errorMessage);
          options?.onError?.(errorMessage);

          throw new Error(errorMessage);
        }

        // 4. Success
        const successMessage = isFavorite ? "Removed from favorites" : "Added to favorites";
        options?.onSuccess?.(successMessage);
      } catch {
        // Error already handled above
      } finally {
        setLoadingWards((prev) => {
          const next = new Set(prev);
          next.delete(wardName);
          return next;
        });
      }
    },
    [favorites, options]
  );

  const addFavorites = useCallback((wardNames: string[]) => {
    setFavorites((prev) => new Set([...prev, ...wardNames]));
  }, []);

  const removeFavorites = useCallback((wardNames: string[]) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      wardNames.forEach((name) => next.delete(name));
      return next;
    });
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites(new Set());
  }, []);

  const isFavorite = useCallback((wardName: string) => favorites.has(wardName), [favorites]);

  const isLoading = useCallback((wardName: string) => loadingWards.has(wardName), [loadingWards]);

  return {
    favorites,
    loadingWards,
    error,
    toggleFavorite,
    addFavorites,
    removeFavorites,
    clearFavorites,
    isFavorite,
    isLoading,
    setError,
  };
};
