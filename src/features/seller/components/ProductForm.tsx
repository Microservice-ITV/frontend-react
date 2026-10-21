import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
import VariantSizeEditor from "@/features/seller/components/VariantSizeEditor";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { productServiceAssetUrl } from "@/lib/api/apiConfig";

/** Split a comma-separated tags string into a deduped, trimmed array (max 20). */
export const parseTagsInput = (raw: string): string[] =>
  [
    ...new Set(
      raw
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ].slice(0, 20);

const toSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Sanitizes input so only digits and a single decimal point are accepted.
 * Caps decimal places according to the database precision (2 or 3).
 */
const sanitizeDecimalInput = (value: string, maxDecimals: number = 2) => {
  let clean = value.replace(/[^0-9.]/g, "");
  const parts = clean.split(".");
  if (parts.length > 2) {
    clean = `${parts[0]}.${parts.slice(1).join("")}`;
  }
  const [intPart, decPart] = clean.split(".");
  if (decPart !== undefined) {
    return `${intPart}.${decPart.slice(0, maxDecimals)}`;
  }
  return clean;
};

/** Matches product-service `priceField` / `optionalPercent`: parseFloat, positive price, percent ranges. */
const moneyField = (label: string, required: boolean) =>
  z
    .string()
    .trim()
    .transform((s) => s.replace(/\.+$/, ""))
    .refine((s) => !required || s.length > 0, `${label} is required`)
    .refine(
      (s) => s === "" || /^\d+(\.\d{1,2})?$/.test(s),
      "Use numbers only, up to 2 decimal places",
    )
    .refine(
      (s) => s === "" || parseFloat(s) > 0,
      `${label} must be greater than 0`,
    )
    .refine(
      (s) => s === "" || parseFloat(s) <= 9999999,
      "This price is too high. Please enter a reliable price.",
    );

const optionalPercentField = (label: string, max: number) =>
  z
    .string()
    .trim()
    .transform((s) => s.replace(/\.+$/, ""))
    .refine(
      (s) => s === "" || /^\d+(\.\d{1,4})?$/.test(s),
      `${label}: numbers only (decimals allowed, e.g. 0.5)`,
    )
    .refine(
      (s) => s === "" || (parseFloat(s) >= 0 && parseFloat(s) <= max),
      `${label} must be between 0 and ${max}`,
    );

/** Supports required DECIMAL(10,2) or DECIMAL(10,3) values. */
const dimensionField = (label: string, maxDecimals: number = 2) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .transform((s) => s.replace(/\.+$/, ""))
    .refine(
      (s) => new RegExp(`^\\d+(\\.\\d{1,${maxDecimals}})?$`).test(s),
      `${label}: numbers only (up to ${maxDecimals} decimal places)`,
    );

const variantRowSchema = z.object({
  /** Set when editing an existing product variant (PATCH body `variants[].id`). */
  serverVariantId: z
    .union([z.string().uuid(), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  colorId: z
    .string()
    .trim()
    .min(1, "Color is required")
    .uuid("Color is required"),
  sizeId: z.string().trim().min(1, "Size is required").uuid("Size is required"),
  basePrice: moneyField("Base price", false),
  listPrice: moneyField("Selling price", true),
  discountPercent: optionalPercentField("Discount %", 100),
  stock: z
    .string()
    .trim()
    .min(1, "Stock is required")
    .refine((v) => /^\d+$/.test(v), "Stock must be a whole number")
    .refine(
      (v) =>
        !Number.isNaN(Number(v)) &&
        Number(v) >= 0 &&
        Number.isInteger(Number(v)),
      "Invalid stock",
    ),
  // Dimensions DECIMAL(10,2) and Weight DECIMAL(10,3)
  length: dimensionField("Length", 2),
  width: dimensionField("Width", 2),
  height: dimensionField("Height", 2),
  weight: dimensionField("Weight", 3),
});

export const productFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim().optional(),
    tags: z.string().trim(),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug format is invalid"),
    categoryId: z
      .string()
      .trim()
      .min(1, "Category is required")
      .uuid("Category is required"),
    brandId: z
      .string()
      .trim()
      .min(1, "Brand is required")
      .uuid("Brand is required"),
    primaryVariantIndex: z.number().int().min(0),
    variants: z.array(variantRowSchema).min(1, "Add at least one variant"),
    shopId: z.string().trim().min(1, "Shop context is missing"),
    images: z.string().trim(),
    isActive: z.enum(["true", "false"]),
  })
  .superRefine((data, ctx) => {
    const pairs = new Set<string>();
    data.variants.forEach((row, index) => {
      const k = `${row.colorId}:${row.sizeId}`;
      if (pairs.has(k)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate color and size combination",
          path: ["variants", index, "sizeId"],
        });
      }
      pairs.add(k);
    });
    if (data.primaryVariantIndex >= data.variants.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a primary variant",
        path: ["primaryVariantIndex"],
      });
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;

