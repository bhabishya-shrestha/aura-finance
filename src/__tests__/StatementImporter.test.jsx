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

// Mock the DuplicateReviewModal component
vi.mock("../components/DuplicateReviewModal", () => ({
  default: function MockDuplicateReviewModal({
    isOpen,
    onClose,
    onConfirm,
    onSkipAll,
  }) {
    if (!isOpen) return null;

    return (
      <div data-testid="duplicate-review-modal">
        <button
          onClick={() => onConfirm([{ description: "Selected Transaction" }])}
        >
          Confirm Selected
        </button>
        <button
          onClick={() =>
            onSkipAll([{ description: "Non-duplicate Transaction" }])
          }
        >
          Skip All
        </button>
        <button onClick={onClose}>Close Modal</button>
      </div>
    );
  },
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

  it("shows file upload area", () => {
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
    expect(screen.getByText("CSV Files")).toBeInTheDocument();
    expect(screen.getByText("PDF Files")).toBeInTheDocument();
    expect(screen.getByText("Images")).toBeInTheDocument();
  });

  it("handles file selection", async () => {
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

    // Simulate file selection
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Should show analysis results
    await waitFor(() => {
      expect(screen.getByText("Analysis Results")).toBeInTheDocument();
    });
  });

  it("validates file size", async () => {
    render(
      <StatementImporter
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    // Create a file larger than 20MB
    const largeFile = new File(["x".repeat(21 * 1024 * 1024)], "large.csv", {
      type: "text/csv",
    });
    const input = screen.getByRole("button", { name: "Choose File" });

    fireEvent.click(input);

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(
        screen.getByText("File size too large. Maximum 20MB allowed.")
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
          "Unsupported file format. Please upload an image (JPG, PNG, GIF, WebP, HEIC) or PDF."
        )
      ).toBeInTheDocument();
    });
  });

  it("processes CSV files successfully", async () => {
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
      expect(screen.getByText("CSV File")).toBeInTheDocument();
      expect(screen.getByText("high")).toBeInTheDocument();
      expect(screen.getByText("excellent")).toBeInTheDocument();
    });
  });

  it("processes image files with Gemini", async () => {
    const mockGeminiResponse = {
      documentType: "Receipt",
      source: "Walmart",
      confidence: "high",
      quality: "good",
      transactions: [
        {
          date: "2024-01-01",
          description: "Walmart Purchase",
          amount: -50.25,
          type: "expense",
          category: "Groceries",
        },
      ],
      notes: "Successfully extracted transaction data",
    };

    geminiService.analyzeImage.mockResolvedValue(mockGeminiResponse);
    geminiService.convertToTransactions.mockReturnValue([
      {
        id: 1,
        date: new Date("2024-01-01"),
        description: "Walmart Purchase",
        amount: -50.25,
        category: "Groceries",
        accountId: 1,
        selected: true,
        type: "expense",
        source: "gemini-ocr",
        confidence: "high",
      },
    ]);
    geminiService.getProcessingSummary.mockReturnValue({
      transactionCount: 1,
      confidence: "high",
      quality: "good",
      documentType: "Receipt",
      source: "Walmart",
      notes: "Successfully extracted transaction data",
    });

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
      expect(geminiService.analyzeImage).toHaveBeenCalledWith(file);
      expect(screen.getByText("Analysis Results")).toBeInTheDocument();
      expect(screen.getByText("Receipt")).toBeInTheDocument();
      expect(screen.getByText("Walmart")).toBeInTheDocument();
    });
  });

  it("shows transaction preview", async () => {
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

    // Wait for the 1-second delay to complete and preview to show
    await waitFor(
      () => {
        expect(screen.getByText("Analysis Results")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    await waitFor(() => {
      expect(screen.getByText("Test Transaction")).toBeInTheDocument();
      expect(screen.getByText("+$100.00")).toBeInTheDocument();
    });
  });

  it("handles import button click", async () => {
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

    // Mock checkForDuplicates to return no duplicates
    mockCheckForDuplicates.mockResolvedValue({
      duplicates: [],
      nonDuplicates: [
        {
          id: 1,
          date: new Date("2024-01-01"),
          description: "Test Transaction",
          amount: 100,
          category: "Other",
          accountId: 1,
          selected: true,
        },
      ],
      summary: {
        total: 1,
        duplicates: 0,
        nonDuplicates: 1,
      },
    });

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
      const importButton = screen.getByText("Import 1 Transactions");
      fireEvent.click(importButton);
    });

    await waitFor(() => {
      expect(mockAddTransactions).toHaveBeenCalled();
    });
  });

  it("handles close button", () => {
    render(
      <StatementImporter
        isOpen={true}
        onClose={mockOnClose}
        onImportComplete={mockOnImportComplete}
      />
    );

    const closeButton = screen.getByRole("button", { name: "" }); // Close button has no accessible name
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows processing progress", async () => {
    const { parseStatement } = await import("../utils/statementParser");
    parseStatement.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve([
                {
                  id: 1,
                  date: new Date("2024-01-01"),
                  description: "Test Transaction",
                  amount: 100,
                  category: "Other",
                  accountId: 1,
                  selected: true,
                },
              ]),
            100
          )
        )
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

    await waitFor(() => {
      expect(screen.getByText("Analysis Results")).toBeInTheDocument();
    });
  });

  it("handles drag and drop", async () => {
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
    const dropZone = screen
      .getByText("Drop your file here or click to browse")
      .closest("div");

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file],
      },
    });

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

  it("checks for duplicates when importing transactions", async () => {
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

    // Mock duplicate detection results
    mockCheckForDuplicates.mockResolvedValue({
      duplicates: [
        {
          newTransaction: {
            date: new Date("2024-01-01"),
            description: "Test Transaction",
            amount: 100,
            category: "Other",
          },
          existingTransaction: {
            id: 1,
            date: new Date("2024-01-01"),
            description: "Test Transaction",
            amount: 100,
            category: "Other",
          },
          confidence: 0.95,
          matches: {
            date: true,
            amount: true,
            description: true,
            category: true,
          },
        },
      ],
      nonDuplicates: [],
      summary: {
        total: 1,
        duplicates: 1,
        nonDuplicates: 0,
        duplicatePercentage: 100,
      },
    });

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

    // Click import button
    const importButton = screen.getByText(/Import \d+ Transactions/);
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(mockCheckForDuplicates).toHaveBeenCalled();
      expect(screen.getByTestId("duplicate-review-modal")).toBeInTheDocument();
    });
  });

  it("imports transactions directly when no duplicates found", async () => {
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

    // Mock no duplicates found
    mockCheckForDuplicates.mockResolvedValue({
      duplicates: [],
      nonDuplicates: [
        {
          date: new Date("2024-01-01"),
          description: "Test Transaction",
          amount: 100,
          category: "Other",
        },
      ],
      summary: {
        total: 1,
        duplicates: 0,
        nonDuplicates: 1,
        duplicatePercentage: 0,
      },
    });

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

    // Click import button
    const importButton = screen.getByText(/Import \d+ Transactions/);
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(mockCheckForDuplicates).toHaveBeenCalled();
      expect(mockAddTransactions).toHaveBeenCalled();
      expect(
        screen.queryByTestId("duplicate-review-modal")
      ).not.toBeInTheDocument();
    });
  });

  it("handles duplicate review confirmation", async () => {
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

    // Mock duplicate detection results
    mockCheckForDuplicates.mockResolvedValue({
      duplicates: [
        {
          newTransaction: {
            date: new Date("2024-01-01"),
            description: "Test Transaction",
            amount: 100,
            category: "Other",
          },
          existingTransaction: {
            id: 1,
            date: new Date("2024-01-01"),
            description: "Test Transaction",
            amount: 100,
            category: "Other",
          },
          confidence: 0.95,
          matches: {
            date: true,
            amount: true,
            description: true,
            category: true,
          },
        },
      ],
      nonDuplicates: [],
      summary: {
        total: 1,
        duplicates: 1,
        nonDuplicates: 0,
        duplicatePercentage: 100,
      },
    });

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

    // Click import button to trigger duplicate check
    const importButton = screen.getByText(/Import \d+ Transactions/);
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-review-modal")).toBeInTheDocument();
    });

    // Click confirm selected in duplicate modal
    const confirmButton = screen.getByText("Confirm Selected");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockAddTransactions).toHaveBeenCalled();
    });
  });

  it("handles skipping all duplicates", async () => {
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

    // Mock duplicate detection results with non-duplicates
    mockCheckForDuplicates.mockResolvedValue({
      duplicates: [
        {
          newTransaction: {
            date: new Date("2024-01-01"),
            description: "Duplicate Transaction",
            amount: 100,
            category: "Other",
          },
          existingTransaction: {
            id: 1,
            date: new Date("2024-01-01"),
            description: "Duplicate Transaction",
            amount: 100,
            category: "Other",
          },
          confidence: 0.95,
          matches: {
            date: true,
            amount: true,
            description: true,
            category: true,
          },
        },
      ],
      nonDuplicates: [
        {
          date: new Date("2024-01-02"),
          description: "Non-duplicate Transaction",
          amount: 50,
          category: "Other",
        },
      ],
      summary: {
        total: 2,
        duplicates: 1,
        nonDuplicates: 1,
        duplicatePercentage: 50,
      },
    });

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

    // Click import button to trigger duplicate check
    const importButton = screen.getByText(/Import \d+ Transactions/);
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(screen.getByTestId("duplicate-review-modal")).toBeInTheDocument();
    });

    // Click skip all in duplicate modal
    const skipButton = screen.getByText("Skip All");
    fireEvent.click(skipButton);

    await waitFor(() => {
      expect(mockAddTransactions).toHaveBeenCalled();
    });
  });
});
