import { useState } from "react";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../../lib/services/auth.service";

interface VerifyEmailProps {
  email?: string;
}

export function VerifyEmail({ email }: VerifyEmailProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [message, setMessage] = useState("");

  const handleResend = async () => {
    if (resendCount >= 3) {
      setMessage("Osiągnięto limit wysyłania emaili. Spróbuj ponownie za 10 minut.");
      toast.error("Osiągnięto limit wysyłania emaili. Spróbuj ponownie za 10 minut.");
      return;
    }

    if (!email) {
      setMessage("Brak adresu email. Spróbuj zarejestrować się ponownie.");
      toast.error("Brak adresu email. Spróbuj zarejestrować się ponownie.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      await authService.resendVerificationEmail(email);
      setResendCount(resendCount + 1);
      setMessage("Email weryfikacyjny został wysłany ponownie.");
      toast.success("Email weryfikacyjny został wysłany ponownie.");
    } catch {
      setMessage("Nie udało się wysłać emaila. Spróbuj ponownie później.");
      toast.error("Nie udało się wysłać emaila. Spróbuj ponownie później.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Zweryfikuj swój adres email</CardTitle>
        <CardDescription>Sprawdź swoją skrzynkę email i kliknij link weryfikacyjny</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTitle>Email wysłany do:</AlertTitle>
          <AlertDescription className="font-medium">{email || "Twój adres email"}</AlertDescription>
        </Alert>

        {message && (
          <Alert variant={resendCount >= 3 ? "destructive" : "default"}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Button
            onClick={handleResend}
            variant="secondary"
            className="w-full h-[44px]"
            disabled={isLoading || resendCount >= 3}
          >
            {isLoading ? "Wysyłanie..." : "Wyślij ponownie email"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Możesz wysłać email ponownie {3 - resendCount} razy
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
