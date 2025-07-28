import React, { useState, useEffect, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import {
  CreditCard,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  Info,
  X,
} from "lucide-react";
import {
  plaidService,
  plaidDatabase,
  plaidUsageTracker,
} from "../services/plaidService";
import { useAuth } from "../contexts/AuthContext";

const PlaidLink = ({ onSuccess, onError, className = "" }) => {
  const { user } = useAuth();
  const [linkToken, setLinkToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usageInfo, setUsageInfo] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Load usage information
  const loadUsageInfo = useCallback(async () => {
    try {
      const limits = await plaidUsageTracker.checkFreeTierLimits(user.id);
      setUsageInfo(limits);
    } catch (error) {
      // Silent fail for usage info loading
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadUsageInfo();
    }
  }, [user?.id, loadUsageInfo]);

  // Create link token
  const createLinkToken = useCallback(async () => {
    if (!user?.id) {
      setError("User not authenticated");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check free tier limits before creating link token
      const limits = await plaidUsageTracker.checkFreeTierLimits(user.id);

      if (!limits.isWithinLimits) {
        setError(
          `Monthly transaction limit reached (${limits.total_transactions}/2000). Please wait until next month or upgrade your plan.`
        );
        setIsLoading(false);
        return;
      }

      const response = await plaidService.createLinkToken(
        user.id,
        "Aura Finance"
      );
      setLinkToken(response.link_token);
    } catch (error) {
      setError("Failed to initialize bank connection. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Handle Plaid Link success
  const onPlaidSuccess = useCallback(
    async (publicToken, metadata) => {
      if (!user?.id) {
        setError("User not authenticated");
        return;
      }

      setIsConnecting(true);
      setError(null);

      try {
        // Exchange public token for access token
        const exchangeResponse =
          await plaidService.exchangePublicToken(publicToken);

        // Get institution information
        const institution = await plaidService.getInstitution(
          metadata.institution.institution_id
        );

        // Store Plaid item in database
        const itemData = {
          item_id: exchangeResponse.item_id,
          access_token: exchangeResponse.access_token,
          institution_id: metadata.institution.institution_id,
          status: "good",
        };

        await plaidDatabase.storePlaidItem(user.id, itemData);

        // Get and store accounts
        const accounts = await plaidService.getAccounts(
          exchangeResponse.access_token
        );
        await plaidDatabase.storeAccounts(
          user.id,
          exchangeResponse.item_id,
          accounts
        );

        // Get recent transactions (last 30 days)
        const endDate = new Date().toISOString().split("T")[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        const transactionsResponse = await plaidService.getTransactions(
          exchangeResponse.access_token,
          startDate,
          endDate,
          { count: 100 }
        );

        if (transactionsResponse.transactions.length > 0) {
          await plaidDatabase.storeTransactions(
            user.id,
            exchangeResponse.item_id,
            transactionsResponse.transactions
          );
        }

        // Track usage
        await plaidUsageTracker.trackRequest(user.id, "/link/token/create");
        await plaidUsageTracker.trackRequest(
          user.id,
          "/item/public_token/exchange"
        );
        await plaidUsageTracker.trackRequest(user.id, "/accounts/get");
        await plaidUsageTracker.trackRequest(user.id, "/transactions/get");

        // Reload usage info
        await loadUsageInfo();

        // Call success callback
        if (onSuccess) {
          onSuccess({
            itemId: exchangeResponse.item_id,
            institution: institution,
            accounts: accounts,
            transactionsCount: transactionsResponse.transactions.length,
          });
        }
      } catch (error) {
        setError("Failed to connect bank account. Please try again.");

        if (onError) {
          onError(error);
        }
      } finally {
        setIsConnecting(false);
      }
    },
    [user?.id, onSuccess, onError, loadUsageInfo]
  );

  // Handle Plaid Link exit
  const onPlaidExit = useCallback(err => {
    if (err) {
      setError("Bank connection was cancelled or failed. Please try again.");
    }
    setIsConnecting(false);
  }, []);

  // Initialize Plaid Link
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: onPlaidExit,
  });

  // Handle connect button click
  const handleConnect = () => {
    if (!linkToken) {
      createLinkToken();
    } else {
      open();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Usage Information */}
      {usageInfo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Free Tier Usage
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {usageInfo.transactionsRemaining} of 2,000 monthly transactions
                remaining
              </p>
              <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, ((2000 - usageInfo.transactionsRemaining) / 2000) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900 dark:text-red-100">
                Connection Error
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

      {/* Connect Button */}
      <div className="space-y-3">
        <button
          onClick={handleConnect}
          disabled={isLoading || isConnecting || !ready}
          className={`
            w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            ${
              isLoading || isConnecting
                ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            }
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Initializing...
            </>
          ) : isConnecting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connecting Bank Account...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Connect Bank Account
            </>
          )}
        </button>

        {/* Security Notice */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Shield className="w-3 h-3" />
            <span>Bank-level security with Plaid</span>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          What you can do:
        </h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>Automatically import transactions</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>Track account balances in real-time</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>Secure, read-only access to your data</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>Disconnect anytime from your settings</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PlaidLink;
