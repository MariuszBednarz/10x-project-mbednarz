/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom";
import "@/test/setup"; // Load jsdom setup
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { SearchBar, SearchBarProps } from "./SearchBar";

describe("SearchBar", () => {
  const defaultProps: SearchBarProps = {
    placeholder: "Szukaj szpitala lub oddziału",
    value: "",
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render search input with placeholder", () => {
      render(<SearchBar {...defaultProps} />);

      const input = screen.getByPlaceholderText("Szukaj szpitala lub oddziału");
      expect(input).toBeInTheDocument();
    });

    it("should render search icon", () => {
      render(<SearchBar {...defaultProps} />);

      const searchIcon = screen.getByRole("textbox").parentElement?.querySelector("svg");
      expect(searchIcon).toBeInTheDocument();
    });

    it("should not render clear button when input is empty", () => {
      render(<SearchBar {...defaultProps} />);

      const clearButton = screen.queryByRole("button", { name: /wyczyść wyszukiwanie/i });
      expect(clearButton).not.toBeInTheDocument();
    });

    it("should render clear button when input has value", () => {
      render(<SearchBar {...defaultProps} value="test" />);

      const clearButton = screen.getByRole("button", { name: /wyczyść wyszukiwanie/i });
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should update local value when user types", async () => {
      const user = userEvent.setup();
      render(<SearchBar {...defaultProps} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      expect(input).toHaveValue("test");
    });

    it("should call onChange after debounce delay", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SearchBar {...defaultProps} onChange={onChange} debounceMs={300} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      // Should not call immediately
      expect(onChange).not.toHaveBeenCalled();

      // Should call after debounce delay
      await waitFor(
        () => {
          expect(onChange).toHaveBeenCalledWith("test");
        },
        { timeout: 400 }
      );
    });

    it("should respect minimum characters requirement", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SearchBar {...defaultProps} onChange={onChange} minChars={3} debounceMs={100} />);

      const input = screen.getByRole("textbox");

      // Clear any initial calls (from empty string on mount)
      vi.clearAllMocks();

      await user.type(input, "te");

      // Wait for debounce, but onChange should not be called with "te" (only 2 chars)
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should not have called onChange with "te" (only with "" on initial render)
      // Filter out any empty string calls
      const nonEmptyCalls = onChange.mock.calls.filter((call) => call[0] !== "");
      expect(nonEmptyCalls.length).toBe(0);
    });

    it("should call onChange when minChars requirement is met", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SearchBar {...defaultProps} onChange={onChange} minChars={3} debounceMs={100} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      await waitFor(
        () => {
          expect(onChange).toHaveBeenCalledWith("test");
        },
        { timeout: 200 }
      );
    });

    it("should clear input when clear button is clicked", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SearchBar {...defaultProps} value="test" onChange={onChange} />);

      const clearButton = screen.getByRole("button", { name: /wyczyść wyszukiwanie/i });
      await user.click(clearButton);

      expect(onChange).toHaveBeenCalledWith("");
      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("");
    });

    it("should immediately call onChange when clearing input", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SearchBar {...defaultProps} value="test" onChange={onChange} debounceMs={300} />);

      const clearButton = screen.getByRole("button", { name: /wyczyść wyszukiwanie/i });
      await user.click(clearButton);

      // Should call immediately without debounce
      expect(onChange).toHaveBeenCalledWith("");
    });
  });

  describe("External Value Changes", () => {
    it("should update input when external value prop changes", () => {
      const { rerender } = render(<SearchBar {...defaultProps} value="" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("");

      rerender(<SearchBar {...defaultProps} value="new value" />);
      expect(input).toHaveValue("new value");
    });
  });

  describe("Accessibility", () => {
    it("should have accessible label for input", () => {
      render(<SearchBar {...defaultProps} placeholder="Szukaj" />);

      const input = screen.getByLabelText("Szukaj");
      expect(input).toBeInTheDocument();
    });

    it("should have accessible label for clear button", () => {
      render(<SearchBar {...defaultProps} value="test" />);

      const clearButton = screen.getByLabelText("Wyczyść wyszukiwanie");
      expect(clearButton).toBeInTheDocument();
    });

    it("should set button type to prevent form submission", () => {
      render(<SearchBar {...defaultProps} value="test" />);

      const clearButton = screen.getByRole("button", { name: /wyczyść wyszukiwanie/i });
      expect(clearButton).toHaveAttribute("type", "button");
    });
  });
});
