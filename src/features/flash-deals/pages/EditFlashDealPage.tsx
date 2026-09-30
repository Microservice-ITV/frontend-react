import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { flashDealAdminApi } from "../api/flashDealAdminApi";
import FlashDealForm, {
  flashDealInitialItems,
  flashDealInitialValues,
  type FlashDealFormPayload,
  type FlashDealItemRow,
  type FlashDealFormValues,
} from "../components/FlashDealForm";
import { updateFlashDeal } from "../store/flashDealThunks";
import { selectFlashDealsSubmitting } from "../store/flashDealSelectors";
import type { FlashDeal } from "../types/flashDealTypes";

const EditFlashDealPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isSubmitting = useAppSelector(selectFlashDealsSubmitting);

  const [submitError, setSubmitError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loadingDeal, setLoadingDeal] = useState(true);
  const [deal, setDeal] = useState<FlashDeal | null>(null);
  const [initialValues, setInitialValues] =
    useState<FlashDealFormValues | null>(null);
  const [initialItems, setInitialItems] = useState<FlashDealItemRow[]>([]);

  useEffect(() => {
    if (!id) {
      setLoadError("Invalid flash deal id.");
      setLoadingDeal(false);
      return;
    }

    let isCancelled = false;

    const fetchDeal = async () => {
      setLoadingDeal(true);
      setLoadError("");
      try {
        const response = await flashDealAdminApi.getById(id);
        const dealData = response.data;
        if (!dealData) {
          if (!isCancelled) setLoadError("Flash deal not found.");
          return;
        }
        if (!isCancelled) {
          setDeal(dealData);
          setInitialValues(flashDealInitialValues(dealData));
          setInitialItems(flashDealInitialItems(dealData));
        }
      } catch (error: unknown) {
        const err = error as {
          response?: {
            data?: { message?: string; error?: { message?: string } };
          };
        };
        if (!isCancelled) {
          setLoadError(
            err?.response?.data?.message ??
              err?.response?.data?.error?.message ??
              "Failed to load flash deal.",
          );
        }
      } finally {
        if (!isCancelled) setLoadingDeal(false);
      }
    };

    void fetchDeal();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  const canEditItems = deal?.status !== "ACTIVE";

  const onSubmit = async ({ values, items }: FlashDealFormPayload) => {
    if (!id) return;
    const payload: {
      name: string;
      description: string | null;
      slotTime: string | null;
      startAt: string;
      endAt: string;
      items?: {
        productId: string;
        variantId: string | null;
        originalPrice: number;
        dealPrice: number;
        allocatedQuantity: number;
        purchaseLimit: number;
        sortOrder: number;
      }[];
    } = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      slotTime: values.startTime || null,
      startAt: values.startAt,
      endAt: values.endAt,
    };

    if (canEditItems) {
      payload.items = items.map((item, index) => ({
        productId: item.productId,
        variantId: item.variantId ?? null,
        originalPrice: item.originalPrice,
        dealPrice: item.dealPrice,
        allocatedQuantity: item.allocatedQuantity,
        purchaseLimit: item.purchaseLimit,
        sortOrder: index,
      }));
    }

    setSubmitError("");
    try {
      await dispatch(updateFlashDeal({ id, payload })).unwrap();
      navigate("/super-admin/promotion-engine/flash-deals");
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: { message?: string; error?: { message?: string } };
        };
        message?: string;
      };
      setSubmitError(
        err?.response?.data?.message ??
          err?.response?.data?.error?.message ??
          (error instanceof Error
            ? error.message
            : "Failed to update flash deal."),
      );
    }
  };

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="no-underline hover:text-slate-700 hover:no-underline">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link
          to="/super-admin/promotion-engine"
          className="no-underline hover:text-slate-700 hover:no-underline"
        >
          Promotion Engine
        </Link>
        <span className="mx-1">/</span>
        <Link
          to="/super-admin/promotion-engine/flash-deals"
          className="no-underline hover:text-slate-700 hover:no-underline"
        >
          Flash Deals
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Edit Flash Deal</span>
      </nav>

      {loadingDeal && (
        <div className="rounded-xl border border-[var(--dni-border)] bg-white p-6 text-sm text-slate-600">
          Loading flash deal details...
        </div>
      )}

      {!loadingDeal && loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {!loadingDeal && !loadError && initialValues && (
        <FlashDealForm
          mode="edit"
          initialValues={initialValues}
          initialItems={initialItems}
          canEditItems={canEditItems}
          currentStatus={deal?.status}
          onSubmit={onSubmit}
          submitLabel="Save Changes"
          cancelTo="/super-admin/promotion-engine/flash-deals"
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      )}
    </div>
  );
};

export default EditFlashDealPage;
