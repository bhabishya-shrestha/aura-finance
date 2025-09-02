import React, { useState, useRef, useEffect } from "react";

// Lightweight, themed date picker that returns YYYY-MM-DD, with dark/light support
const pad = n => (n < 10 ? `0${n}` : `${n}`);
const toYMD = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const getDaysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

const DatePicker = ({ value, onChange, min, max, className = "", disabled = false, label = "" }) => {
  const initial = value ? new Date(`${value}T00:00:00Z`) : new Date();
  const [open, setOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(initial.getUTCFullYear());
  const [currentMonth, setCurrentMonth] = useState(initial.getUTCMonth());
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedDate = value ? new Date(`${value}T00:00:00Z`) : null;

  const goPrevMonth = () => {
    const d = new Date(Date.UTC(currentYear, currentMonth, 1));
    d.setUTCMonth(d.getUTCMonth() - 1);
    setCurrentYear(d.getUTCFullYear());
    setCurrentMonth(d.getUTCMonth());
  };
  const goNextMonth = () => {
    const d = new Date(Date.UTC(currentYear, currentMonth, 1));
    d.setUTCMonth(d.getUTCMonth() + 1);
    setCurrentYear(d.getUTCFullYear());
    setCurrentMonth(d.getUTCMonth());
  };

  const firstDayOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1)).getUTCDay();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const handleSelect = day => {
    if (!day) return;
    const selected = new Date(Date.UTC(currentYear, currentMonth, day));
    const ymd = toYMD(selected);
    // respect min/max if provided
    if (min && ymd < min) return;
    if (max && ymd > max) return;
    onChange?.(ymd);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label ? (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-left text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {value ? new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) : "Select date"}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={goPrevMonth}
              className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              ‹
            </button>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {new Date(Date.UTC(currentYear, currentMonth, 1)).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
            </div>
            <button
              type="button"
              onClick={goNextMonth}
              className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((d, idx) => {
              if (!d) return <div key={`e-${idx}`} className="h-8" />;
              const ymd = toYMD(new Date(Date.UTC(currentYear, currentMonth, d)));
              const isSelected = selectedDate && toYMD(selectedDate) === ymd;
              const isDisabled = (min && ymd < min) || (max && ymd > max);
              return (
                <button
                  key={ymd}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelect(d)}
                  className={`h-8 text-sm rounded flex items-center justify-center border ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600"
                      : isDisabled
                        ? "text-gray-400 dark:text-gray-500 border-transparent cursor-not-allowed"
                        : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 border-transparent"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;


