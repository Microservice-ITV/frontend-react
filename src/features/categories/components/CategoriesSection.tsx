import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchCategories } from "@/features/categories/store/categoryThunks";
import CategoryGrid from "./CategoryGrid";

const CategoriesSection = () => {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((s) => s.categories);

  useEffect(() => {
    if (status === "idle") {
      void dispatch(fetchCategories());
    }
  }, [dispatch, status]);

  const categoriesWithProducts = items.filter(
    (cat) => (cat._count?.products ?? 0) > 0
  );

  return (
    <section className="pt-6">
      <h1 className="mb-5 px-4 sm:px-6 text-base uppercase font-semibold text-gray-600">
        Categories
      </h1>

      {status === "loading" && (
        <div className="text-sm text-gray-500">Loading categories...</div>
      )}

      {status === "failed" && (
        <div className="text-sm text-red-500">
          Failed to load categories. Please try again later.
        </div>
      )}

      {status === "succeeded" && <CategoryGrid items={categoriesWithProducts} />}
    </section>
  );
};

export default CategoriesSection;
