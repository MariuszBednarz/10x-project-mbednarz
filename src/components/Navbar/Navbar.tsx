import { NavbarDesktop } from "./NavbarDesktop";
import { NavbarMobile } from "./NavbarMobile";
import { useNavbar } from "./hooks/useNavbar";

interface NavbarProps {
  /**
   * Optional: Override authentication state
   * If not provided, will be fetched from API
   */
  isAuthenticated?: boolean;
}

export function Navbar({ isAuthenticated: isAuthenticatedProp }: NavbarProps) {
  const { isOpen, toggleMenu, closeMenu, user, isLoading, error, showInsightIcon, handleRestoreInsight } = useNavbar();

  // Determine if user is authenticated
  const isAuthenticated = isAuthenticatedProp ?? user !== null;

  // Handle logout
  const handleLogout = async () => {
    try {
      // Call logout API endpoint
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Clear localStorage (Supabase session)
      localStorage.clear();

      // Redirect to login
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
      // Clear localStorage and force redirect anyway
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  return (
    <>
      {/* Desktop Navbar */}
      <NavbarDesktop
        user={user}
        isLoading={isLoading}
        showInsightIcon={showInsightIcon}
        onRestoreInsight={handleRestoreInsight}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />

      {/* Mobile Navbar */}
      <NavbarMobile
        user={user}
        isLoading={isLoading}
        showInsightIcon={showInsightIcon}
        onRestoreInsight={handleRestoreInsight}
        isAuthenticated={isAuthenticated}
        isOpen={isOpen}
        onOpenChange={(open) => (open ? toggleMenu() : closeMenu())}
        onLogout={handleLogout}
      />
    </>
  );
}
