import React, { forwardRef } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

/**
 * Professional Input Component
 * Enterprise-grade input with accessibility, validation states, and consistent design
 */
const Input = forwardRef(
  (
    {
      type = "text",
      label,
      placeholder,
      value,
      onChange,
      onBlur,
      onFocus,
      disabled = false,
      loading = false,
      required = false,
      error,
      success,
      helperText,
      leftIcon,
      rightIcon,
      className = "",
      fullWidth = true,
      size = "md",
      variant = "default",
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const baseClasses = `
    block w-full rounded-lg border transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:opacity-50 disabled:cursor-not-allowed
    placeholder:text-gray-400 dark:placeholder:text-gray-500
    ${fullWidth ? "w-full" : ""}
  `;

    const variants = {
      default: `
      border-gray-300 bg-white text-gray-900
      focus:border-primary-500 focus:ring-primary-500
      dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100
      dark:focus:border-primary-400 dark:focus:ring-primary-400
    `,
      filled: `
      border-transparent bg-gray-50 text-gray-900
      focus:bg-white focus:border-primary-500 focus:ring-primary-500
      dark:bg-gray-700 dark:text-gray-100
      dark:focus:bg-gray-800 dark:focus:border-primary-400
      dark:focus:ring-primary-400
    `,
      outline: `
      border-2 border-gray-300 bg-transparent text-gray-900
      focus:border-primary-500 focus:ring-primary-500
      dark:border-gray-600 dark:text-gray-100
      dark:focus:border-primary-400 dark:focus:ring-primary-400
    `,
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2.5 text-sm",
      lg: "px-4 py-3 text-base",
      xl: "px-5 py-4 text-lg",
    };

    const iconSizes = {
      sm: "w-4 h-4",
      md: "w-4 h-4",
      lg: "w-5 h-5",
      xl: "w-6 h-6",
    };

    const getInputClasses = () => {
      let classes = `${baseClasses} ${variants[variant]} ${sizes[size]}`;

      if (leftIcon) {
        classes += " pl-10";
      }
      if (rightIcon || type === "password") {
        classes += " pr-10";
      }

      if (error) {
        classes += `
        border-red-300 text-red-900 placeholder-red-300
        focus:border-red-500 focus:ring-red-500
        dark:border-red-600 dark:text-red-100
        dark:focus:border-red-400 dark:focus:ring-red-400
      `;
      } else if (success) {
        classes += `
        border-green-300 text-green-900 placeholder-green-300
        focus:border-green-500 focus:ring-green-500
        dark:border-green-600 dark:text-green-100
        dark:focus:border-green-400 dark:focus:ring-green-400
      `;
      } else {
        classes += ` ${variants[variant]}`;
      }

      return `${classes} ${className}`;
    };

    const handleFocus = e => {
      onFocus?.(e);
    };

    const handleBlur = e => {
      onBlur?.(e);
    };

    const inputType = type === "password" && showPassword ? "text" : type;

    const renderLeftIcon = () => {
      if (leftIcon) {
        return (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {React.cloneElement(leftIcon, { className: iconSizes[size] })}
          </div>
        );
      }
      return null;
    };

    const renderRightIcon = () => {
      if (loading) {
        return (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Loader2 className={`${iconSizes[size]} animate-spin`} />
          </div>
        );
      }

      if (type === "password") {
        return (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className={iconSizes[size]} />
            ) : (
              <Eye className={iconSizes[size]} />
            )}
          </button>
        );
      }

      if (error) {
        return (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
            <AlertCircle className={iconSizes[size]} />
          </div>
        );
      }

      if (success) {
        return (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
            <CheckCircle className={iconSizes[size]} />
          </div>
        );
      }

      if (rightIcon) {
        return (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {React.cloneElement(rightIcon, { className: iconSizes[size] })}
          </div>
        );
      }

      return null;
    };

    const inputId =
      props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`
            block text-sm font-medium mb-2
            ${error ? "text-red-700 dark:text-red-400" : ""}
            ${success ? "text-green-700 dark:text-green-400" : ""}
            ${!error && !success ? "text-gray-700 dark:text-gray-300" : ""}
          `}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled || loading}
            placeholder={placeholder}
            className={getInputClasses()}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            {...props}
          />

          {renderLeftIcon()}
          {renderRightIcon()}
        </div>

        {(error || helperText || success) && (
          <div className="mt-2">
            {error && (
              <p
                id={`${inputId}-error`}
                className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
            {helperText && !error && (
              <p
                id={`${inputId}-helper`}
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                {helperText}
              </p>
            )}
            {success && !error && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {success}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

/**
 * TextArea Component
 */
export const TextArea = forwardRef(
  (
    {
      label,
      placeholder,
      value,
      onChange,
      onBlur,
      onFocus,
      disabled = false,
      loading = false,
      required = false,
      error,
      success,
      helperText,
      rows = 4,
      className = "",
      fullWidth = true,
      size = "md",
      variant = "default",
      ...props
    },
    ref
  ) => {

    const baseClasses = `
    block w-full rounded-lg border transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:opacity-50 disabled:cursor-not-allowed
    placeholder:text-gray-400 dark:placeholder:text-gray-500
    resize-vertical
    ${fullWidth ? "w-full" : ""}
  `;

    const variants = {
      default: `
      border-gray-300 bg-white text-gray-900
      focus:border-primary-500 focus:ring-primary-500
      dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100
      dark:focus:border-primary-400 dark:focus:ring-primary-400
    `,
      filled: `
      border-transparent bg-gray-50 text-gray-900
      focus:bg-white focus:border-primary-500 focus:ring-primary-500
      dark:bg-gray-700 dark:text-gray-100
      dark:focus:bg-gray-800 dark:focus:border-primary-400
      dark:focus:ring-primary-400
    `,
      outline: `
      border-2 border-gray-300 bg-transparent text-gray-900
      focus:border-primary-500 focus:ring-primary-500
      dark:border-gray-600 dark:text-gray-100
      dark:focus:border-primary-400 dark:focus:ring-primary-400
    `,
    };

    const sizes = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-3 text-sm",
      lg: "px-4 py-4 text-base",
      xl: "px-5 py-5 text-lg",
    };

    const getTextAreaClasses = () => {
      let classes = `${baseClasses} ${variants[variant]} ${sizes[size]}`;

      if (error) {
        classes += `
        border-red-300 text-red-900 placeholder-red-300
        focus:border-red-500 focus:ring-red-500
        dark:border-red-600 dark:text-red-100
        dark:focus:border-red-400 dark:focus:ring-red-400
      `;
      } else if (success) {
        classes += `
        border-green-300 text-green-900 placeholder-green-300
        focus:border-green-500 focus:ring-green-500
        dark:border-green-600 dark:text-green-100
        dark:focus:border-green-400 dark:focus:ring-green-400
      `;
      } else {
        classes += ` ${variants[variant]}`;
      }

      return `${classes} ${className}`;
    };

    const handleFocus = e => {
      onFocus?.(e);
    };

    const handleBlur = e => {
      onBlur?.(e);
    };

    const textAreaId =
      props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label
            htmlFor={textAreaId}
            className={`
            block text-sm font-medium mb-2
            ${error ? "text-red-700 dark:text-red-400" : ""}
            ${success ? "text-green-700 dark:text-green-400" : ""}
            ${!error && !success ? "text-gray-700 dark:text-gray-300" : ""}
          `}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textAreaId}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled || loading}
          placeholder={placeholder}
          rows={rows}
          className={getTextAreaClasses()}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error
              ? `${textAreaId}-error`
              : helperText
                ? `${textAreaId}-helper`
                : undefined
          }
          {...props}
        />

        {(error || helperText || success) && (
          <div className="mt-2">
            {error && (
              <p
                id={`${textAreaId}-error`}
                className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
            {helperText && !error && (
              <p
                id={`${textAreaId}-helper`}
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                {helperText}
              </p>
            )}
            {success && !error && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {success}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";

export default Input;
