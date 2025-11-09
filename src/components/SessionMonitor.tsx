/**
 * Session Monitor Component
 *
 * Wraps the useSessionMonitor hook in a React component
 * that can be used in Astro layouts with client:load
 */

import { useSessionMonitor } from "./hooks/useSessionMonitor";
import { toast } from "sonner";

export function SessionMonitor() {
  useSessionMonitor({
    onSessionExpired: () => {
      toast.error("Sesja wygasła. Zaloguj się ponownie.");
    },
  });

  // This component doesn't render anything
  return null;
}
