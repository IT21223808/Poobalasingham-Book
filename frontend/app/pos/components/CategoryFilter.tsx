"use client";

import { Category } from "@/services/category.service";
import { Layers } from "lucide-react";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="no-scrollbar flex w-full items-center gap-2.5 overflow-x-auto py-1">
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
          selectedCategoryId === null
            ? "bg-blue-600 text-white shadow-xs"
            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        }`}
      >
        <Layers size={16} />
        <span>All Items</span>
      </button>

      {categories.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              isSelected
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
