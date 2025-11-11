import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { toast } from "sonner";
import { authService } from "../../lib/services/auth.service";
import { useGuestGuard } from "../hooks/useGuestGuard";

export function ForgotPasswordForm() {
  const { loading: guardLoading } = useGuestGuard();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authService.requestPasswordReset(email);

      // Success - show message
      setIsSuccess(true);
      toast.success("Link do resetowania hasła został wysłany na podany adres email");
    } catch (err: unknown) {
      // Handle specific Supabase errors
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("Email rate limit exceeded")) {
        setError("Zbyt wiele prób. Spróbuj ponownie później.");
        toast.error("Zbyt wiele prób. Spróbuj ponownie później.");
      } else if (errorMessage.includes("Invalid email")) {
        setError("Nieprawidłowy format adresu email");
        toast.error("Nieprawidłowy format adresu email");
      } else {
        // Generic success message for security (don't reveal if email exists)
        setIsSuccess(true);
        toast.success("Jeśli konto istnieje, link do resetowania hasła został wysłany");
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

  // Show success message
  if (isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sprawdź swoją skrzynkę email</CardTitle>
          <CardDescription>Link do resetowania hasła został wysłany</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-md bg-primary/10 text-primary text-sm">
            <p className="mb-2">Wysłaliśmy instrukcje resetowania hasła na adres:</p>
            <p className="font-medium">{email}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Link będzie ważny przez 1 godzinę. Jeśli nie otrzymałeś emaila, sprawdź folder spam.
          </p>
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full h-[44px]" onClick={() => setIsSuccess(false)}>
              Wyślij ponownie
            </Button>
            <Button variant="default" className="w-full h-[44px]" onClick={() => (window.location.href = "/login")}>
              Wróć do logowania
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zresetuj hasło</CardTitle>
        <CardDescription>Podaj adres email powiązany z Twoim kontem</CardDescription>
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
            <p className="text-xs text-muted-foreground">Wyślemy Ci link do resetowania hasła na ten adres email</p>
          </div>

          <Button type="submit" className="w-full h-[44px]" disabled={isLoading}>
            {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
          </Button>

          <div className="text-center">
            <a href="/login" className="text-sm text-muted-foreground hover:text-primary">
              Wróć do logowania
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
