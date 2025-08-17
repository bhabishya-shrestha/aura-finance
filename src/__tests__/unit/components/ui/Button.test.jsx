import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Button from "../../../../components/ui/Button";
import { IconButton } from "../../../../components/ui/Button";
import { Bell } from "lucide-react";

describe("Button Component", () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  describe("Basic Button", () => {
    it("renders with default props", () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole("button", { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bg-primary-600");
      expect(button).not.toBeDisabled();
    });

    it("renders with different variants", () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-primary-600");

      rerender(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-gray-100");

      rerender(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole("button")).toHaveClass("border-2");

      rerender(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole("button")).toHaveClass("text-primary-600");

      rerender(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-red-600");

      rerender(<Button variant="success">Success</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-green-600");
    });

    it("renders with different sizes", () => {
      const { rerender } = render(<Button size="sm">Small</Button>);
      expect(screen.getByRole("button")).toHaveClass("px-3 py-1.5");

      rerender(<Button size="md">Medium</Button>);
      expect(screen.getByRole("button")).toHaveClass("px-4 py-2");

      rerender(<Button size="lg">Large</Button>);
      expect(screen.getByRole("button")).toHaveClass("px-6 py-3");

      rerender(<Button size="xl">Extra Large</Button>);
      expect(screen.getByRole("button")).toHaveClass("px-8 py-4");
    });

    it("handles click events", () => {
      render(<Button onClick={mockOnClick}>Click me</Button>);

      fireEvent.click(screen.getByRole("button"));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick when disabled", () => {
      render(
        <Button onClick={mockOnClick} disabled>
          Disabled
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();

      fireEvent.click(button);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it("does not call onClick when loading", () => {
      render(
        <Button onClick={mockOnClick} loading>
          Loading
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");

      fireEvent.click(button);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it("shows loading spinner when loading", () => {
      render(<Button loading>Loading</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-busy", "true");

      // Check for loading spinner
      const spinner = button.querySelector("svg");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass("animate-spin");
    });

    it("renders with icon on left", () => {
      render(<Button icon={<Bell />}>With Icon</Button>);

      const button = screen.getByRole("button");
      const icon = button.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("renders with icon on right", () => {
      render(
        <Button icon={<Bell />} iconPosition="right">
          With Icon
        </Button>
      );

      const button = screen.getByRole("button");
      const icon = button.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("renders full width when specified", () => {
      render(<Button fullWidth>Full Width</Button>);

      expect(screen.getByRole("button")).toHaveClass("w-full");
    });

    it("applies custom className", () => {
      render(<Button className="custom-class">Custom</Button>);

      expect(screen.getByRole("button")).toHaveClass("custom-class");
    });

    it("renders as submit button", () => {
      render(<Button type="submit">Submit</Button>);

      expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });
  });

  describe("IconButton Component", () => {
    it("renders with icon", () => {
      render(<IconButton icon={<Bell />} aria-label="Bell" />);

      const button = screen.getByRole("button", { name: /bell/i });
      expect(button).toBeInTheDocument();
      expect(button.querySelector("svg")).toBeInTheDocument();
    });

    it("shows loading spinner when loading", () => {
      render(<IconButton icon={<Bell />} loading aria-label="Loading" />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-busy", "true");

      const spinner = button.querySelector("svg");
      expect(spinner).toHaveClass("animate-spin");
    });

    it("renders with different variants", () => {
      const { rerender } = render(
        <IconButton icon={<Bell />} variant="primary" aria-label="Primary" />
      );
      expect(screen.getByRole("button")).toHaveClass("bg-primary-600");

      rerender(
        <IconButton
          icon={<Bell />}
          variant="secondary"
          aria-label="Secondary"
        />
      );
      expect(screen.getByRole("button")).toHaveClass("bg-gray-100");

      rerender(
        <IconButton icon={<Bell />} variant="ghost" aria-label="Ghost" />
      );
      expect(screen.getByRole("button")).toHaveClass("text-gray-600");

      rerender(
        <IconButton icon={<Bell />} variant="danger" aria-label="Danger" />
      );
      expect(screen.getByRole("button")).toHaveClass("bg-red-600");
    });

    it("renders with different sizes", () => {
      const { rerender } = render(
        <IconButton icon={<Bell />} size="sm" aria-label="Small" />
      );
      expect(screen.getByRole("button")).toHaveClass("w-8 h-8");

      rerender(<IconButton icon={<Bell />} size="md" aria-label="Medium" />);
      expect(screen.getByRole("button")).toHaveClass("w-10 h-10");

      rerender(<IconButton icon={<Bell />} size="lg" aria-label="Large" />);
      expect(screen.getByRole("button")).toHaveClass("w-12 h-12");

      rerender(
        <IconButton icon={<Bell />} size="xl" aria-label="Extra Large" />
      );
      expect(screen.getByRole("button")).toHaveClass("w-14 h-14");
    });

    it("handles click events", () => {
      render(
        <IconButton
          icon={<Bell />}
          onClick={mockOnClick}
          aria-label="Clickable"
        />
      );

      fireEvent.click(screen.getByRole("button"));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick when disabled", () => {
      render(
        <IconButton
          icon={<Bell />}
          onClick={mockOnClick}
          disabled
          aria-label="Disabled"
        />
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();

      fireEvent.click(button);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it("does not call onClick when loading", () => {
      render(
        <IconButton
          icon={<Bell />}
          onClick={mockOnClick}
          loading
          aria-label="Loading"
        />
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();

      fireEvent.click(button);
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes when disabled", () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-disabled", "true");
    });

    it("has proper ARIA attributes when loading", () => {
      render(<Button loading>Loading</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAttribute("aria-busy", "true");
    });

    it("supports keyboard navigation", () => {
      render(<Button onClick={mockOnClick}>Keyboard</Button>);

      const button = screen.getByRole("button");
      button.focus();

      // Button should be focusable by default
      expect(button).toHaveFocus();
    });

    it("has focus styles", () => {
      render(<Button>Focusable</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus:outline-none", "focus:ring-2");
    });
  });

  describe("Performance", () => {
    it("does not re-render unnecessarily", () => {
      const { rerender } = render(<Button>Stable</Button>);

      const button = screen.getByRole("button");
      const initialRender = button.outerHTML;

      rerender(<Button>Stable</Button>);
      expect(button.outerHTML).toBe(initialRender);
    });

    it("handles rapid clicks gracefully", async () => {
      render(<Button onClick={mockOnClick}>Rapid Click</Button>);

      const button = screen.getByRole("button");

      // Simulate rapid clicks
      for (let i = 0; i < 5; i++) {
        fireEvent.click(button);
      }

      await waitFor(() => {
        expect(mockOnClick).toHaveBeenCalledTimes(5);
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles empty children", () => {
      render(<Button></Button>);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("handles null children", () => {
      render(<Button>{null}</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("handles undefined onClick", () => {
      expect(() => {
        render(<Button onClick={undefined}>No Click</Button>);
      }).not.toThrow();
    });

    it("handles invalid variant gracefully", () => {
      render(<Button variant="invalid">Invalid</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      // Should fall back to default variant
      expect(button).toHaveClass("bg-primary-600");
    });

    it("handles invalid size gracefully", () => {
      render(<Button size="invalid">Invalid Size</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      // Should fall back to default size
      expect(button).toHaveClass("px-4 py-2");
    });
  });
});
