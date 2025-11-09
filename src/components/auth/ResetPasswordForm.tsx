import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { toast } from "sonner";
import { authService } from "../../lib/services/auth.service";
import { supabaseClient } from "../../db/supabase.client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we have a valid recovery session
  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabaseClient.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          setIsValidToken(false);
          return;
        }

        // Check if this is a recovery session
        if (session && session.user) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
        }
      } catch (err) {
        console.error("Error validating recovery token:", err);
        setIsValidToken(false);
      } finally {
        setIsValidating(false);
      }
    };

    checkRecoverySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password match
    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne");
      toast.error("Hasła nie są identyczne");
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków");
      toast.error("Hasło musi mieć co najmniej 8 znaków");
      return;
    }

    setIsLoading(true);

    try {
      await authService.updatePassword(password);

      // Success
      setIsSuccess(true);
      toast.success("Hasło zostało zmienione pomyślnie!");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: any) {
      console.error("Password reset error:", err);

      // Handle specific Supabase errors
      if (err.message?.includes("New password should be different")) {
        setError("Nowe hasło musi być inne niż poprzednie");
        toast.error("Nowe hasło musi być inne niż poprzednie");
      } else if (err.message?.includes("Password should be at least")) {
        setError("Hasło musi mieć co najmniej 8 znaków");
        toast.error("Hasło musi mieć co najmniej 8 znaków");
      } else {
        setError("Wystąpił błąd podczas zmiany hasła. Spróbuj ponownie.");
        toast.error("Wystąpił błąd podczas zmiany hasła. Spróbuj ponownie.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while validating token
  if (isValidating) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Weryfikacja linku...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error if token is invalid
  if (!isValidToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link wygasł lub jest nieprawidłowy</CardTitle>
          <CardDescription>Nie można zresetować hasła</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
            <p>Link do resetowania hasła jest nieprawidłowy lub wygasł.</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Linki do resetowania hasła są ważne przez 1 godzinę. Możesz poprosić o nowy link.
          </p>
          <Button
            variant="default"
            className="w-full h-[44px]"
            onClick={() => (window.location.href = "/forgot-password")}
          >
            Poproś o nowy link
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show success message
  if (isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hasło zostało zmienione!</CardTitle>
          <CardDescription>Możesz teraz zalogować się nowym hasłem</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-md bg-primary/10 text-primary text-sm">
            <p>Twoje hasło zostało pomyślnie zmienione. Za chwilę zostaniesz przekierowany do strony logowania.</p>
          </div>
          <Button variant="default" className="w-full h-[44px]" onClick={() => (window.location.href = "/login")}>
            Przejdź do logowania
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ustaw nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło dla swojego konta</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Nowe hasło
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

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Potwierdź nowe hasło
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              className="h-[44px]"
            />
          </div>

          <Button type="submit" className="w-full h-[44px]" disabled={isLoading}>
            {isLoading ? "Zmienianie hasła..." : "Zmień hasło"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
