import React from "react";

/**
 * Professional Skeleton Loading Component
 * Provides smooth loading states for better perceived performance
 */
const Skeleton = ({
  variant = "text",
  width = "100%",
  height = "1rem",
  className = "",
  lines = 1,
  animated = true,
}) => {
  const baseClasses = `bg-gray-200 dark:bg-gray-700 rounded ${
    animated ? "animate-pulse" : ""
  }`;

  const variants = {
    text: "h-4",
    title: "h-6",
    subtitle: "h-5",
    avatar: "w-10 h-10 rounded-full",
    button: "h-10 rounded-lg",
    card: "h-32 rounded-lg",
    table: "h-12 rounded",
    chart: "h-48 rounded-lg",
  };

  const variantClass = variants[variant] || variants.text;

  if (lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variantClass}`}
            style={{
              width:
                index === lines - 1
                  ? `${Math.min(100, 100 - index * 20)}%`
                  : width,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClass} ${className}`}
      style={{ width, height }}
    />
  );
};

/**
 * Card Skeleton - For loading card components
 */
export const CardSkeleton = ({ className = "" }) => (
  <div
    className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${className}`}
  >
    <div className="space-y-4">
      <Skeleton variant="title" width="60%" />
      <Skeleton variant="text" lines={3} />
      <div className="flex justify-between items-center">
        <Skeleton variant="button" width="30%" />
        <Skeleton variant="avatar" />
      </div>
    </div>
  </div>
);

/**
 * Table Skeleton - For loading table data
 */
export const TableSkeleton = ({ rows = 5, columns = 4, className = "" }) => (
  <div
    className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden ${className}`}
  >
    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
      <Skeleton variant="title" width="40%" />
    </div>
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4 flex items-center space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              width={`${Math.max(20, 100 / columns)}%`}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
);

/**
 * Chart Skeleton - For loading charts and graphs
 */
export const ChartSkeleton = ({ className = "" }) => (
  <div
    className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${className}`}
  >
    <div className="space-y-4">
      <Skeleton variant="title" width="50%" />
      <Skeleton variant="chart" />
      <div className="flex justify-center space-x-4">
        <Skeleton variant="button" width="20%" />
        <Skeleton variant="button" width="20%" />
        <Skeleton variant="button" width="20%" />
      </div>
    </div>
  </div>
);

/**
 * List Skeleton - For loading lists
 */
export const ListSkeleton = ({ items = 5, className = "" }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div
        key={index}
        className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg"
      >
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="40%" />
        </div>
        <Skeleton variant="button" width="20%" />
      </div>
    ))}
  </div>
);

/**
 * Dashboard Skeleton - For loading dashboard components
 */
export const DashboardSkeleton = ({ className = "" }) => (
  <div className={`space-y-6 ${className}`}>
    {/* Header */}
    <div className="flex justify-between items-center">
      <Skeleton variant="title" width="30%" />
      <div className="flex space-x-3">
        <Skeleton variant="button" width="100px" />
        <Skeleton variant="button" width="100px" />
      </div>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>

    {/* Recent Transactions */}
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <Skeleton variant="title" width="40%" className="mb-4" />
      <TableSkeleton rows={5} columns={4} />
    </div>
  </div>
);

export default Skeleton;
