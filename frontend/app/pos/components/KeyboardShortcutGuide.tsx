"use client";

import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutGuide({
  isOpen,
  onClose,
}: KeyboardShortcutGuideProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "F2", description: "Focus Product Search Input" },
    { key: "F3", description: "Open Customer Selector" },
    { key: "F4", description: "Open Bill Discount Modal" },
    { key: "F8", description: "Hold Current Bill" },
    { key: "F9", description: "Open Payment / Charge Modal" },
    { key: "Esc", description: "Close Active Dialog / Modal" },
    { key: "Enter", description: "Scan Barcode / Confirm Checkout" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Keyboard size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-800">Keyboard Shortcuts</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Shortcut List */}
        <div className="p-6 space-y-2">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-100"
            >
              <span className="font-semibold text-slate-700">{s.description}</span>
              <kbd className="min-w-8 rounded-lg bg-slate-900 px-2.5 py-1 text-center font-mono text-[11px] font-bold text-white shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
