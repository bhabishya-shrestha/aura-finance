import { Loader2 } from "lucide-react";

const LoadingSpinner = ({
  size = "md",
  text = "Loading...",
  className = "",
  showText = true,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div className="relative">
        <Loader2
          className={`${sizeClasses[size]} animate-spin text-apple-blue`}
          aria-hidden="true"
        />
        <div className="sr-only" role="status" aria-live="polite">
          {text}
        </div>
      </div>
      {showText && (
        <p className={`${textSizes[size]} text-gray-300 font-medium`}>{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
