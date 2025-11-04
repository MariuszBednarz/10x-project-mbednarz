import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookieConsent", "rejected");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg">
      <div className="max-w-screen-xl mx-auto">
        <Alert className="border-0 shadow-none p-0">
          <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm flex-1">
              Ta strona używa ciasteczek.{" "}
              <a
                href="/polityka-prywatnosci"
                className="underline hover:text-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              >
                Polityka Prywatności
              </a>
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={handleAccept} variant="default" size="sm" className="flex-1 sm:flex-none">
                Akceptuj
              </Button>
              <Button onClick={handleReject} variant="outline" size="sm" className="flex-1 sm:flex-none">
                Odrzuć
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
