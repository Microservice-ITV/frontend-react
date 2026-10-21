import { useEffect, useState } from "react";
import {
  Controller,
  type Control,
  type FieldArrayWithId,
  type FieldErrors,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
  type UseFieldArrayReplace,
  type UseFormGetValues,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import {
  sanitizeMoneyInput,
  sanitizeUnsignedDecimalInput,
} from "@/utils/decimalInput";
import {
  computeEffectiveSellingPrice,
  parseOptionalPercent,
} from "@/utils/variantPricing";
import {
  defaultVariantRow,
  type Option,
  type ProductFormValues,
} from "@/features/seller/components/ProductForm";
import { isLightSwatch, swatchColor } from "@/utils/colorSwatch";

type VariantRow = ProductFormValues["variants"][number];

type PendingSlot = {
  slotId: string;
  sizeId: string;
};

type SizeGroup = {
  key: string;
  kind: "saved" | "pending";
  slotId?: string;
  sizeId: string;
};

type VariantSizeEditorProps = {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  getValues: UseFormGetValues<ProductFormValues>;
  fields: FieldArrayWithId<ProductFormValues, "variants", "id">[];
  append: UseFieldArrayAppend<ProductFormValues, "variants">;
  remove: UseFieldArrayRemove;
  replace: UseFieldArrayReplace<ProductFormValues, "variants">;
  variants: VariantRow[];
  primaryVariantIndex: number;
  colors: Option[];
  sizes: Option[];
  initialValuesKey: string;
};

const FIELD_ERROR_KEYS = [
  "colorId",
  "sizeId",
  "basePrice",
  "listPrice",
  "discountPercent",
  "stock",
  "length",
  "width",
  "height",
  "weight",
] as const;

const newSlotId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `slot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const pendingFromVariants = (variants: { sizeId?: string }[]): PendingSlot[] => {
  const hasSized = variants.some((row) => row.sizeId?.trim());
  const hasUnset = variants.some((row) => !row.sizeId?.trim());
  if (!hasSized || hasUnset) return [{ slotId: newSlotId(), sizeId: "" }];
  return [];
};

const nextPrimaryIndex = (primary: number, removed: number[]) => {
  const unique = [...new Set(removed)].sort((a, b) => a - b);
  if (unique.includes(primary)) return 0;
  const shift = unique.filter((index) => index < primary).length;
  return Math.max(0, primary - shift);
};

const siblingTemplate = (
  variants: VariantRow[],
  sizeId: string,
  exceptIndex: number,
) => {
  for (let index = variants.length - 1; index >= 0; index -= 1) {
    if (index === exceptIndex) continue;
    const row = variants[index];
    if (row?.sizeId === sizeId && row.colorId?.trim()) return row;
  }
  return undefined;
};

const VariantSizeEditor = ({
  control,
  register,
  errors,
  setValue,
  getValues,
  fields,
  append,
  remove,
  replace,
  variants,
  primaryVariantIndex,
  colors,
  sizes,
  initialValuesKey,
}: VariantSizeEditorProps) => {
  const [pendingSlots, setPendingSlots] = useState<PendingSlot[]>(() =>
    pendingFromVariants(variants),
  );
  const [sizeErrors, setSizeErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setPendingSlots(pendingFromVariants(getValues("variants")));
    setSizeErrors({});
  }, [getValues, initialValuesKey]);

  const derivedSizeIds: string[] = [];
  const seenSizeIds = new Set<string>();
  for (const row of variants) {
    const sizeId = row.sizeId?.trim() ?? "";
    if (!sizeId || seenSizeIds.has(sizeId)) continue;
    seenSizeIds.add(sizeId);
    derivedSizeIds.push(sizeId);
  }

  const hasUnsetSize = variants.some((row) => !row.sizeId?.trim());

  useEffect(() => {
    if (pendingSlots.length > 0) return;
    if (derivedSizeIds.length === 0 || hasUnsetSize) {
      setPendingSlots([{ slotId: newSlotId(), sizeId: "" }]);
    }
  }, [derivedSizeIds.length, hasUnsetSize, pendingSlots.length]);

  const savedGroups: SizeGroup[] = derivedSizeIds.map((sizeId) => ({
    key: `size:${sizeId}`,
    kind: "saved",
    sizeId,
  }));
  const pendingGroups: SizeGroup[] = pendingSlots
    .filter((slot) => !slot.sizeId || !derivedSizeIds.includes(slot.sizeId))
    .map((slot) => ({
      key: `pending:${slot.slotId}`,
      kind: "pending",
      slotId: slot.slotId,
      sizeId: slot.sizeId,
    }));
  const groups: SizeGroup[] = [...savedGroups, ...pendingGroups];

  const variantsRootMessage =
    (errors.variants as { message?: string; root?: { message?: string } } | undefined)
      ?.message ||
    (errors.variants as { root?: { message?: string } } | undefined)?.root
      ?.message ||
    "";

  const indicesFor = (group: SizeGroup) => {
    if (group.kind === "saved") {
      return variants.flatMap((row, index) =>
        row.sizeId === group.sizeId ? [index] : [],
      );
    }
    if (group.sizeId) return [];
    const firstEmpty = pendingSlots.find((slot) => !slot.sizeId);
    if (!firstEmpty || firstEmpty.slotId !== group.slotId) return [];
    return variants.flatMap((row, index) =>
      !row.sizeId?.trim() ? [index] : [],
    );
  };

  const takenSizeIds = (exceptKey: string) => {
    const taken = new Set<string>();
    for (const row of variants) {
      const sizeId = row.sizeId?.trim();
      if (sizeId) taken.add(sizeId);
    }
    for (const group of groups) {
      if (group.key === exceptKey) continue;
      if (group.sizeId) taken.add(group.sizeId);
    }
    const current = groups.find((group) => group.key === exceptKey);
    if (current?.sizeId) taken.delete(current.sizeId);
    return taken;
  };

  const setSizeError = (key: string, message: string) => {
    setSizeErrors((prev) => {
      if (!message) {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: message };
    });
  };

  const onSizeChange = (group: SizeGroup, nextSizeId: string) => {
    if (!nextSizeId || nextSizeId === group.sizeId) return;
    if (takenSizeIds(group.key).has(nextSizeId)) {
      setSizeError(group.key, "This size is already added.");
      return;
    }
    setSizeError(group.key, "");
    const current = getValues("variants");
    if (group.kind === "saved") {
      current.forEach((row, index) => {
        if (row.sizeId === group.sizeId) {
          setValue(`variants.${index}.sizeId`, nextSizeId, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      });
      return;
    }
    const owned = indicesFor(group);
    if (owned.length > 0) {
      owned.forEach((index) => {
        setValue(`variants.${index}.sizeId`, nextSizeId, {
          shouldValidate: true,
          shouldDirty: true,
        });
      });
      setPendingSlots((prev) =>
        prev.filter((slot) => slot.slotId !== group.slotId),
      );
      return;
    }
    append({
      ...defaultVariantRow(),
      sizeId: nextSizeId,
    });
    setPendingSlots((prev) =>
      prev.filter((slot) => slot.slotId !== group.slotId),
    );
  };

  const applySiblingPrices = (index: number, sizeId: string) => {
    const template = siblingTemplate(getValues("variants"), sizeId, index);
    if (!template) return;
    const target = getValues(`variants.${index}`);
    if (target.basePrice?.trim()) return;
    (
      [
        "basePrice",
        "listPrice",
        "discountPercent",
        "length",
        "width",
        "height",
        "weight",
      ] as const
    ).forEach((field) => {
      setValue(`variants.${index}.${field}`, template[field] ?? "", {
        shouldDirty: true,
      });
    });
  };

  const toggleColor = (group: SizeGroup, color: Option) => {
    const current = getValues("variants");
    const matches = current.flatMap((row, index) =>
      row.sizeId === group.sizeId && row.colorId === color.id ? [index] : [],
    );
    if (matches.length > 0) {
      const total = current.length;
      if (matches.length >= total) {
        const [keep, ...rest] = [...matches].sort((a, b) => a - b);
        setValue(`variants.${keep}.colorId`, "", {
          shouldValidate: true,
          shouldDirty: true,
        });
        if (rest.length > 0) {
          const next = nextPrimaryIndex(
            getValues("primaryVariantIndex") ?? 0,
            rest,
          );
          remove(rest);
          setValue("primaryVariantIndex", next, { shouldValidate: true });
        }
        return;
      }
      const next = nextPrimaryIndex(
        getValues("primaryVariantIndex") ?? 0,
        matches,
      );
      remove(matches);
      setValue("primaryVariantIndex", next, { shouldValidate: true });
      return;
    }

    if (!group.sizeId) {
      setSizeError(group.key, "Select a size first.");
      return;
    }
    setSizeError(group.key, "");

    const placeholder = current.findIndex(
      (row) => row.sizeId === group.sizeId && !row.colorId?.trim(),
    );
    if (placeholder >= 0) {
      setValue(`variants.${placeholder}.colorId`, color.id, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue(`variants.${placeholder}.sizeId`, group.sizeId, {
        shouldValidate: true,
        shouldDirty: true,
      });
      applySiblingPrices(placeholder, group.sizeId);
      return;
    }

    const unsetPlaceholder =
      !groups.some((item) => item.kind === "saved" && item.sizeId === group.sizeId)
        ? current.findIndex((row) => !row.sizeId?.trim() && !row.colorId?.trim())
        : -1;
    if (unsetPlaceholder >= 0 && group.kind === "pending") {
      setValue(`variants.${unsetPlaceholder}.colorId`, color.id, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue(`variants.${unsetPlaceholder}.sizeId`, group.sizeId, {
        shouldValidate: true,
        shouldDirty: true,
      });
      applySiblingPrices(unsetPlaceholder, group.sizeId);
      setPendingSlots((prev) =>
        prev.filter((slot) => slot.slotId !== group.slotId),
      );
      return;
    }

    const template = siblingTemplate(current, group.sizeId, -1);
    append({
      ...defaultVariantRow(),
      colorId: color.id,
      sizeId: group.sizeId,
      basePrice: template?.basePrice ?? "",
      listPrice: template?.listPrice ?? "",
      discountPercent: template?.discountPercent ?? "0",
      length: template?.length ?? "",
      width: template?.width ?? "",
      height: template?.height ?? "",
      weight: template?.weight ?? "",
    });
    if (group.kind === "pending") {
      setPendingSlots((prev) =>
        prev.filter((slot) => slot.slotId !== group.slotId),
      );
    }
  };

  const removeGroup = (group: SizeGroup) => {
    const current = getValues("variants");
    const indices =
      group.kind === "saved"
        ? current.flatMap((row, index) =>
            row.sizeId === group.sizeId ? [index] : [],
          )
        : indicesFor(group);

    const dropPending = () => {
      setPendingSlots((prev) =>
        prev.filter((slot) => slot.slotId !== group.slotId),
      );
      setSizeError(group.key, "");
    };

    if (indices.length === 0) {
      if (groups.length <= 1) {
        setPendingSlots([{ slotId: newSlotId(), sizeId: "" }]);
        setSizeErrors({});
        return;
      }
      dropPending();
      return;
    }

    if (indices.length >= current.length) {
      replace([defaultVariantRow()]);
      setValue("primaryVariantIndex", 0, { shouldValidate: true });
      setPendingSlots([{ slotId: newSlotId(), sizeId: "" }]);
      setSizeErrors({});
      return;
    }

    const next = nextPrimaryIndex(
      getValues("primaryVariantIndex") ?? 0,
      indices,
    );
    remove(indices);
    setValue("primaryVariantIndex", next, { shouldValidate: true });
    if (group.kind === "pending") dropPending();
  };

  const addSize = () => {
    if (pendingSlots.length > 0) return;
    setPendingSlots([{ slotId: newSlotId(), sizeId: "" }]);
  };

  const existingPrimaryColors: Option[] = [];
  const seenPrimaryColorIds = new Set<string>();
  for (const row of variants) {
    const colorId = row.colorId?.trim() ?? "";
    if (!colorId || seenPrimaryColorIds.has(colorId)) continue;
    const color = colors.find((entry) => entry.id === colorId);
    if (!color) continue;
    seenPrimaryColorIds.add(colorId);
    existingPrimaryColors.push(color);
  }
  const primaryColorId = variants[primaryVariantIndex]?.colorId?.trim() ?? "";

  const setPrimaryByColor = (colorId: string) => {
    if (!colorId) return;
    const currentColor = variants[primaryVariantIndex]?.colorId?.trim() ?? "";
    if (currentColor === colorId) return;
    const nextIndex = variants.findIndex(
      (row) => row.colorId?.trim() === colorId,
    );
    if (nextIndex < 0) return;
    setValue("primaryVariantIndex", nextIndex, { shouldValidate: true });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Variants</h2>
          <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-600">
            Pick a size, then tick every color sold in that size. Each ticked
            color opens its price and shipping fields on one row.
          </p>
        </div>
        <button
          type="button"
          onClick={addSize}
          disabled={pendingSlots.length > 0}
          title={
            pendingSlots.length > 0
              ? "Choose the open size and tick a color before adding another size"
              : "Add another size"
          }
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <Plus size={14} />
          Add size
        </button>
      </div>

      {variantsRootMessage && (
        <p className="mt-3 text-xs text-red-600">{variantsRootMessage}</p>
      )}
      {errors.primaryVariantIndex?.message && (
        <p className="mt-3 text-xs text-red-600">
          {errors.primaryVariantIndex.message}
        </p>
      )}

      <div className="mt-4 space-y-4">
        {groups.map((group, groupIndex) => {
          const taken = takenSizeIds(group.key);
          const sizeChoices = sizes.filter(
            (size) => size.id === group.sizeId || !taken.has(size.id),
          );
          const owned = indicesFor(group);
          const colorRows = owned.filter((index) =>
            variants[index]?.colorId?.trim(),
          );
          const selectedColorIds = new Set(
            variants
              .filter((row) => row.sizeId === group.sizeId && row.colorId)
              .map((row) => row.colorId),
          );
          const showPrimarySelect =
            groupIndex === 0 && existingPrimaryColors.length > 0;
          const localSizeError = sizeErrors[group.key] ?? "";
          const sizeFieldError = owned
            .map((index) => errors.variants?.[index]?.sizeId?.message)
            .find(Boolean);
          const missingColor = owned.some(
            (index) =>
              !variants[index]?.colorId?.trim() &&
              errors.variants?.[index]?.colorId,
          );
          const showRemove =
            groups.length > 1 || Boolean(group.sizeId) || colorRows.length > 0;

          return (
            <div
              key={group.key}
              className="rounded-xl border border-slate-200 bg-white"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-t-xl border-b border-slate-200/80 bg-white px-3 py-3 sm:px-4">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`size-${group.key}`}
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Size
                  </label>
                  <div className="relative">
                    <select
                      id={`size-${group.key}`}
                      value={group.sizeId}
                      onChange={(event) =>
                        onSizeChange(group, event.target.value)
                      }
                      className="h-10 min-w-36 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500"
                    >
                      <option value="" disabled={Boolean(group.sizeId)}>
                        Select size
                      </option>
                      {sizeChoices.map((size) => (
                        <option key={size.id} value={size.id}>
                          {size.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                <div
                  className="hidden h-6 w-px bg-slate-200 sm:block"
                  aria-hidden
                />

                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                  {colors.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No colors in the catalog yet.
                    </p>
                  ) : (
                    colors.map((color) => {
                      const checked = selectedColorIds.has(color.id);
                      const fill = swatchColor(color.name, color.code);
                      const light = isLightSwatch(fill);
                      return (
                        <span key={color.id} className="group relative">
                          <button
                            type="button"
                            aria-pressed={checked}
                            aria-label={`${color.name}${checked ? ", selected" : ""}`}
                            title={color.name}
                            onClick={() => toggleColor(group, color)}
                            className={`relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition ${
                              checked
                                ? "border-emerald-600 ring-2 ring-emerald-200"
                                : "border-white ring-1 ring-slate-300 hover:ring-slate-400"
                            } ${!group.sizeId && !checked ? "opacity-45" : ""}`}
                            style={{ backgroundColor: fill }}
                          >
                            {checked && (
                              <Check
                                size={14}
                                strokeWidth={3}
                                className={
                                  light ? "text-slate-900" : "text-white"
                                }
                              />
                            )}
                          </button>
                          <span
                            role="tooltip"
                            className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                          >
                            {color.name}
                            <span
                              aria-hidden
                              className="absolute left-1/2 top-full -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-slate-900"
                            />
                          </span>
                        </span>
                      );
                    })
                  )}
                </div>

                {showPrimarySelect && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <label
                      htmlFor="primary-variant-color"
                      className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                    >
                      Primary
                    </label>
                    <div className="relative">
                      <select
                        id="primary-variant-color"
                        value={
                          existingPrimaryColors.some(
                            (color) => color.id === primaryColorId,
                          )
                            ? primaryColorId
                            : ""
                        }
                        onChange={(event) =>
                          setPrimaryByColor(event.target.value)
                        }
                        className="h-8 w-[7.5rem] appearance-none rounded-lg border border-slate-200 bg-white pl-2 pr-7 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        {existingPrimaryColors.map((color) => (
                          <option key={color.id} value={color.id}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>
                )}

                {showRemove && (
                  <button
                    type="button"
                    onClick={() => removeGroup(group)}
                    className="inline-flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                    aria-label="Remove size"
                    title="Remove size"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {(localSizeError || sizeFieldError || missingColor) && (
                <div className="space-y-1 px-3 pt-2 sm:px-4">
                  {localSizeError && (
                    <p className="text-xs text-red-600">{localSizeError}</p>
                  )}
                  {sizeFieldError && (
                    <p className="text-xs text-red-600">{sizeFieldError}</p>
                  )}
                  {missingColor && (
                    <p className="text-xs text-red-600">
                      Tick at least one color for this size.
                    </p>
                  )}
                </div>
              )}

              {group.sizeId && colorRows.length === 0 && (
                <p className="px-3 py-3 text-xs text-slate-500 sm:px-4">
                  Tick a color to open its fields.
                </p>
              )}

              {colorRows.length > 0 && (
                <div className="divide-y divide-slate-200 overflow-hidden rounded-b-[11px] bg-white">
                  {owned.map((index) => (
                    <input
                      key={`server-${fields[index]?.id ?? index}`}
                      type="hidden"
                      {...register(`variants.${index}.serverVariantId`)}
                    />
                  ))}
                  {colorRows.map((index) => {
                    const row = variants[index];
                    const color = colors.find((entry) => entry.id === row?.colorId);
                    const colorName = color?.name ?? "color";
                    const fill = swatchColor(colorName, color?.code);
                    const list = row?.listPrice ? Number(row.listPrice) : NaN;
                    const discount = parseOptionalPercent(
                      row?.discountPercent ?? "",
                    );
                    const customerPays =
                      !Number.isNaN(list) && list > 0
                        ? computeEffectiveSellingPrice(list, discount)
                        : null;
                    const rowErrors = errors.variants?.[index];
                    const messages = FIELD_ERROR_KEYS.flatMap((key) => {
                      const message = rowErrors?.[key]?.message;
                      return message ? [message] : [];
                    });

                    return (
                      <div
                        key={fields[index]?.id ?? `color-${index}`}
                        className="px-3 py-3 sm:px-4"
                      >
                        <div className="flex items-end gap-1.5">
                          <div className="min-w-0 flex-1 overflow-x-auto">
                            <div className="flex flex-nowrap items-end gap-1.5">
                              <div
                                className="mb-0.5 ml-2 flex h-9 w-[6.5rem] shrink-0 items-center gap-2"
                                title={colorName}
                              >
                                <span
                                  className="h-5 w-5 shrink-0 rounded-full border border-slate-200 ring-1 ring-slate-300"
                                  style={{ backgroundColor: fill }}
                                  aria-hidden
                                />
                                <span className="truncate text-sm font-medium text-slate-800">
                                  {colorName}
                                </span>
                              </div>
                              <PriceField
                                control={control}
                                name={`variants.${index}.listPrice`}
                                id={`listPrice-${index}`}
                                label="Selling price"
                                placeholder="0.00"
                                invalid={!!rowErrors?.listPrice}
                                sanitize={sanitizeMoneyInput}
                              />
                              <ReadOnlyField
                                id={`stock-${index}`}
                                label="Stock"
                                value={row?.stock || "0"}
                                title="Stock is managed by the warehouse"
                                narrow
                              />
                              <ReadOnlyField
                                id={`pays-${index}`}
                                label="Customer pays"
                                value={
                                  customerPays != null
                                    ? customerPays.toFixed(2)
                                    : "—"
                                }
                                title="Selling price after discount"
                                emphasize
                              />
                              <DimensionField
                                control={control}
                                name={`variants.${index}.height`}
                                id={`height-${index}`}
                                label="Height (cm)"
                                placeholder="0.00"
                                decimals={2}
                                invalid={!!rowErrors?.height}
                              />
                              <DimensionField
                                control={control}
                                name={`variants.${index}.weight`}
                                id={`weight-${index}`}
                                label="Weight (kg)"
                                placeholder="0.000"
                                decimals={3}
                                invalid={!!rowErrors?.weight}
                              />
                              <DimensionField
                                control={control}
                                name={`variants.${index}.length`}
                                id={`length-${index}`}
                                label="Length (cm)"
                                placeholder="0.00"
                                decimals={2}
                                invalid={!!rowErrors?.length}
                              />
                              <DimensionField
                                control={control}
                                name={`variants.${index}.width`}
                                id={`width-${index}`}
                                label="Width (cm)"
                                placeholder="0.00"
                                decimals={2}
                                invalid={!!rowErrors?.width}
                              />
                            </div>
                          </div>
                          {color && (
                            <button
                              type="button"
                              onClick={() => toggleColor(group, color)}
                              className="mb-0.5 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                              aria-label={`Remove ${colorName}`}
                              title={`Remove ${colorName}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        {messages.length > 0 && (
                          <ul className="mt-2 space-y-0.5">
                            {[...new Set(messages)].map((message) => (
                              <li
                                key={message}
                                className="text-xs text-red-600"
                              >
                                {message}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

const fieldShell = (invalid: boolean, readOnly = false) =>
  `h-9 w-full rounded-lg border bg-white px-2.5 text-sm outline-none focus:border-emerald-500 ${
    invalid ? "border-red-400" : "border-slate-200"
  } ${readOnly ? "cursor-not-allowed bg-slate-50 font-medium text-slate-700" : "text-slate-900"}`;

const PriceField = ({
  control,
  name,
  id,
  label,
  placeholder,
  invalid,
  sanitize,
}: {
  control: Control<ProductFormValues>;
  name:
    | `variants.${number}.basePrice`
    | `variants.${number}.listPrice`
    | `variants.${number}.discountPercent`;
  id: string;
  label: string;
  placeholder: string;
  invalid: boolean;
  sanitize: (value: string) => string;
}) => (
  <div className="w-[5.75rem] shrink-0">
    <label
      htmlFor={id}
      className="mb-1 block whitespace-nowrap text-[11px] font-medium text-slate-600"
    >
      {label}
    </label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          className={fieldShell(invalid)}
          name={field.name}
          ref={field.ref}
          value={field.value}
          onBlur={field.onBlur}
          onChange={(event) => field.onChange(sanitize(event.target.value))}
          aria-invalid={invalid}
        />
      )}
    />
  </div>
);

const DimensionField = ({
  control,
  name,
  id,
  label,
  placeholder,
  decimals,
  invalid,
}: {
  control: Control<ProductFormValues>;
  name:
    | `variants.${number}.length`
    | `variants.${number}.width`
    | `variants.${number}.height`
    | `variants.${number}.weight`;
  id: string;
  label: string;
  placeholder: string;
  decimals: number;
  invalid: boolean;
}) => (
  <div className="w-[5.25rem] shrink-0">
    <label
      htmlFor={id}
      className="mb-1 block whitespace-nowrap text-[11px] font-medium text-slate-600"
    >
      {label}
    </label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          className={fieldShell(invalid)}
          name={field.name}
          ref={field.ref}
          value={field.value ?? ""}
          onBlur={field.onBlur}
          onChange={(event) =>
            field.onChange(
              sanitizeUnsignedDecimalInput(event.target.value, decimals),
            )
          }
          aria-invalid={invalid}
        />
      )}
    />
  </div>
);

const ReadOnlyField = ({
  id,
  label,
  value,
  title,
  narrow = false,
  emphasize = false,
}: {
  id: string;
  label: string;
  value: string;
  title: string;
  narrow?: boolean;
  emphasize?: boolean;
}) => (
  <div
    className={
      narrow
        ? "w-14 shrink-0"
        : emphasize
          ? "w-[6.25rem] shrink-0"
          : "w-[5.25rem] shrink-0"
    }
  >
    <label
      htmlFor={id}
      className="mb-1 block whitespace-nowrap text-[11px] font-medium text-slate-600"
    >
      {label}
    </label>
    <input
      id={id}
      type="text"
      readOnly
      title={title}
      value={value}
      className={`${fieldShell(false, true)} ${
        emphasize ? "text-emerald-700" : ""
      }`}
    />
  </div>
);

export default VariantSizeEditor;
