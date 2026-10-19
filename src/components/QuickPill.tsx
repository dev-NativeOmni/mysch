"use client";

import React from "react";
import { AttendanceStatus } from "@/lib/types";

interface QuickPillProps {
  currentStatus: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
  disabled?: boolean;
}

const STATUS_NAMES: Record<string, string> = {
  H: "Hadir",
  S: "Sakit",
  I: "Izin",
  A: "Alpa / Tanpa Keterangan",
};

export const QuickPill: React.FC<QuickPillProps> = ({
  currentStatus,
  onChange,
  disabled = false,
}) => {
  const options: { value: AttendanceStatus; label: string; activeClass: string; inactiveClass: string }[] = [
    {
      value: "H",
      label: "Hadir",
      activeClass: "bg-emerald-600 text-white font-bold ring-2 ring-emerald-600 shadow-sm",
      inactiveClass: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    },
    {
      value: "S",
      label: "Sakit",
      activeClass: "bg-amber-500 text-white font-bold ring-2 ring-amber-500 shadow-sm",
      inactiveClass: "bg-amber-50 text-amber-800 hover:bg-amber-100",
    },
    {
      value: "I",
      label: "Izin",
      activeClass: "bg-blue-600 text-white font-bold ring-2 ring-blue-600 shadow-sm",
      inactiveClass: "bg-blue-50 text-blue-800 hover:bg-blue-100",
    },
    {
      value: "A",
      label: "Alpa",
      activeClass: "bg-rose-600 text-white font-bold ring-2 ring-rose-600 shadow-sm",
      inactiveClass: "bg-rose-50 text-rose-800 hover:bg-rose-100",
    },
  ];

  return (
    <div className="grid grid-cols-4 w-full sm:w-auto rounded-xl bg-slate-100 p-1 gap-1 border border-slate-200">
      {options.map((opt) => {
        const isSelected = currentStatus === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`h-11 sm:h-10 sm:w-16 rounded-lg text-sm transition-all flex items-center justify-center select-none ${
              isSelected ? opt.activeClass : opt.inactiveClass
            } disabled:opacity-50`}
            title={STATUS_NAMES[opt.value]}
            aria-label={STATUS_NAMES[opt.value]}
            aria-pressed={isSelected}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
