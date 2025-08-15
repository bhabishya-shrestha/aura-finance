import React, { useState, useEffect } from "react";
import { Cloud, CloudOff, RefreshCw, Unlink, Link } from "lucide-react";
import firebaseSync from "../services/firebaseSync";
import { useFirebaseAuth } from "../contexts/FirebaseAuthContext";

const SyncStatus = () => {
  const { user } = useFirebaseAuth();
  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    syncInProgress: false,
    lastSyncTime: null,
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Update status every 2 seconds
    const interval = setInterval(() => {
      setSyncStatus(firebaseSync.getSyncStatus());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatLastSync = timestamp => {
    if (!timestamp) return "Never";

    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleForceSync = async () => {
    await firebaseSync.forceSync();
  };

  // Don't show anything if no user is authenticated
  if (!user) {
    return null;
  }

  const hasCrossDeviceSync = true; // Firebase Auth provides cross-device sync

  return (
    <div className="fixed bottom-4 right-4 z-50 hidden lg:block">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 min-w-[250px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {hasCrossDeviceSync ? (
              syncStatus.syncInProgress ? (
                <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
              ) : syncStatus.isOnline ? (
                <Cloud className="h-4 w-4 text-green-500" />
              ) : (
                <CloudOff className="h-4 w-4 text-red-500" />
              )
            ) : (
              <Unlink className="h-4 w-4 text-orange-500" />
            )}

            <div className="text-sm">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {hasCrossDeviceSync
                  ? syncStatus.syncInProgress
                    ? "Syncing..."
                    : syncStatus.isOnline
                      ? "Synced"
                      : "Offline"
                  : "Local Only"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {hasCrossDeviceSync
                  ? syncStatus.syncInProgress
                    ? "Updating across devices"
                    : syncStatus.isOnline
                      ? `Last sync: ${formatLastSync(syncStatus.lastSyncTime)}`
                      : "No internet connection"
                  : "Data stored locally"}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {hasCrossDeviceSync &&
              syncStatus.isOnline &&
              !syncStatus.syncInProgress && (
                <button
                  onClick={handleForceSync}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Force sync now"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              )}

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Show sync details"
            >
              <Link className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Sync Progress Bar */}
        {hasCrossDeviceSync && syncStatus.syncInProgress && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div
                className="bg-blue-500 h-1 rounded-full animate-pulse"
                style={{ width: "60%" }}
              ></div>
            </div>
          </div>
        )}

        {/* Sync Details */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs space-y-2">
              <div>
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  Firebase Sync
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  {user.email}
                </div>
                <div className="text-green-600 dark:text-green-400">
                  ✓ Cross-device sync enabled
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncStatus;
