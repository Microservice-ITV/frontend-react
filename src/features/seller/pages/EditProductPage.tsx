import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectAuthUser } from "@/features/auth/store/authSelectors";
import {
  sellerCategoryApi,
  type CategoryReadItem,
} from "@/features/seller/api/sellerCategoryApi";
import {
  sellerProductApi,
  type ProductDetailReadItem,
} from "@/features/seller/api/sellerProductApi";
import { fetchSellerProductsByShop } from "@/features/seller/store";
import ProductForm, {
  defaultVariantRow,
  parseTagsInput,
  type ProductFormValues,
} from "@/features/seller/components/ProductForm";
import {
  mapApiProductVariantsToFormShape,
  mapProductFormToVariantsPayload,
} from "@/features/seller/utils/mapProductVariantsPayload";
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

const normalizeProductImages = (item: ProductDetailReadItem): string[] => {
  const values = [
    ...(Array.isArray(item.images) ? item.images : []),
    item.imageUrl,
  ];
  return values
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    )
    .filter((value, index, arr) => arr.indexOf(value) === index);
};

const EditProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authUser = useAppSelector(selectAuthUser);
  const activeShopId = authUser?.active_shop_id ?? "";

  const [editableExistingImages, setEditableExistingImages] = useState<
    string[]
  >([]);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referencesLoading, setReferencesLoading] = useState(false);
  const [referencesError, setReferencesError] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [brandOptions, setBrandOptions] = useState<Option[]>([]);
  const [colorOptions, setColorOptions] = useState<Option[]>([]);
  const [sizeOptions, setSizeOptions] = useState<Option[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [initialValues, setInitialValues] = useState<ProductFormValues>({
    name: "",
    description: undefined,
    videoUrl: "",
    tags: "",
    slug: "",
    categoryId: "",
    brandId: "",
    primaryVariantIndex: 0,
    variants: [defaultVariantRow()],
    shopId: "",
    images: "",
    isActive: "false",
  });

  const isUpdateDisabled = useMemo(
    () =>
      isSubmitting ||
      referencesLoading ||
      !initialValues.shopId ||
      loadingProduct,
    [isSubmitting, referencesLoading, initialValues.shopId, loadingProduct],
  );

  useEffect(() => {
    if (!id) {
      setLoadError("Invalid product id.");
      setLoadingProduct(false);
      return;
    }

    let isCancelled = false;
    const loadProduct = async () => {
      setLoadingProduct(true);
      setLoadError("");
      try {
        const response = await sellerProductApi.getProductById(id);
        const item = response.data?.data;
        if (!item) {
          if (!isCancelled) setLoadError("Product not found.");
          return;
        }

        const variantShape = mapApiProductVariantsToFormShape(item);

        if (!isCancelled) {
          setEditableExistingImages(normalizeProductImages(item));
          setInitialValues({
            name: (item.name ?? item.title ?? "").trim(),
            description: (item.description ?? "").trim(),
            videoUrl: (item.videoUrl ?? "").trim(),
            tags: (item.tags ?? []).join(", "),
            slug: (item.slug ?? "").trim(),
            categoryId: item.categoryId ?? "",
            brandId: item.brandId ?? "",
            ...variantShape,
            isActive: item.isActive ? "true" : "false",
            shopId: item.shopId ?? activeShopId,
            images: "",
          });
        }
      } catch (error: any) {
        if (!isCancelled) {
          setLoadError(
            error?.response?.data?.message ?? "Failed to load product.",
          );
        }
      } finally {
        if (!isCancelled) {
          setLoadingProduct(false);
        }
      }
    };

    void loadProduct();
    return () => {
      isCancelled = true;
    };
  }, [id, activeShopId]);

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
    existingImageUrls,
  }: {
    values: ProductFormValues;
    imageFiles: File[];
    existingImageUrls: string[];
  }) => {
    if (!id) return;

    setSubmitError("");
    if (!values.shopId) {
      setSubmitError("Active shop is missing. Please re-login and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      await sellerProductApi.updateProduct(id, {
        name: values.name.trim(),
        description: values.description?.trim() || "",
        videoUrl: values.videoUrl?.trim() || "",
        tags: parseTagsInput(values.tags),
        slug: values.slug.trim(),
        categoryId: values.categoryId,
        shopId: values.shopId,
        brandId: values.brandId,
        variants: mapProductFormToVariantsPayload(values),
        isActive: values.isActive === "true",
        imageFiles,
        existingImageUrls,
      });

      try {
        await dispatch(
          fetchSellerProductsByShop({ shopId: values.shopId }),
        ).unwrap();
      } catch {
        // Update succeeded; keep navigation flow even if list refresh fails.
      }
      navigate("/seller/products");
    } catch (error: any) {
      const fallback =
        "Failed to update product. Please check inputs and try again.";
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
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to="/seller/products" className="hover:text-slate-700">
          Products
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Edit Product</span>
      </nav>

      {loadingProduct && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading product details...
        </div>
      )}

      {!loadingProduct && loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {!loadingProduct && !loadError && (
        <ProductForm
          mode="edit"
          initialValues={initialValues}
          categoryOptions={categoryOptions}
          brandOptions={brandOptions}
          colorOptions={colorOptions}
          sizeOptions={sizeOptions}
          existingImageUrls={editableExistingImages}
          referencesLoading={referencesLoading}
          referencesError={referencesError}
          isSubmitting={isSubmitting}
          submitError={submitError}
          submitLabel="Update Product"
          cancelTo="/seller/products"
          disableSubmit={isUpdateDisabled}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
};

export default EditProductPage;
