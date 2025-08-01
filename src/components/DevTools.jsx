import React, { useState, useEffect } from "react";
import {
  Settings,
  Bug,
  Database,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  TestTube,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  isDevelopment,
  devLog,
  checkEnvironmentVariables,
  devTestUtils,
  getEnvironment,
  getBaseUrl,
  getOAuthRedirectUrl,
} from "../utils/devHelpers";

const DevTools = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("environment");
  const [envCheck, setEnvCheck] = useState(null);
  const [authState, setAuthState] = useState(null);
  const [showAuthData, setShowAuthData] = useState(false);

  useEffect(() => {
    if (isDevelopment()) {
      // Run environment check on mount
      const check = checkEnvironmentVariables();
      setEnvCheck(check);

      // Get initial auth state
      setAuthState(devTestUtils.getAuthState());
    }
  }, []);

  // Only render in development
  if (!isDevelopment()) {
    return null;
  }

  const handleRefreshAuthState = () => {
    setAuthState(devTestUtils.getAuthState());
  };

  const handleClearStorage = () => {
    devTestUtils.clearAllStorage();
    setAuthState(devTestUtils.getAuthState());
    devLog.info("Storage cleared");
  };

  const handleSimulateOAuth = provider => {
    devTestUtils.simulateOAuthCallback(provider);
  };

  const renderEnvironmentTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Environment Information</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Environment:</span>
            <span className="font-mono">{getEnvironment()}</span>
          </div>
          <div className="flex justify-between">
            <span>Base URL:</span>
            <span className="font-mono">{getBaseUrl()}</span>
          </div>
          <div className="flex justify-between">
            <span>OAuth Redirect:</span>
            <span className="font-mono">{getOAuthRedirectUrl()}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Environment Variables</h4>
        {envCheck && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {envCheck.isValid ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span
                className={envCheck.isValid ? "text-green-600" : "text-red-600"}
              >
                {envCheck.isValid
                  ? "All required variables set"
                  : "Missing required variables"}
              </span>
            </div>

            {envCheck.missing.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">
                  Missing:
                </p>
                <ul className="text-sm text-red-600 space-y-1">
                  {envCheck.missing.map(key => (
                    <li key={key} className="font-mono">
                      {key}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {envCheck.warnings.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-600 mb-1">
                  Optional (not set):
                </p>
                <ul className="text-sm text-yellow-600 space-y-1">
                  {envCheck.warnings.map(key => (
                    <li key={key} className="font-mono">
                      {key}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderAuthTab = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={handleRefreshAuthState}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <button
          onClick={handleClearStorage}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Database className="w-4 h-4" />
          Clear Storage
        </button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Authentication State</h4>
          <button
            onClick={() => setShowAuthData(!showAuthData)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showAuthData ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {showAuthData ? "Hide" : "Show"} Data
          </button>
        </div>

        {authState && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Local Storage Items:</span>
              <span>{Object.keys(authState.localStorage).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Session Storage Items:</span>
              <span>{Object.keys(authState.sessionStorage).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Cookies:</span>
              <span>{authState.cookies ? "Present" : "None"}</span>
            </div>

            {showAuthData && (
              <div className="mt-4 space-y-3">
                {Object.keys(authState.localStorage).length > 0 && (
                  <div>
                    <p className="font-medium text-xs uppercase text-gray-500 mb-1">
                      Local Storage:
                    </p>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(authState.localStorage, null, 2)}
                    </pre>
                  </div>
                )}

                {Object.keys(authState.sessionStorage).length > 0 && (
                  <div>
                    <p className="font-medium text-xs uppercase text-gray-500 mb-1">
                      Session Storage:
                    </p>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(authState.sessionStorage, null, 2)}
                    </pre>
                  </div>
                )}

                {authState.cookies && (
                  <div>
                    <p className="font-medium text-xs uppercase text-gray-500 mb-1">
                      Cookies:
                    </p>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-32">
                      {authState.cookies}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderTestingTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-semibold mb-3">OAuth Testing</h4>
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Simulate OAuth callbacks for testing (development only)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleSimulateOAuth("github")}
              className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Simulate GitHub OAuth
            </button>
            <button
              onClick={() => handleSimulateOAuth("google")}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Simulate Google OAuth
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Development Logs</h4>
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Check browser console for detailed development logs
          </p>
          <button
            onClick={() => {
              devLog.info("Test log message");
              devLog.warn("Test warning message");
              devLog.error("Test error message");
            }}
            className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Test Log Messages
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Dev Tools Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Development Tools"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* Dev Tools Panel */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="fixed bottom-20 right-4 w-96 max-h-96 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Development Tools
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[
                { id: "environment", label: "Environment", icon: Settings },
                { id: "auth", label: "Auth", icon: Key },
                { id: "testing", label: "Testing", icon: TestTube },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-4 max-h-64 overflow-y-auto">
              {activeTab === "environment" && renderEnvironmentTab()}
              {activeTab === "auth" && renderAuthTab()}
              {activeTab === "testing" && renderTestingTab()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DevTools;
