/**
 * Protected wrapper for WardsList page
 * Uses useAuthGuard to ensure user is authenticated before rendering
 */

import { useAuthGuard } from "../hooks/useAuthGuard";
import { WardsList } from "./WardsList";

export function WardsListProtected() {
  const { loading } = useAuthGuard();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Sprawdzanie autoryzacji...</p>
        </div>
      </div>
    );
  }

  return <WardsList />;
}
