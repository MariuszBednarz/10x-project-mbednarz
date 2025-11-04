import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../../lib/services/auth.service";
import { authenticatedFetch } from "@/lib/utils/api-client";

interface UserProfile {
  email: string;
  createdAt: string;
  emailVerified: boolean;
}

export function AccountSettings() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch("/api/users/me", {
        method: "GET",
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if unauthorized
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();
      setUserProfile({
        email: data.email,
        createdAt: data.created_at,
        emailVerified: !!data.email_confirmed_at,
      });
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await authenticatedFetch("/api/users/me", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      // Logout
      await authService.signOut();

      // Success - redirect to home page
      toast.success("Konto zostało usunięte");
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error("Nie udało się usunąć konta. Spróbuj ponownie.");
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Nie udało się załadować danych konta. Spróbuj odświeżyć stronę.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>Twój adres email używany do logowania</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-base font-medium">{userProfile.email}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data rejestracji</CardTitle>
          <CardDescription>Kiedy założyłeś konto</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-base font-medium">{formatDate(userProfile.createdAt)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status weryfikacji</CardTitle>
          <CardDescription>Status potwierdzenia adresu email</CardDescription>
        </CardHeader>
        <CardContent>
          {userProfile.emailVerified ? (
            <div className="flex items-center space-x-2">
              <span className="text-green-600 font-medium">✓ Zweryfikowany</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600 font-medium">⚠️ Niezweryfikowany</span>
              </div>
              <Alert>
                <AlertDescription>Sprawdź swoją skrzynkę email i kliknij link weryfikacyjny.</AlertDescription>
              </Alert>
              <Button variant="outline" size="sm">
                Wyślij ponownie email weryfikacyjny
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Strefa niebezpieczna</CardTitle>
          <CardDescription>Nieodwracalne działania na koncie</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} className="w-full sm:w-auto">
            Usuń konto
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Usuń konto?</span>
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                Ta operacja jest <strong>nieodwracalna</strong>. Wszystkie twoje dane, w tym ulubione oddziały, zostaną
                trwale usunięte.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              {isDeleting ? "Usuwanie..." : "Usuń konto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
