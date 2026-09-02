"use client";

import { useEffect, useRef } from "react";
import { Search, Barcode, X } from "lucide-react";

interface ProductSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onBarcodeScan: (code: string) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export default function ProductSearch({
  searchQuery,
  onSearchChange,
  onBarcodeScan,
  onClear,
  isLoading = false,
}: ProductSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Global F2 shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      onBarcodeScan(searchQuery.trim());
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute left-4 flex items-center text-slate-400">
          <Search size={22} className={isLoading ? "animate-pulse text-blue-600" : ""} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search product, barcode or ISBN..."
          className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-28 text-base font-medium text-slate-900 shadow-2xs transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          autoFocus
        />

        <div className="absolute right-3 flex items-center gap-2">
          {searchQuery ? (
            <button
              type="button"
              onClick={onClear}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              title="Clear search"
            >
              <X size={18} />
            </button>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600 border border-slate-200">
              <Barcode size={16} />
              <span>F2</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
