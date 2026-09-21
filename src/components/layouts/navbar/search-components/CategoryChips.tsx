import type { Category } from "@/features/categories/types/categoryTypes";
import { ALL_CATEGORIES } from "./useNavbarSearch";

interface CategoryChipsProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelect: (categoryId: string) => void;
}

const CategoryChips = ({
  categories,
  selectedCategoryId,
  onSelect,
}: CategoryChipsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto px-3 py-2 border-b border-gray-100 bg-white">
      <button
        type="button"
        onClick={() => onSelect(ALL_CATEGORIES)}
        className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
          selectedCategoryId === ALL_CATEGORIES
            ? "bg-emerald-600 text-white"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c.id)}
          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
            selectedCategoryId === c.id
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryChips;
