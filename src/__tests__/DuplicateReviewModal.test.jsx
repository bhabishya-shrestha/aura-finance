import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import DuplicateReviewModal from "../components/DuplicateReviewModal";

// Mock the duplicate detector utility
vi.mock("../utils/duplicateDetector", () => ({
  getDuplicateReason: vi.fn(
    () => "same date, same amount, similar description (high confidence)"
  ),
  groupDuplicatesByConfidence: vi.fn(duplicates => ({
    high: duplicates.filter(d => d.confidence >= 0.9),
    medium: duplicates.filter(d => d.confidence >= 0.7 && d.confidence < 0.9),
    low: duplicates.filter(d => d.confidence < 0.7),
    all: duplicates,
  })),
}));

describe("DuplicateReviewModal", () => {
  const mockDuplicates = [
    {
      newTransaction: {
        date: "2024-01-15",
        description: "Grocery Store",
        amount: -85.5,
        category: "Groceries",
      },
      existingTransaction: {
        id: 1,
        date: "2024-01-15",
        description: "Grocery Store",
        amount: -85.5,
        category: "Groceries",
      },
      confidence: 0.95,
      matches: {
        date: true,
        amount: true,
        description: true,
        category: true,
      },
    },
    {
      newTransaction: {
        date: "2024-01-14",
        description: "Gas Station",
        amount: -45.0,
        category: "Transport",
      },
      existingTransaction: {
        id: 2,
        date: "2024-01-14",
        description: "Gas Station",
        amount: -45.0,
        category: "Transport",
      },
      confidence: 0.85,
      matches: {
        date: true,
        amount: true,
        description: true,
        category: true,
      },
    },
  ];

  const mockNonDuplicates = [
    {
      date: "2024-01-20",
      description: "Restaurant",
      amount: -25.0,
      category: "Restaurants",
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    duplicates: mockDuplicates,
    nonDuplicates: mockNonDuplicates,
    onConfirm: vi.fn(),
    onSkipAll: vi.fn(),
    summary: {
      total: 3,
      duplicates: 2,
      nonDuplicates: 1,
      duplicatePercentage: 66.67,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when open", () => {
    render(<DuplicateReviewModal {...defaultProps} />);

    expect(
      screen.getByText("Review Duplicate Transactions")
    ).toBeInTheDocument();
    expect(
      screen.getByText("2 potential duplicates found")
    ).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<DuplicateReviewModal {...defaultProps} isOpen={false} />);

    expect(
      screen.queryByText("Review Duplicate Transactions")
    ).not.toBeInTheDocument();
  });

  it("displays summary statistics correctly", () => {
    render(<DuplicateReviewModal {...defaultProps} />);

    // Check that summary statistics sections exist
    expect(screen.getByText("Non-duplicates")).toBeInTheDocument();
    expect(screen.getByText("Duplicates")).toBeInTheDocument();
    expect(screen.getByText("Selected")).toBeInTheDocument();
    expect(screen.getByText("Skipped")).toBeInTheDocument();
  });

  it("displays duplicate transactions with confidence levels", () => {
    render(<DuplicateReviewModal {...defaultProps} />);

    expect(screen.getByText("Grocery Store")).toBeInTheDocument();
    expect(screen.getByText("Gas Station")).toBeInTheDocument();
    expect(screen.getByText("High Confidence")).toBeInTheDocument();
    expect(screen.getByText("Medium Confidence")).toBeInTheDocument();
  });

  it("allows selecting individual duplicates", () => {
    render(<DuplicateReviewModal {...defaultProps} />);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2); // One for each duplicate

    // Select first duplicate
    fireEvent.click(checkboxes[0]);

    // Check that the checkbox is checked
    expect(checkboxes[0]).toBeChecked();
  });

  it("allows selecting all duplicates", () => {
    render(<DuplicateReviewModal {...defaultProps} />);

    const selectAllButton = screen.getByText("Select All");
    fireEvent.click(selectAllButton);

    // Check that all checkboxes are checked
    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
  });

  it("allows selecting none", () => {
    render(<DuplicateReviewModal {...defaultProps} />);

    // First select all
    const selectAllButton = screen.getByText("Select All");
    fireEvent.click(selectAllButton);

    // Then select none
    const selectNoneButton = screen.getByText("Select None");
    fireEvent.click(selectNoneButton);

    // Check that no checkboxes are checked
    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach(checkbox => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it("toggles details view", () => {
    render(<DuplicateReviewModal {...defaultProps} />);

    const showDetailsButton = screen.getByText("Show Details");
    fireEvent.click(showDetailsButton);

    // Should show detailed comparison - there are multiple instances, so use getAllByText
    const newTransactionElements = screen.getAllByText("New Transaction");
    expect(newTransactionElements.length).toBeGreaterThan(0);

    const existingTransactionElements = screen.getAllByText(
      "Existing Transaction"
    );
    expect(existingTransactionElements.length).toBeGreaterThan(0);

    // Toggle back
    const hideDetailsButton = screen.getByText("Hide Details");
    fireEvent.click(hideDetailsButton);

    // Details should be hidden
    expect(screen.queryByText("New Transaction")).not.toBeInTheDocument();
  });

  it("calls onConfirm with selected transactions when import button is clicked", () => {
    render(<DuplicateReviewModal {...defaultProps} />);

    // Select first duplicate
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    // Click import button
    const importButton = screen.getByText("Import 2 Transactions"); // 1 selected + 1 non-duplicate
    fireEvent.click(importButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledWith([
      mockNonDuplicates[0], // Non-duplicate
      mockDuplicates[0].newTransaction, // Selected duplicate
    ]);
  });

  it("calls onSkipAll when skip button is clicked", () => {
    render(<DuplicateReviewModal {...defaultProps} />);

    const skipButton = screen.getByText("Skip All Duplicates");
    fireEvent.click(skipButton);

    expect(defaultProps.onSkipAll).toHaveBeenCalledWith(mockNonDuplicates);
  });

  it("calls onClose when cancel button is clicked", () => {
    render(<DuplicateReviewModal {...defaultProps} />);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onClose when X button is clicked", () => {
    render(<DuplicateReviewModal {...defaultProps} />);

    // Find the X button by looking for the button with the X icon
    const closeButton = screen.getByRole("button", { name: "" });
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("displays no duplicates message when no duplicates exist", () => {
    render(<DuplicateReviewModal {...defaultProps} duplicates={[]} />);

    expect(screen.getByText("No Duplicates Found")).toBeInTheDocument();
    expect(
      screen.getByText("All 1 transactions will be added automatically.")
    ).toBeInTheDocument();
  });

  it("disables import button when no transactions are selected", () => {
    render(<DuplicateReviewModal {...defaultProps} nonDuplicates={[]} />);

    const importButton = screen.getByText("Import 0 Transactions");
    expect(importButton).toBeDisabled();
  });

  it("formats amounts correctly", () => {
    render(<DuplicateReviewModal {...defaultProps} />);

    expect(screen.getByText("-$85.50")).toBeInTheDocument();
    expect(screen.getByText("-$45.00")).toBeInTheDocument();
  });

  it("formats dates correctly", () => {
    render(<DuplicateReviewModal {...defaultProps} />);

    // Check that dates are formatted correctly by looking for the date elements
    const dateElements = screen.getAllByText(/Jan \d+, 2024/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it("displays duplicate reasons", () => {
    render(<DuplicateReviewModal {...defaultProps} />);

    const reasons = screen.getAllByText(
      /same date, same amount, similar description/
    );
    expect(reasons).toHaveLength(2); // One for each duplicate
  });

  it("handles responsive design for mobile", () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<DuplicateReviewModal {...defaultProps} />);

    // Should still render all content
    expect(
      screen.getByText("Review Duplicate Transactions")
    ).toBeInTheDocument();
    expect(screen.getByText("Grocery Store")).toBeInTheDocument();
  });
});
