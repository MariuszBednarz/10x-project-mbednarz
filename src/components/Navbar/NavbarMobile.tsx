import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, LogOut, Settings, Lightbulb } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { User as AuthUser } from "@supabase/supabase-js";

interface NavbarMobileProps {
  user: AuthUser | null;
  isLoading: boolean;
  showInsightIcon: boolean;
  onRestoreInsight: () => void;
  isAuthenticated: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NavbarMobile({
  user,
  isLoading,
  showInsightIcon,
  onRestoreInsight,
  isAuthenticated,
  isOpen,
  onOpenChange,
}: NavbarMobileProps) {
  const handleLogout = async () => {
    // Will be implemented in main Navbar component
    window.location.href = "/login";
  };

  const handleLinkClick = () => {
    onOpenChange(false);
  };

  return (
    <nav className="lg:hidden flex items-center justify-between px-4 py-3 bg-primary text-white">
      {/* Hamburger Menu */}
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Otwórz menu" className="text-white hover:bg-primary-light">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[320px]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 mt-8">
            {isAuthenticated && (
              <>
                <a href="/wards" className="text-base hover:text-primary transition-colors" onClick={handleLinkClick}>
                  Oddziały
                </a>
                <a
                  href="/o-aplikacji"
                  className="text-base hover:text-primary transition-colors"
                  onClick={handleLinkClick}
                >
                  O aplikacji
                </a>
                <a
                  href="/settings"
                  className="text-base hover:text-primary transition-colors"
                  onClick={handleLinkClick}
                >
                  Ustawienia
                </a>
                <Separator className="my-2" />
                <button
                  onClick={handleLogout}
                  className="text-base text-left text-red-600 hover:text-red-700 transition-colors"
                >
                  Wyloguj
                </button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <a
                  href="/o-aplikacji"
                  className="text-base hover:text-primary transition-colors"
                  onClick={handleLinkClick}
                >
                  O aplikacji
                </a>
                <Separator className="my-2" />
                <a href="/login" className="text-base hover:text-primary transition-colors" onClick={handleLinkClick}>
                  Zaloguj
                </a>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Logo - Centered */}
      <a href={isAuthenticated ? "/wards" : "/"} className="font-bold text-base flex-1 text-center">
        DoSzpitala
      </a>

      {/* Right Icons */}
      <div className="flex items-center gap-2">
        {/* AI Insight Icon */}
        {showInsightIcon && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRestoreInsight}
            aria-label="Przywróć AI wgląd"
            className="text-white hover:bg-primary-light"
          >
            <Lightbulb className="w-5 h-5" />
          </Button>
        )}

        {/* User Icon */}
        {isAuthenticated && !isLoading && (
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label="Profil użytkownika"
            className="text-white hover:bg-primary-light"
          >
            <a href="/settings">
              <User className="w-5 h-5" />
            </a>
          </Button>
        )}
      </div>
    </nav>
  );
}
