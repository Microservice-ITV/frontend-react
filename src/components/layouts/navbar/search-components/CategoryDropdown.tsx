import type { RefObject } from "react";
import { ChevronDown } from "lucide-react";
import type { Category } from "@/features/categories/types/categoryTypes";
import { ALL_CATEGORIES } from "./useNavbarSearch";

interface CategoryDropdownProps {
  categories: Category[];
  selectedCategoryId: string;
  selectedCategory: Category | undefined;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (categoryId: string) => void;
  menuRef: RefObject<HTMLDivElement>;
}

const CategoryDropdown = ({
  categories,
  selectedCategoryId,
  selectedCategory,
  isOpen,
  onToggle,
  onSelect,
  menuRef,
}: CategoryDropdownProps) => {
  return (
    <div className="relative flex-shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1 pl-4 pr-3 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors cursor-pointer whitespace-nowrap"
        aria-label="Search category"
        aria-expanded={isOpen}
      >
        <span className="max-w-[110px] truncate">
          {selectedCategory ? selectedCategory.name : "All Categories"}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div className="absolute top-1/2 right-0 -translate-y-1/2 h-5 w-px bg-gray-200" />

      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded shadow-lg z-50 py-1 max-h-72 overflow-y-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <button
            type="button"
            onClick={() => onSelect(ALL_CATEGORIES)}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer ${
              selectedCategoryId === ALL_CATEGORIES
                ? "text-emerald-600 font-medium"
                : "text-gray-700"
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer truncate ${
                selectedCategoryId === c.id
                  ? "text-emerald-600 font-medium"
                  : "text-gray-700"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryDropdown;
