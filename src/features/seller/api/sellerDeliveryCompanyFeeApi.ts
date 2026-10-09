import axios from "axios";
import { accountingClient } from "@/lib/api/accountingClient";

export type DeliveryChargingBasis = "PER_ORDER" | "PER_INVOICE";

export type SellerDeliveryCompanyFee = {
  id: string;
  shopId: string | null;
  deliveryCompanyId: string | null;
  chargingBasis: DeliveryChargingBasis;
  amount: string | number;
  currency: string;
  active: boolean;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SellerDeliveryCompanyFeePayload = {
  shopId: string;
  deliveryCompanyId: string;
  chargingBasis: DeliveryChargingBasis;
  amount: string;
  currency: string;
  active: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
};

export function getSellerDeliveryCompanyFeeApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: unknown; message?: unknown }
      | undefined;
    if (typeof data?.error === "string" && data.error.trim()) return data.error;
    if (
      data?.error
      && typeof data.error === "object"
      && "message" in data.error
      && typeof data.error.message === "string"
      && data.error.message.trim()
    ) {
      return data.error.message;
    }
    if (typeof data?.message === "string" && data.message.trim()) return data.message;
    if (error.message.trim()) return error.message;
  }
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

export const sellerDeliveryCompanyFeeApi = {
  async list(): Promise<SellerDeliveryCompanyFee[]> {
    const response = await accountingClient.get<{
      feeRules: SellerDeliveryCompanyFee[];
    }>("/delivery-company-fees");
    return response.data.feeRules;
  },

  async create(
    payload: SellerDeliveryCompanyFeePayload,
  ): Promise<SellerDeliveryCompanyFee> {
    const response = await accountingClient.post<{
      feeRule: SellerDeliveryCompanyFee;
    }>("/delivery-company-fees", payload);
    return response.data.feeRule;
  },

  async update(
    id: string,
    payload: SellerDeliveryCompanyFeePayload,
  ): Promise<SellerDeliveryCompanyFee> {
    const response = await accountingClient.patch<{
      feeRule: SellerDeliveryCompanyFee;
    }>(`/delivery-company-fees/${encodeURIComponent(id)}`, payload);
    return response.data.feeRule;
  },

  async setActive(
    id: string,
    active: boolean,
  ): Promise<SellerDeliveryCompanyFee> {
    const response = await accountingClient.patch<{
      feeRule: SellerDeliveryCompanyFee;
    }>(`/delivery-company-fees/${encodeURIComponent(id)}/status`, { active });
    return response.data.feeRule;
  },
};
