import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import useStore from "../store";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { transactions, accounts } = useStore();
  const searchRef = useRef(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search functionality
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchTerm = query.toLowerCase();
    const searchResults = [];

    // Search transactions
    transactions.forEach((transaction) => {
      if (
        transaction.description.toLowerCase().includes(searchTerm) ||
        transaction.category.toLowerCase().includes(searchTerm) ||
        transaction.amount.toString().includes(searchTerm)
      ) {
        searchResults.push({
          type: "transaction",
          id: transaction.id,
          title: transaction.description,
          subtitle: `${transaction.category} • ${new Date(transaction.date).toLocaleDateString()}`,
          amount: transaction.amount,
          icon: "💰",
        });
      }
    });

    // Search accounts
    accounts.forEach((account) => {
      if (
        account.name.toLowerCase().includes(searchTerm) ||
        account.type.toLowerCase().includes(searchTerm) ||
        account.balance.toString().includes(searchTerm)
      ) {
        searchResults.push({
          type: "account",
          id: account.id,
          title: account.name,
          subtitle: `${account.type} • Balance: $${account.balance.toLocaleString()}`,
          amount: account.balance,
          icon: "🏦",
        });
      }
    });

    setResults(searchResults.slice(0, 8)); // Limit to 8 results
    setIsOpen(searchResults.length > 0);
    setSelectedIndex(-1);
  }, [query, transactions, accounts]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setQuery("");
        setSelectedIndex(-1);
        break;
    }
  };

  const handleResultClick = (result) => {
    // Handle result click - you can navigate to the specific item
    // Log for development purposes only
    if (import.meta.env.DEV) {
      console.log("Selected:", result);
    }
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(-1);
  };

  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search transactions, accounts..."
          className="fidelity-input w-full pl-10 pr-10 text-sm"
          aria-label="Search"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 fidelity-card shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </div>
            {results.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  index === selectedIndex
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg">{result.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {result.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {result.subtitle}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      result.amount >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {result.amount >= 0 ? "+" : ""}$
                    {Math.abs(result.amount).toLocaleString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && query.trim().length > 0 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 fidelity-card shadow-lg z-50">
          <div className="p-4 text-center">
            <div className="text-gray-500 dark:text-gray-400 text-sm">
              No results found for &quot;{query}&quot;
            </div>
            <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Try searching for transaction descriptions, categories, or account
              names
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
