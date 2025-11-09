/**
 * Protected wrapper for AccountSettings page
 * Uses useAuthGuard to ensure user is authenticated before rendering
 */

import { useAuthGuard } from "../hooks/useAuthGuard";
import { AccountSettings } from "./AccountSettings";

export function AccountSettingsProtected() {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Ustawienia konta</h1>
          <p className="text-muted-foreground mt-2">Zarządzaj swoim kontem i danymi</p>
        </div>

        <AccountSettings />
      </div>
    </div>
  );
}
