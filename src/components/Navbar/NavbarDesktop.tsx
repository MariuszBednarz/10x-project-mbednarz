import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, Lightbulb } from "lucide-react";
import type { User as AuthUser } from "@supabase/supabase-js";

interface NavbarDesktopProps {
  user: AuthUser | null;
  isLoading: boolean;
  showInsightIcon: boolean;
  onRestoreInsight: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export function NavbarDesktop({
  user,
  isLoading,
  showInsightIcon,
  onRestoreInsight,
  isAuthenticated,
  onLogout,
}: NavbarDesktopProps) {
  return (
    <nav className="hidden lg:flex items-center justify-between px-6 py-4 bg-primary text-white">
      {/* Logo/Brand */}
      <a href={isAuthenticated ? "/wards" : "/"} className="font-bold text-lg hover:opacity-80 transition-opacity">
        HosLU
      </a>

      {/* Center Links */}
      <div className="flex items-center gap-6 flex-1 justify-center">
        {isAuthenticated && (
          <>
            <a href="/wards" className="text-sm hover:opacity-80 transition-opacity">
              Oddziały
            </a>
            <a href="/o-aplikacji" className="text-sm hover:opacity-80 transition-opacity">
              O aplikacji
            </a>
          </>
        )}
        {!isAuthenticated && (
          <a href="/o-aplikacji" className="text-sm hover:opacity-80 transition-opacity">
            O aplikacji
          </a>
        )}
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-4">
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

        {/* User Dropdown */}
        {isAuthenticated && !isLoading && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Menu użytkownika"
                className="text-white hover:bg-primary-light"
              >
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <a href="/settings" className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Ustawienia
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600 cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Wyloguj
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          !isLoading && (
            <a href="/login">
              <Button variant="outline" className="text-primary">
                Zaloguj
              </Button>
            </a>
          )
        )}
      </div>
    </nav>
  );
}
