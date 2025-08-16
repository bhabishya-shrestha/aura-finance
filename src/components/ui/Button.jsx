import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Professional Button Component
 * Enterprise-grade button with accessibility, loading states, and consistent design
 */
const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  type = "button",
  onClick,
  className = "",
  icon,
  iconPosition = "left",
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-95
    ${fullWidth ? "w-full" : ""}
  `;

  const variants = {
    primary: `
      bg-primary-600 hover:bg-primary-700 active:bg-primary-800
      text-white shadow-sm hover:shadow-md
      focus:ring-primary-500
      dark:bg-primary-500 dark:hover:bg-primary-600 dark:active:bg-primary-700
    `,
    secondary: `
      bg-gray-100 hover:bg-gray-200 active:bg-gray-300
      text-gray-900 shadow-sm hover:shadow-md
      focus:ring-gray-500
      dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500
      dark:text-gray-100
    `,
    outline: `
      border-2 border-primary-600 text-primary-600
      hover:bg-primary-50 active:bg-primary-100
      focus:ring-primary-500
      dark:border-primary-400 dark:text-primary-400
      dark:hover:bg-primary-900/20 dark:active:bg-primary-900/40
    `,
    ghost: `
      text-primary-600 hover:bg-primary-50 active:bg-primary-100
      focus:ring-primary-500
      dark:text-primary-400 dark:hover:bg-primary-900/20
      dark:active:bg-primary-900/40
    `,
    danger: `
      bg-red-600 hover:bg-red-700 active:bg-red-800
      text-white shadow-sm hover:shadow-md
      focus:ring-red-500
      dark:bg-red-500 dark:hover:bg-red-600 dark:active:bg-red-700
    `,
    success: `
      bg-green-600 hover:bg-green-700 active:bg-green-800
      text-white shadow-sm hover:shadow-md
      focus:ring-green-500
      dark:bg-green-500 dark:hover:bg-green-600 dark:active:bg-green-700
    `,
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
    xl: "px-8 py-4 text-lg gap-3",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
  };

  const buttonClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `;

  const isDisabled = disabled || loading;

  const handleClick = e => {
    if (!isDisabled && onClick) {
      onClick(e);
    }
  };

  const renderIcon = () => {
    if (loading) {
      return <Loader2 className={`${iconSizes[size]} animate-spin`} />;
    }
    return icon;
  };

  const renderContent = () => {
    const iconElement = renderIcon();

    if (!iconElement) {
      return children;
    }

    if (iconPosition === "right") {
      return (
        <>
          {children}
          {iconElement}
        </>
      );
    }

    return (
      <>
        {iconElement}
        {children}
      </>
    );
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={isDisabled}
      onClick={handleClick}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

/**
 * Icon Button - For buttons with only icons
 */
export const IconButton = ({
  icon,
  variant = "ghost",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-95
  `;

  const variants = {
    primary: `
      bg-primary-600 hover:bg-primary-700 active:bg-primary-800
      text-white shadow-sm hover:shadow-md
      focus:ring-primary-500
      dark:bg-primary-500 dark:hover:bg-primary-600 dark:active:bg-primary-700
    `,
    secondary: `
      bg-gray-100 hover:bg-gray-200 active:bg-gray-300
      text-gray-900 shadow-sm hover:shadow-md
      focus:ring-gray-500
      dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500
      dark:text-gray-100
    `,
    ghost: `
      text-gray-600 hover:bg-gray-100 active:bg-gray-200
      focus:ring-gray-500
      dark:text-gray-400 dark:hover:bg-gray-800 dark:active:bg-gray-700
    `,
    danger: `
      bg-red-600 hover:bg-red-700 active:bg-red-800
      text-white shadow-sm hover:shadow-md
      focus:ring-red-500
      dark:bg-red-500 dark:hover:bg-red-600 dark:active:bg-red-700
    `,
  };

  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-14 h-14",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-7 h-7",
  };

  const buttonClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `;

  const isDisabled = disabled || loading;

  return (
    <button
      className={buttonClasses}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : (
        React.cloneElement(icon, { className: iconSizes[size] })
      )}
    </button>
  );
};

/**
 * Button Group - For grouping related buttons
 */
export const ButtonGroup = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`inline-flex rounded-lg shadow-sm ${className}`}
      role="group"
      {...props}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        const isFirst = index === 0;
        const isLast = index === React.Children.count(children) - 1;

        return React.cloneElement(child, {
          className: `
            ${child.props.className || ""}
            ${!isFirst ? "-ml-px" : ""}
            ${!isFirst ? "rounded-l-none" : ""}
            ${!isLast ? "rounded-r-none" : ""}
          `,
        });
      })}
    </div>
  );
};

export default Button;