export type Option = { id: string; name: string; code?: string };

type ProductFormProps = {
  mode: "create" | "edit";
  initialValues: ProductFormValues;
  categoryOptions: Option[];
  brandOptions: Option[];
  colorOptions: Option[];
  sizeOptions: Option[];
  existingImageUrls?: string[];
  referencesLoading?: boolean;
  referencesError?: string;
  isSubmitting?: boolean;
  submitError?: string;
  submitLabel: string;
  cancelTo: string;
  disableSubmit?: boolean;
  onSubmit: (payload: {
    values: ProductFormValues;
    imageFiles: File[];
    existingImageUrls: string[];
  }) => Promise<void> | void;
};

const EMPTY_IMAGE_URLS: string[] = [];

const areStringArraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const isDefaultCatalogOption = (item: Option) => {
  const name = item.name.trim().toLowerCase();
  return name === "default" || name === "def";
};

const splitDefaultOptions = (options: Option[]) => {
  const selectable: Option[] = [];
  const defaultIds = new Set<string>();
  for (const item of options) {
    if (isDefaultCatalogOption(item)) defaultIds.add(item.id);
    else selectable.push(item);
  }
  return { selectable, defaultIds };
};

export const defaultVariantRow = (): ProductFormValues["variants"][number] => ({
  serverVariantId: undefined,
  colorId: "",
  sizeId: "",
  basePrice: "",
  listPrice: "",
  discountPercent: "0",
  stock: "0",
  length: "",
  width: "",
  height: "",
  weight: "",
});

