import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { toast } from "sonner";
import { authService } from "../../lib/services/auth.service";
import { useGuestGuard } from "../hooks/useGuestGuard";

export function LoginForm() {
  const { loading: guardLoading } = useGuestGuard();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authService.signIn({ email, password });

      // Success - redirect to wards page
      toast.success("Zalogowano pomyślnie!");
      window.location.href = "/wards";
    } catch (err: unknown) {
      // Handle specific Supabase errors
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("Invalid login credentials")) {
        setError("Nieprawidłowy email lub hasło");
        toast.error("Nieprawidłowy email lub hasło");
      } else if (errorMessage.includes("Email not confirmed")) {
        setError("Potwierdź swój adres email przed zalogowaniem");
        toast.error("Potwierdź swój adres email przed zalogowaniem");
      } else {
        setError("Wystąpił błąd podczas logowania. Spróbuj ponownie.");
        toast.error("Wystąpił błąd podczas logowania. Spróbuj ponownie.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking auth
  if (guardLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zaloguj się</CardTitle>
        <CardDescription>Wprowadź swoje dane logowania</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-[44px]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Hasło
              </label>
              <a href="/forgot-password" className="text-xs text-primary hover:underline">
                Zapomniałeś hasła?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              minLength={8}
              className="h-[44px]"
            />
          </div>

          <Button type="submit" className="w-full h-[44px]" disabled={isLoading}>
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
