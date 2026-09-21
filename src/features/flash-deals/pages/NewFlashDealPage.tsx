import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  flashDealInitialItems,
  flashDealInitialValues,
} from "../components/FlashDealForm";
import FlashDealForm, {
  type FlashDealFormPayload,
} from "../components/FlashDealForm";
import { createFlashDeal } from "../store/flashDealThunks";
import { selectFlashDealsSubmitting } from "../store/flashDealSelectors";

const NewFlashDealPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isSubmitting = useAppSelector(selectFlashDealsSubmitting);

  const [submitError, setSubmitError] = useState("");

  const onSubmit = async ({ values, items }: FlashDealFormPayload) => {
    setSubmitError("");
    try {
      await dispatch(
        createFlashDeal({
          name: values.name.trim(),
          description: values.description.trim() || null,
          status: values.status,
          slotTime: values.slotTime || null,
          startAt: values.startAt,
          endAt: values.endAt,
          items: items.map((item, index) => ({
            productId: item.productId,
            variantId: item.variantId ?? null,
            originalPrice: item.originalPrice,
            dealPrice: item.dealPrice,
            allocatedQuantity: item.allocatedQuantity,
            purchaseLimit: item.purchaseLimit,
            sortOrder: index,
          })),
        }),
      ).unwrap();
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
            : "Failed to create flash deal."),
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
        <span className="text-slate-900">New Flash Deal</span>
      </nav>

      <FlashDealForm
        mode="create"
        initialValues={flashDealInitialValues(null)}
        initialItems={[]}
        onSubmit={onSubmit}
        submitLabel="Create Flash Deal"
        cancelTo="/super-admin/promotion-engine/flash-deals"
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </div>
  );
};

export default NewFlashDealPage;