const ProductForm = ({
  mode,
  initialValues,
  categoryOptions,
  brandOptions,
  colorOptions,
  sizeOptions,
  existingImageUrls = EMPTY_IMAGE_URLS,
  referencesLoading = false,
  referencesError = "",
  isSubmitting = false,
  submitError = "",
  submitLabel,
  cancelTo,
  disableSubmit = false,
  onSubmit,
}: ProductFormProps) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageError, setImageError] = useState("");
  const [imageSubmitErrorDismissed, setImageSubmitErrorDismissed] =
    useState(false);
  const [editableExistingImages, setEditableExistingImages] =
    useState<string[]>(existingImageUrls);
  const normalizedSubmitError = submitError.toLowerCase();
  const isImageSubmitError =
    normalizedSubmitError.includes("image") ||
    normalizedSubmitError.includes("photo");
  const imageSubmitError = isImageSubmitError
    ? imageSubmitErrorDismissed
      ? ""
      : submitError
    : "";
  const initialValuesKey = useMemo(
    () => JSON.stringify(initialValues),
    [initialValues],
  );
  const existingImageUrlsKey = useMemo(
    () => JSON.stringify(existingImageUrls),
    [existingImageUrls],
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialValues,
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "variants",
  });

  const colorCatalog = useMemo(
    () => splitDefaultOptions(colorOptions),
    [colorOptions],
  );
  const sizeCatalog = useMemo(
    () => splitDefaultOptions(sizeOptions),
    [sizeOptions],
  );

  useEffect(() => {
    reset(initialValues);
  }, [initialValuesKey, initialValues, reset]);

  useEffect(() => {
    const { defaultIds: defaultColorIds } = colorCatalog;
    const { defaultIds: defaultSizeIds } = sizeCatalog;
    if (defaultColorIds.size === 0 && defaultSizeIds.size === 0) return;
    getValues("variants").forEach((row, index) => {
      if (row.colorId && defaultColorIds.has(row.colorId)) {
        setValue(`variants.${index}.colorId`, "");
      }
      if (row.sizeId && defaultSizeIds.has(row.sizeId)) {
        setValue(`variants.${index}.sizeId`, "");
      }
    });
  }, [colorCatalog, sizeCatalog, initialValuesKey, getValues, setValue]);

  useEffect(() => {
    setEditableExistingImages((prev) =>
      areStringArraysEqual(prev, existingImageUrls) ? prev : existingImageUrls,
    );
  }, [existingImageUrlsKey, existingImageUrls]);

  const [isActive, name, variantsWatched, primaryVariantIndex] = watch([
    "isActive",
    "name",
    "variants",
    "primaryVariantIndex",
  ]);

  // Slug is read-only; keep it in sync with the name on both create and edit.
  useEffect(() => {
    const newSlug = toSlug(name || "");
    setValue("slug", newSlug);
  }, [name, setValue]);

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(urls);
    const existingImageNames = editableExistingImages.map((url) => {
      const parts = url.split("/");
      return parts[parts.length - 1] ?? url;
    });
    setValue(
      "images",
      [...existingImageNames, ...imageFiles.map((f) => f.name)].join(","),
      {
        shouldValidate: true,
      },
    );
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [editableExistingImages, imageFiles, setValue]);

  const title = useMemo(
    () => (mode === "create" ? "New Product" : "Edit Product"),
    [mode],
  );

  const subtitle = useMemo(
    () =>
      mode === "create"
        ? "Add a new product to the catalog."
        : "Update product information in the catalog.",
    [mode],
  );

  const handleFormSubmit = async (values: ProductFormValues) => {
    setImageSubmitErrorDismissed(false);
    if (
      mode === "edit" &&
      editableExistingImages.length === 0 &&
      imageFiles.length === 0
    ) {
      setImageError("Please upload at least one photo.");
      return;
    }
    setImageError("");
    await onSubmit({
      values,
      imageFiles,
      // Send the retained URLs even when new files are selected. This lets the
      // API keep the current gallery and append the new uploads in one update.
      existingImageUrls: editableExistingImages,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <input type="hidden" {...register("shopId")} />

        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
          {/* Left Column: Product Information */}
          <div className="h-full">
            <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">
                Product Information
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Enter the basic details for this product.
              </p>

              <div className="mt-6 flex flex-1 flex-col space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Product name"
                    {...register("name")}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="slug"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Slug
                  </label>
                  <input
                    id="slug"
                    type="text"
                    placeholder="product-slug"
                    {...register("slug")}
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  />
                  {errors.slug && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.slug.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="tags"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Tags
                  </label>
                  <input
                    id="tags"
                    type="text"
                    placeholder="Comma-separated tags, e.g. sale, bestseller"
                    {...register("tags")}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  />
                  {errors.tags && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.tags.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="images"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Images (max 3)
                  </label>
                  <input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      setImageSubmitErrorDismissed(true);
                      const incomingFiles = Array.from(e.target.files ?? []);
                      const merged = [...imageFiles, ...incomingFiles];
                      const uniqueByKey = merged.filter(
                        (file, index, arr) =>
                          arr.findIndex(
                            (item) =>
                              item.name === file.name &&
                              item.size === file.size &&
                              item.lastModified === file.lastModified,
                          ) === index,
                      );
                      if (uniqueByKey.length > 3) {
                        setImageError("You can upload up to 3 images only.");
                      } else {
                        setImageError("");
                      }
                      setImageFiles(uniqueByKey.slice(0, 3));
                      e.currentTarget.value = "";
                    }}
                    className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                  {imageError && (
                    <p className="mt-1 text-xs text-red-600">{imageError}</p>
                  )}
                  {imageSubmitError && (
                    <p className="mt-1 text-xs text-red-600">
                      {imageSubmitError}
                    </p>
                  )}
                  {editableExistingImages.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-2 text-xs font-medium text-slate-600">
                        Existing images
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {editableExistingImages.map((imageUrl, index) => (
                          <div
                            key={`${imageUrl}-${index}`}
                            className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                          >
                            <img
                              src={productServiceAssetUrl(imageUrl)}
                              alt={`Current product image ${index + 1}`}
                              className="h-24 w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImageSubmitErrorDismissed(true);
                                setEditableExistingImages((prev) =>
                                  prev.filter(
                                    (_, imageIndex) => imageIndex !== index,
                                  ),
                                );
                              }}
                              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black/80"
                              aria-label="Remove existing image"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {imagePreviews.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-2 text-xs font-medium text-slate-600">
                        New images to add
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {imagePreviews.map((preview, index) => (
                          <div
                            key={`${imageFiles[index]?.name ?? "preview"}-${index}`}
                            className="relative overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50"
                          >
                            <span className="absolute left-1 top-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                              New
                            </span>
                            <img
                              src={preview}
                              alt={
                                imageFiles[index]?.name ?? `Image ${index + 1}`
                              }
                              className="h-24 w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImageSubmitErrorDismissed(true);
                                setImageFiles((prev) =>
                                  prev.filter(
                                    (_, fileIndex) => fileIndex !== index,
                                  ),
                                );
                                setImageError("");
                              }}
                              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black/80"
                              aria-label="Remove new image"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                  <label
                    htmlFor="description"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={8}
                    placeholder="Product description"
                    {...register("description")}
                    className="min-h-32 w-full flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Organization */}
          <div className="h-full">
            <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">
                Organization
              </h2>
              <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                <p className="font-medium text-slate-800">
                  How pricing works (each variant)
                </p>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-slate-600 marker:text-slate-400">
                  <li>
                    <span className="font-medium text-slate-700">
                      Base price
                    </span>{" "}
                    — your cost per unit.
                  </li>
                  <li>
                    <span className="font-medium text-slate-700">
                      Selling price
                    </span>{" "}
                    — price before discount; markup % is calculated from this.
                  </li>
                  <li>
                    <span className="font-medium text-slate-700">
                      Discount %
                    </span>{" "}
                    — discount on selling price.
                  </li>
                  <li>
                    <span className="font-medium text-slate-700">
                      Customer pays
                    </span>{" "}
                    — selling price minus discount (auto-calculated).
                  </li>
                </ul>
                <p className="mt-2 border-t border-slate-200/80 pt-2 text-slate-500">
                  You enter base price, selling price, and discount. Markup %
                  and customer pays are calculated automatically.
                </p>
                <p className="mt-2 text-slate-500">
                  Selling price and discount accept decimals (e.g.{" "}
                  <span className="font-mono text-slate-600">0.5</span> for half
                  a percent), matching the product API. Base price uses up to
                  two decimal places.
                </p>
              </div>

              <div className="mt-6 flex flex-1 flex-col space-y-4">
                <div>
                  <p className="mb-1.5 block text-xs font-medium text-slate-700">
                    Category
                  </p>
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        id="categoryId"
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                        onBlur={field.onBlur}
                        options={categoryOptions.map((cat) => ({
                          value: cat.id,
                          label: cat.name,
                        }))}
                        mode="search-and-scroll"
                        emptyLabel="Select category"
                        placeholder="Search categories…"
                        aria-invalid={!!errors.categoryId}
                      />
                    )}
                  />
                  {errors.categoryId && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.categoryId.message}
                    </p>
                  )}
                </div>

                <div>
                  <p className="mb-1.5 block text-xs font-medium text-slate-700">
                    Brand
                  </p>
                  <Controller
                    name="brandId"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        id="brandId"
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                        onBlur={field.onBlur}
                        options={brandOptions.map((item) => ({
                          value: item.id,
                          label: item.name,
                        }))}
                        mode="search-and-scroll"
                        emptyLabel="Select brand"
                        placeholder="Search brands…"
                        aria-invalid={!!errors.brandId}
                      />
                    )}
                  />
                  {errors.brandId && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.brandId.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="isActive"
                    className="mb-1.5 block text-xs font-medium text-slate-700"
                  >
                    Status
                  </label>
                  <div className="relative">
                    <select
                      id="isActive"
                      {...register("isActive")}
                      value={isActive}
                      onChange={(e) =>
                        setValue(
                          "isActive",
                          e.target.value as ProductFormValues["isActive"],
                        )
                      }
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {referencesLoading && (
                  <p className="text-xs text-slate-500">
                    Loading reference data...
                  </p>
                )}
                {referencesError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {referencesError}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

        <div className="mt-6">
          <VariantSizeEditor
            control={control}
            register={register}
            errors={errors}
            setValue={setValue}
            getValues={getValues}
            fields={fields}
            append={append}
            remove={remove}
            replace={replace}
            variants={variantsWatched ?? []}
            primaryVariantIndex={primaryVariantIndex ?? 0}
            colors={colorCatalog.selectable}
            sizes={sizeCatalog.selectable}
            initialValuesKey={initialValuesKey}
          />
        </div>

        <div className="mt-6 space-y-3">
          {submitError && !isImageSubmitError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {submitError}
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              to={cancelTo}
              className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:min-w-32"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || disableSubmit}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer sm:min-w-40"
            >
              {isSubmitting ? "Processing..." : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
