import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus("loading");
        setMessage("Processing authentication...");

        // Get the current URL parameters and hash
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );

        const error = urlParams.get("error") || hashParams.get("error");
        const errorDescription =
          urlParams.get("error_description") ||
          hashParams.get("error_description");

        // Check for OAuth errors
        if (error) {
          console.error("OAuth error:", error, errorDescription);
          setStatus("error");
          setMessage(`Authentication failed: ${errorDescription || error}`);
          return;
        }

        // Check if we have tokens in the hash
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        console.log("Access token present:", !!accessToken);
        console.log("Refresh token present:", !!refreshToken);

        if (accessToken && refreshToken) {
          console.log("Found tokens in URL hash, setting session...");

          // Set the session manually with the tokens from the hash
          const { data: setSessionData, error: setSessionError } =
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

          if (setSessionError) {
            console.error("Error setting session:", setSessionError);
            setStatus("error");
            setMessage("Failed to establish session. Please try again.");
            return;
          }

          if (setSessionData.session) {
            console.log(
              "Session established successfully:",
              setSessionData.session.user.email
            );
            setStatus("success");
            setMessage("Authentication successful! Redirecting...");

            setTimeout(() => {
              navigate("/dashboard", { replace: true });
            }, 1500);
            return;
          }
        }

        // Fallback: try to get existing session
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Auth callback error:", sessionError);
          setStatus("error");
          setMessage("Authentication failed. Please try again.");
          return;
        }

        if (data.session) {
          console.log("Authentication successful:", data.session.user.email);
          setStatus("success");
          setMessage("Authentication successful! Redirecting...");

          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 1500);
        } else {
          setStatus("error");
          setMessage("No session found. Please try logging in again.");
        }
      } catch (error) {
        console.error("Unexpected error during auth callback:", error);
        setStatus("error");
        setMessage("An unexpected error occurred. Please try again.");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="w-8 h-8 animate-spin text-blue-600" />;
      case "success":
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case "error":
        return <XCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Loader2 className="w-8 h-8 animate-spin text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">{getStatusIcon()}</div>

          <h2 className={`text-xl font-semibold mb-2 ${getStatusColor()}`}>
            {status === "loading" && "Processing Authentication"}
            {status === "success" && "Authentication Successful"}
            {status === "error" && "Authentication Failed"}
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

          {status === "error" && (
            <div className="space-y-3">
              <button
                onClick={() => navigate("/auth", { replace: true })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Back to Login
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          )}

          {status === "loading" && (
            <div className="space-y-2">
              <div className="flex space-x-1 justify-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Please wait while we complete your authentication...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
