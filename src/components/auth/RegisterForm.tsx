import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { toast } from "sonner";
import { authService } from "../../lib/services/auth.service";
import { useGuestGuard } from "../hooks/useGuestGuard";

export function RegisterForm() {
  const { loading: guardLoading } = useGuestGuard();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rodoConsent, setRodoConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate RODO consent
    if (!rodoConsent) {
      setError("Musisz zaakceptować Regulamin i Politykę Prywatności");
      toast.error("Musisz zaakceptować Regulamin i Politykę Prywatności");
      return;
    }

    setIsLoading(true);

    try {
      const { user } = await authService.signUp({ email, password });

      // Success - redirect to verify-email page
      toast.success("Konto utworzone! Sprawdź swoją skrzynkę email.");
      window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
    } catch (err: any) {
      console.error("Registration error:", err);

      // Handle specific Supabase errors
      if (err.message?.includes("User already registered")) {
        setError("Ten adres email jest już zarejestrowany");
        toast.error("Ten adres email jest już zarejestrowany");
      } else if (err.message?.includes("Password should be at least")) {
        setError("Hasło musi mieć co najmniej 8 znaków");
        toast.error("Hasło musi mieć co najmniej 8 znaków");
      } else {
        setError("Wystąpił błąd podczas rejestracji. Spróbuj ponownie.");
        toast.error("Wystąpił błąd podczas rejestracji. Spróbuj ponownie.");
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
        <CardTitle>Zarejestruj się</CardTitle>
        <CardDescription>Utwórz nowe konto, aby korzystać z aplikacji</CardDescription>
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
            <label htmlFor="password" className="text-sm font-medium">
              Hasło
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              className="h-[44px]"
            />
            <p className="text-xs text-muted-foreground">Minimum 8 znaków, zawierające litery i cyfry</p>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="rodo"
              checked={rodoConsent}
              onCheckedChange={(checked) => setRodoConsent(checked === true)}
              required
              aria-required="true"
            />
            <label
              htmlFor="rodo"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Akceptuję{" "}
              <a href="/regulamin" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Regulamin
              </a>{" "}
              i{" "}
              <a
                href="/polityka-prywatnosci"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Politykę Prywatności
              </a>
            </label>
          </div>

          <Button type="submit" className="w-full h-[44px]" disabled={isLoading || !rodoConsent}>
            {isLoading ? "Rejestracja..." : "Zarejestruj się"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
