import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Hook to handle focus management for hash anchors.
 * Scrolls to and focuses the target element when navigating via hash.
 */
export const useHashFocus = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);

      if (element) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });

          // Make element focusable if it isn't already
          if (!element.hasAttribute("tabindex")) {
            element.setAttribute("tabindex", "-1");
          }

          element.focus({ preventScroll: true });
        }, 100);
      }
    }
  }, [location.hash]);
};
