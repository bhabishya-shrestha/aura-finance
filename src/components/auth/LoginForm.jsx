import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const LoginForm = ({ onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, isLoading, error, clearError } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear auth error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await login(formData);

    if (!result.success) {
      // Error is already handled by the auth context
      return;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-apple-fade">
      <div className="fidelity-card-elevated p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-300 text-sm sm:text-base">
            Sign in to your Aura Finance account
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg fidelity-alert-error">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white mb-1 sm:mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 icon-muted" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`fidelity-input w-full pl-10 text-sm sm:text-base ${errors.email ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`}
                placeholder="Enter your email"
                disabled={isLoading}
                autoComplete="email"
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </div>
            {errors.email && (
              <p
                id="email-error"
                className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400"
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-white mb-1 sm:mb-2"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 icon-muted" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`fidelity-input w-full pl-10 pr-10 text-sm sm:text-base ${errors.password ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`}
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 icon-muted hover:icon-white transition-all duration-200"
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p
                id="password-error"
                className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400"
              >
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="fidelity-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-gray-300 text-xs sm:text-sm">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-all duration-200"
              disabled={isLoading}
            >
              Create one now
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
