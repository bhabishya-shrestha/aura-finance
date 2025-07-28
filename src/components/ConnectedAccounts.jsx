import React, { useState, useEffect } from "react";
import {
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Trash2,
  Bank,
  DollarSign,
  Calendar,
  Shield,
  X,
} from "lucide-react";
import {
  plaidDatabase,
  plaidService,
  plaidUsageTracker,
} from "../services/plaidService";
import { useAuth } from "../contexts/AuthContext";

const ConnectedAccounts = ({ onRefresh }) => {
  const { user } = useAuth();
  const [connectedItems, setConnectedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncingItem, setSyncingItem] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadConnectedAccounts();
    }
  }, [user?.id]);

  const loadConnectedAccounts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const items = await plaidDatabase.getPlaidItems(user.id);
      setConnectedItems(items);
    } catch (error) {
      console.error("Error loading connected accounts:", error);
      setError("Failed to load connected accounts");
    } finally {
      setIsLoading(false);
    }
  };

  const syncAccount = async (itemId, accessToken) => {
    try {
      setSyncingItem(itemId);
      setError(null);

      // Check free tier limits before syncing
      const limits = await plaidUsageTracker.checkFreeTierLimits(user.id);
      if (!limits.isWithinLimits) {
        setError(
          "Monthly transaction limit reached. Please wait until next month."
        );
        return;
      }

      // Get recent transactions (last 7 days)
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const transactionsResponse = await plaidService.getTransactions(
        accessToken,
        startDate,
        endDate,
        { count: 100 }
      );

      if (transactionsResponse.transactions.length > 0) {
        await plaidDatabase.storeTransactions(
          user.id,
          itemId,
          transactionsResponse.transactions
        );
      }

      // Update last sync time
      await plaidDatabase.updatePlaidItem(user.id, itemId, {
        last_sync: new Date().toISOString(),
      });

      // Track usage
      await plaidUsageTracker.trackRequest(user.id, "/transactions/get");

      // Reload accounts
      await loadConnectedAccounts();

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error syncing account:", error);
      setError("Failed to sync account. Please try again.");
    } finally {
      setSyncingItem(null);
    }
  };

  const removeAccount = async (itemId, accessToken) => {
    try {
      setRemovingItem(itemId);
      setError(null);

      // Remove from Plaid
      await plaidService.removeItem(accessToken);

      // Remove from database
      await plaidDatabase.removePlaidItem(user.id, itemId);

      // Reload accounts
      await loadConnectedAccounts();

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error removing account:", error);
      setError("Failed to remove account. Please try again.");
    } finally {
      setRemovingItem(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "good":
        return "text-green-600 dark:text-green-400";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400";
      case "bad":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "good":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "bad":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading connected accounts...
        </span>
      </div>
    );
  }

  if (connectedItems.length === 0) {
    return (
      <div className="text-center py-8">
        <Bank className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Connected Accounts
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your bank accounts to automatically import transactions and
          track balances.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900 dark:text-red-100">
                Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Connected Accounts List */}
      <div className="space-y-4">
        {connectedItems.map((item) => (
          <div
            key={item.item_id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Bank className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {item.institution_id}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={`flex items-center gap-1 ${getStatusColor(item.status)}`}
                      >
                        {getStatusIcon(item.status)}
                        <span className="capitalize">{item.status}</span>
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        •
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        Last sync: {formatDate(item.last_sync)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Shield className="w-3 h-3" />
                  <span>Read-only access • Bank-level security</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => syncAccount(item.item_id, item.access_token)}
                  disabled={
                    syncingItem === item.item_id || item.status !== "good"
                  }
                  className={`
                    p-2 rounded-lg transition-colors duration-200
                    ${
                      syncingItem === item.item_id
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                        : item.status === "good"
                          ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                    }
                  `}
                  title="Sync transactions"
                >
                  {syncingItem === item.item_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => removeAccount(item.item_id, item.access_token)}
                  disabled={removingItem === item.item_id}
                  className={`
                    p-2 rounded-lg transition-colors duration-200
                    ${
                      removingItem === item.item_id
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40"
                    }
                  `}
                  title="Disconnect account"
                >
                  {removingItem === item.item_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Security Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Your Data is Secure
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              We use Plaid's bank-level security to access your financial data.
              We never store your bank credentials and only have read-only
              access to your accounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectedAccounts;
