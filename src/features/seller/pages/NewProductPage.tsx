import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectAuthUser } from "@/features/auth/store/authSelectors";
import {
  sellerCategoryApi,
  type CategoryReadItem,
} from "@/features/seller/api/sellerCategoryApi";
import { sellerProductApi } from "@/features/seller/api/sellerProductApi";
import ProductForm, {
  defaultVariantRow,
  parseTagsInput,
  type ProductFormValues,
} from "@/features/seller/components/ProductForm";
import { fetchSellerProductsByShop } from "@/features/seller/store";
import { mapProductFormToVariantsPayload } from "@/features/seller/utils/mapProductVariantsPayload";

type Option = { id: string; name: string; code?: string };
type RawCategoryOption = {
  id: string;
  name: string;
  parentId: string | null;
  isActive: boolean;
};
const normalizeCategoryId = (item: CategoryReadItem): string =>
  item.id ?? item.categoryId ?? item._id ?? "";
const normalizeCategoryName = (item: CategoryReadItem): string =>
  item.name ?? item.title ?? "Untitled Category";
const dedupeOptions = (rows: Option[]) =>
  rows.filter(
    (item, index, arr) => arr.findIndex((x) => x.id === item.id) === index,
  );
const normalizeCategoryParentId = (item: CategoryReadItem): string | null => {
  const parent = item.parentId ?? item.parent_id ?? null;
  if (typeof parent !== "string") return null;
  const trimmed = parent.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const NewProductPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authUser = useAppSelector(selectAuthUser);
  const activeShopId = authUser?.active_shop_id ?? "";

  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referencesLoading, setReferencesLoading] = useState(false);
  const [referencesError, setReferencesError] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [brandOptions, setBrandOptions] = useState<Option[]>([]);
  const [colorOptions, setColorOptions] = useState<Option[]>([]);
  const [sizeOptions, setSizeOptions] = useState<Option[]>([]);

  const isCreateDisabled = useMemo(
    () => isSubmitting || referencesLoading || !activeShopId,
    [isSubmitting, referencesLoading, activeShopId],
  );

  useEffect(() => {
    let isCancelled = false;

    const loadReferences = async () => {
      setReferencesLoading(true);
      setReferencesError("");

      try {
        const [brandsRes, colorsRes, sizesRes] = await Promise.all([
          sellerProductApi.listBrands(),
          sellerProductApi.listColors(),
          sellerProductApi.listSizes(),
        ]);

        const brands = (brandsRes.data?.data ?? [])
          .map((item) => ({ id: item.id, name: item.name }))
          .filter((item) => item.id && item.name);
        const colors = (colorsRes.data?.data ?? [])
          .map((item) => ({
            id: item.id,
            name: item.name,
            code: item.code,
          }))
          .filter((item) => item.id && item.name);
        const sizes = (sizesRes.data?.data ?? [])
          .map((item) => ({ id: item.id, name: item.name }))
          .filter((item) => item.id && item.name);

        const rawCategories: RawCategoryOption[] = [];
        let page = 1;
        let totalPages = 1;

        do {
          const categoriesRes = await sellerCategoryApi.listCategories({
            page,
            limit: 100,
          });
          const body = categoriesRes.data;
          const rows = (body.data ?? body.items ?? [])
            .map((item) => ({
              id: normalizeCategoryId(item),
              name: normalizeCategoryName(item),
              parentId: normalizeCategoryParentId(item),
              isActive: Boolean(item.isActive),
            }))
            .filter((item) => item.id);
          rawCategories.push(...rows);
          totalPages = body.pagination?.totalPages ?? 1;
          page += 1;
        } while (page <= totalPages);

        if (isCancelled) return;
        setBrandOptions(dedupeOptions(brands));
        setColorOptions(dedupeOptions(colors));
        setSizeOptions(dedupeOptions(sizes));
        const uniqueRawCategories = rawCategories.filter(
          (item, index, arr) =>
            arr.findIndex((x) => x.id === item.id) === index,
        );
        const parentIds = new Set(
          uniqueRawCategories
            .map((item) => item.parentId)
            .filter((parentId): parentId is string => Boolean(parentId)),
        );
        const activeLeafCategories = uniqueRawCategories
          .filter((item) => item.isActive)
          .filter((item) => !parentIds.has(item.id))
          .map((item) => ({ id: item.id, name: item.name }));
        const activeCategoriesFallback = uniqueRawCategories
          .filter((item) => item.isActive)
          .map((item) => ({ id: item.id, name: item.name }));

        setCategoryOptions(
          dedupeOptions(
            activeLeafCategories.length > 0
              ? activeLeafCategories
              : activeCategoriesFallback,
          ),
        );
      } catch (error: any) {
        if (isCancelled) return;
        const fallback =
          "Failed to load product reference data. Please refresh and try again.";
        setReferencesError(
          error?.response?.data?.message ?? error?.message ?? fallback,
        );
      } finally {
        if (!isCancelled) {
          setReferencesLoading(false);
        }
      }
    };

    void loadReferences();
    return () => {
      isCancelled = true;
    };
  }, []);

  const onSubmit = async ({
    values,
    imageFiles,
  }: {
    values: ProductFormValues;
    imageFiles: File[];
    existingImageUrls: string[];
  }) => {
    setSubmitError("");

    if (!values.shopId) {
      setSubmitError("Active shop is missing. Please re-login and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      await sellerProductApi.createProduct({
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        videoUrl: values.videoUrl?.trim() || undefined,
        tags: parseTagsInput(values.tags),
        slug: values.slug.trim(),
        categoryId: values.categoryId,
        shopId: values.shopId,
        brandId: values.brandId,
        variants: mapProductFormToVariantsPayload(values),
        isActive: values.isActive === "true",
        imageFiles,
      });
      try {
        await dispatch(
          fetchSellerProductsByShop({ shopId: values.shopId }),
        ).unwrap();
      } catch {
        // Create succeeded; still navigate even if list refresh fails.
      }
      navigate("/seller/products");
    } catch (error: any) {
      const fallback =
        "Failed to create product. Please check inputs and try again.";
      setSubmitError(
        error?.response?.data?.error?.message ??
          error?.response?.data?.message ??
          error?.message ??
          fallback,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to="/seller/products" className="hover:text-slate-700">
          Products
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">New Product</span>
      </nav>

      <ProductForm
        mode="create"
        initialValues={{
          name: "",
          description: undefined,
          videoUrl: "",
          tags: "",
          slug: "",
          categoryId: "",
          brandId: "",
          primaryVariantIndex: 0,
          variants: [defaultVariantRow()],
          shopId: activeShopId,
          images: "",
          isActive: "false",
        }}
        categoryOptions={categoryOptions}
        brandOptions={brandOptions}
        colorOptions={colorOptions}
        sizeOptions={sizeOptions}
        referencesLoading={referencesLoading}
        referencesError={referencesError}
        isSubmitting={isSubmitting}
        submitError={submitError}
        submitLabel="Create Product"
        cancelTo="/seller/products"
        disableSubmit={isCreateDisabled}
        onSubmit={onSubmit}
      />
    </div>
  );
};

export default NewProductPage;
