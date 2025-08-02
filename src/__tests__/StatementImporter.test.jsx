import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import StatementImporter from "../components/StatementImporter";
import useStore from "../store";
import geminiService from "../services/geminiService";

// Mock the store
vi.mock("../store", () => ({
  default: vi.fn(),
}));

// Mock the Gemini service
vi.mock("../services/geminiService", () => ({
  default: {
    analyzeImage: vi.fn(),
    convertToTransactions: vi.fn(),
    getProcessingSummary: vi.fn(),
  },
}));

// Mock the statement parser
vi.mock("../utils/statementParser", () => ({
  parseStatement: vi.fn(),
}));

describe("StatementImporter", () => {
  const mockAddTransactions = vi.fn();
  const mockCheckForDuplicates = vi.fn();
  const mockAddTransactionsWithDuplicateHandling = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnImportComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useStore.mockReturnValue({
      addTransactions: mockAddTransactions,
      checkForDuplicates: mockCheckForDuplicates,
      addTransactionsWithDuplicateHandling:
        mockAddTransactionsWithDuplicateHandling,
    });
  });

  it("renders when open", () => {
    render(
      <StatementImporter
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    expect(screen.getByText("Import Statement")).toBeInTheDocument();
    expect(
      screen.getByText("Upload your bank or credit card statement")
    ).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <StatementImporter
        isOpen={false}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    expect(screen.queryByText("Import Statement")).not.toBeInTheDocument();
  });

  it("closes when close button is clicked", () => {
    render(
      <StatementImporter
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const closeButton = screen.getByRole("button", { name: "" });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("processes CSV file and shows results", async () => {
    const { parseStatement } = await import("../utils/statementParser");
    parseStatement.mockResolvedValue([
      {
        id: 1,
        date: new Date("2024-01-01"),
        description: "Test Transaction",
        amount: 100,
        category: "Other",
        accountId: 1,
        selected: true,
      },
    ]);

    render(
      <StatementImporter
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const file = new File(["test"], "test.csv", { type: "text/csv" });
    const input = screen.getByRole("button", { name: "Choose File" });

    fireEvent.click(input);

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Analysis Results")).toBeInTheDocument();
    });
  });

  it("shows error for no transactions found", async () => {
    const { parseStatement } = await import("../utils/statementParser");
    parseStatement.mockResolvedValue([]);

    render(
      <StatementImporter
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const file = new File(["test"], "test.csv", { type: "text/csv" });
    const input = screen.getByRole("button", { name: "Choose File" });

    fireEvent.click(input);

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText("No transactions found in the file.")
      ).toBeInTheDocument();
    });
  });

  it("handles Gemini API errors gracefully", async () => {
    geminiService.analyzeImage.mockRejectedValue(new Error("API Error"));

    render(
      <StatementImporter
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const file = new File(["test"], "receipt.jpg", { type: "image/jpeg" });
    const input = screen.getByRole("button", { name: "Choose File" });

    fireEvent.click(input);

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("API Error")).toBeInTheDocument();
    });
  });

  it("calls onImportComplete when importing all transactions", async () => {
    const { parseStatement } = await import("../utils/statementParser");
    parseStatement.mockResolvedValue([
      {
        id: 1,
        date: new Date("2024-01-01"),
        description: "Test Transaction",
        amount: 100,
        category: "Other",
        accountId: 1,
        selected: true,
      },
    ]);

    render(
      <StatementImporter
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const file = new File(["test"], "test.csv", { type: "text/csv" });
    const input = screen.getByRole("button", { name: "Choose File" });

    fireEvent.click(input);

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Analysis Results")).toBeInTheDocument();
    });

    // Click import all button
    const importButton = screen.getByText(/Import \d+ Transactions/);
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(mockOnImportComplete).toHaveBeenCalledWith([
        {
          id: 1,
          date: new Date("2024-01-01"),
          description: "Test Transaction",
          amount: 100,
          category: "Other",
          accountId: 1,
          selected: true,
        },
      ]);
    });
  });

  it("calls onImportComplete with selected transactions only", async () => {
    const { parseStatement } = await import("../utils/statementParser");
    parseStatement.mockResolvedValue([
      {
        id: 1,
        date: new Date("2024-01-01"),
        description: "Test Transaction 1",
        amount: 100,
        category: "Other",
        accountId: 1,
        selected: true,
      },
      {
        id: 2,
        date: new Date("2024-01-02"),
        description: "Test Transaction 2",
        amount: 200,
        category: "Other",
        accountId: 1,
        selected: false,
      },
    ]);

    render(
      <StatementImporter
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const file = new File(["test"], "test.csv", { type: "text/csv" });
    const input = screen.getByRole("button", { name: "Choose File" });

    fireEvent.click(input);

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Analysis Results")).toBeInTheDocument();
    });

    // Click import selected button
    const importSelectedButton = screen.getByText(/Import Selected/);
    fireEvent.click(importSelectedButton);

    await waitFor(() => {
      expect(mockOnImportComplete).toHaveBeenCalledWith([
        {
          id: 1,
          date: new Date("2024-01-01"),
          description: "Test Transaction 1",
          amount: 100,
          category: "Other",
          accountId: 1,
          selected: true,
        },
      ]);
    });
  });

  it("shows file upload area with drag and drop text", () => {
    render(
      <StatementImporter
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    expect(
      screen.getByText("Drop your file here or click to browse")
    ).toBeInTheDocument();
    expect(screen.getByText("Choose File")).toBeInTheDocument();
  });

  it("toggles transaction selection", async () => {
    const { parseStatement } = await import("../utils/statementParser");
    parseStatement.mockResolvedValue([
      {
        id: 1,
        date: new Date("2024-01-01"),
        description: "Test Transaction",
        amount: 100,
        category: "Other",
        accountId: 1,
        selected: true,
      },
    ]);

    render(
      <StatementImporter
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const file = new File(["test"], "test.csv", { type: "text/csv" });
    const input = screen.getByRole("button", { name: "Choose File" });

    fireEvent.click(input);

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Analysis Results")).toBeInTheDocument();
    });

    // Click on the transaction to deselect it
    const transaction = screen.getByText("Test Transaction");
    fireEvent.click(transaction);

    // Check that the import selected button shows 0
    const importSelectedButton = screen.getByText(/Import Selected \(0\)/);
    expect(importSelectedButton).toBeInTheDocument();
  });

  it("toggles all transactions selection", async () => {
    const { parseStatement } = await import("../utils/statementParser");
    parseStatement.mockResolvedValue([
      {
        id: 1,
        date: new Date("2024-01-01"),
        description: "Test Transaction 1",
        amount: 100,
        category: "Other",
        accountId: 1,
        selected: true,
      },
      {
        id: 2,
        date: new Date("2024-01-02"),
        description: "Test Transaction 2",
        amount: 200,
        category: "Other",
        accountId: 1,
        selected: false,
      },
    ]);

    render(
      <StatementImporter
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const file = new File(["test"], "test.csv", { type: "text/csv" });
    const input = screen.getByRole("button", { name: "Choose File" });

    fireEvent.click(input);

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Analysis Results")).toBeInTheDocument();
    });

    // Click "Select All" to select all transactions
    const selectAllButton = screen.getByText("Select All");
    fireEvent.click(selectAllButton);

    // Check that the import selected button shows 2
    const importSelectedButton = screen.getByText(/Import Selected \(2\)/);
    expect(importSelectedButton).toBeInTheDocument();
  });

  it("shows processing state while analyzing file", async () => {
    const { parseStatement } = await import("../utils/statementParser");
    // Delay the resolution to show processing state
    parseStatement.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    render(
      <StatementImporter
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const file = new File(["test"], "test.csv", { type: "text/csv" });
    const input = screen.getByRole("button", { name: "Choose File" });

    fireEvent.click(input);

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Check that processing state is shown
    expect(screen.getByText("Processing your statement")).toBeInTheDocument();
  });

  it("validates file size", async () => {
    render(
      <StatementImporter
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    // Create a file larger than 10MB
    const largeFile = new File(["x".repeat(11 * 1024 * 1024)], "large.csv", {
      type: "text/csv",
    });
    const input = screen.getByRole("button", { name: "Choose File" });

    fireEvent.click(input);

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(
        screen.getByText("File size must be less than 10MB.")
      ).toBeInTheDocument();
    });
  });

  it("validates file type", async () => {
    render(
      <StatementImporter
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const invalidFile = new File(["test"], "test.txt", { type: "text/plain" });
    const input = screen.getByRole("button", { name: "Choose File" });

    fireEvent.click(input);

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(
          "Please select a valid file type: CSV, PDF, or image files (JPEG, PNG, GIF, WebP)."
        )
      ).toBeInTheDocument();
    });
  });
});
