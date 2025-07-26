import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const RegisterForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { register, isLoading, error, clearError } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

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
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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

    const result = await register({
      name: formData.name.trim(),
      email: formData.email,
      password: formData.password,
    });

    if (!result.success) {
      // Error is already handled by the auth context
      return;
    }
  };

  const getPasswordStrength = () => {
    if (!formData.password)
      return { strength: 0, color: "text-muted-gray", text: "" };

    let strength = 0;
    if (formData.password.length >= 6) strength++;
    if (formData.password.length >= 8) strength++;
    if (/(?=.*[a-z])/.test(formData.password)) strength++;
    if (/(?=.*[A-Z])/.test(formData.password)) strength++;
    if (/(?=.*\d)/.test(formData.password)) strength++;
    if (/(?=.*[!@#$%^&*])/.test(formData.password)) strength++;

    const strengthMap = {
      0: { color: "text-muted-gray", text: "" },
      1: { color: "text-apple-red", text: "Very Weak" },
      2: { color: "text-apple-orange", text: "Weak" },
      3: { color: "text-apple-yellow", text: "Fair" },
      4: { color: "text-apple-green", text: "Good" },
      5: { color: "text-apple-green", text: "Strong" },
      6: { color: "text-apple-green", text: "Very Strong" },
    };

    return { strength, ...strengthMap[strength] };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="card-glass">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gradient mb-2">
            Create Account
          </h2>
          <p className="text-muted-gray">
            Join Aura Finance to start managing your finances
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-apple-lg bg-apple-red/10 border border-apple-red/20 text-apple-red animate-slide-up">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-soft-white mb-2"
            >
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-gray" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`input-glass w-full pl-10 ${errors.name ? "ring-2 ring-apple-red/50" : ""}`}
                placeholder="Enter your full name"
                disabled={isLoading}
                autoComplete="name"
                aria-describedby={errors.name ? "name-error" : undefined}
              />
            </div>
            {errors.name && (
              <p
                id="name-error"
                className="mt-1 text-sm text-apple-red animate-slide-up"
              >
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-soft-white mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-gray" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`input-glass w-full pl-10 ${errors.email ? "ring-2 ring-apple-red/50" : ""}`}
                placeholder="Enter your email"
                disabled={isLoading}
                autoComplete="email"
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </div>
            {errors.email && (
              <p
                id="email-error"
                className="mt-1 text-sm text-apple-red animate-slide-up"
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-soft-white mb-2"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-gray" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`input-glass w-full pl-10 pr-10 ${errors.password ? "ring-2 ring-apple-red/50" : ""}`}
                placeholder="Create a strong password"
                disabled={isLoading}
                autoComplete="new-password"
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-gray hover:text-soft-white transition-colors"
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1 bg-apple-dark-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color.replace("text-", "bg-")}`}
                      style={{
                        width: `${(passwordStrength.strength / 6) * 100}%`,
                      }}
                    />
                  </div>
                  {passwordStrength.text && (
                    <span
                      className={`text-xs font-medium ${passwordStrength.color}`}
                    >
                      {passwordStrength.text}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-gray">
                  Use at least 6 characters with uppercase, lowercase, and
                  numbers
                </p>
              </div>
            )}

            {errors.password && (
              <p
                id="password-error"
                className="mt-1 text-sm text-apple-red animate-slide-up"
              >
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-soft-white mb-2"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-gray" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`input-glass w-full pl-10 pr-10 ${errors.confirmPassword ? "ring-2 ring-apple-red/50" : ""}`}
                placeholder="Confirm your password"
                disabled={isLoading}
                autoComplete="new-password"
                aria-describedby={
                  errors.confirmPassword ? "confirm-password-error" : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-gray hover:text-soft-white transition-colors"
                disabled={isLoading}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p
                id="confirm-password-error"
                className="mt-1 text-sm text-apple-red animate-slide-up"
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-muted-gray text-sm">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-apple-blue hover:text-apple-blue/80 font-medium transition-colors"
              disabled={isLoading}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
