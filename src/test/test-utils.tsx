import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";

// Custom render function with providers if needed
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
  // Add any global providers here if needed
  // Example: Theme providers, Context providers, etc.
  return render(ui, { ...options });
};

// Re-export everything from testing-library
export * from "@testing-library/react";
export { customRender as render };
