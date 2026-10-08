import axios, { AxiosResponse } from "axios";
import { shippingClient } from "@/lib/api/shippingClient";
import { deliveryClient } from "@/lib/api/deliveryClient";

export type PricingRuleStatus = "ACTIVE" | "INACTIVE";
export type WeightRoundingMethod = "ROUND_UP" | "ROUND_DOWN" | "ROUND_NEAREST";
export type DeliveryServiceType = "STANDARD";

export type WeightRateDto = {
  baseWeightKg: number;
  baseFee: number;
  additionalWeightKg: number;
  additionalFee: number;
};

export type DistanceRateDto = {
  id?: string;
  minDistanceKm: number;
  maxDistanceKm: number | null;
  fee: number;
};

export type DeliveryPricingRuleDto = {
  id: string;
  deliveryCompanyId: string;
  name: string;
  serviceType: DeliveryServiceType;
  dimensionalDivisor: number;
  weightRoundingMethod: WeightRoundingMethod;
  weightRoundingIncrement: number;
  currency: string;
  minimumFee: number;
  maximumFee: number;
  effectiveFrom: string;
  effectiveUntil: string | null;
  version: number;
  status: PricingRuleStatus;
  createdAt: string;
  updatedAt: string;
  weightRate: WeightRateDto | null;
  distanceRates: DistanceRateDto[];
};

export type PricingRuleDistanceRateInput = {
  minDistanceKm: number;
  maxDistanceKm: number | null;
  fee: number;
};

export type CreatePricingRulePayload = {
  deliveryCompanyId: string;
  name: string;
  serviceType: DeliveryServiceType;
  dimensionalDivisor: number;
  weightRoundingMethod: WeightRoundingMethod;
  weightRoundingIncrement: number;
  currency: string;
  minimumFee: number;
  maximumFee: number;
  effectiveFrom: string;
  effectiveUntil: string | null;
  status: PricingRuleStatus;
  weightRate?: WeightRateDto;
  distanceRates?: PricingRuleDistanceRateInput[];
};

export type UpdatePricingRulePayload = Partial<CreatePricingRulePayload>;

export type PricingRuleListData = {
  total: number;
  page: number;
  pageSize: number;
  rules: DeliveryPricingRuleDto[];
};

export type ListPricingRulesParams = {
  page?: number;
  pageSize?: number;
  status?: PricingRuleStatus;
  serviceType?: DeliveryServiceType;
  deliveryCompanyId?: string;
  search?: string;
};

export type DeliveryQuoteStatus = "ACTIVE" | "EXPIRED" | "USED" | "CANCELLED";

export type ShippingCalculationMethod = "REAL_ROUTE" | "CITY_ROUTE";

export type DeliveryQuotePricingRuleSummary = {
  id: string;
  name: string;
  serviceType: DeliveryServiceType;
  version: number;
};

export type DeliveryQuoteItemSnapshot = {
  productId: string;
  variantId: string | null;
  productName: string | null;
  quantity: number;
};

export type DeliveryQuoteDto = {
  id: string;
  quoteNumber: string;
  customerId: string | null;
  customerName: string | null;
  shopId: string;
  shopName: string | null;
  items: DeliveryQuoteItemSnapshot[] | null;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  distanceKm: number;
  durationMinutes: number;
  /** Snapshot of how this quote was priced. */
  calculationMethod: ShippingCalculationMethod;
  fromDistrictId: string | null;
  toDistrictId: string | null;
  cityRateId: string | null;
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  baseFee: number;
  distanceFee: number;
  weightFee: number;
  additionalFee: number;
  totalFee: number;
  currency: string;
  pricingRuleId: string;
  pricingVersion: number;
  pricingRule: DeliveryQuotePricingRuleSummary;
  deliveryCompanyId: string;
  deliveryCompanyName: string | null;
  status: DeliveryQuoteStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryQuoteListData = {
  total: number;
  page: number;
  pageSize: number;
  quotes: DeliveryQuoteDto[];
};

export type ListDeliveryQuotesParams = {
  page?: number;
  pageSize?: number;
  status?: DeliveryQuoteStatus;
  shopId?: string;
  search?: string;
};

export type PricingRuleSummaryDto = {
  id: string;
  name: string;
  serviceType: DeliveryServiceType;
  currency: string;
  status: PricingRuleStatus;
  version: number;
};

export type AdminWeightRateDto = WeightRateDto & {
  id: string;
  pricingRuleId: string;
  pricingRule: PricingRuleSummaryDto;
  createdAt: string;
  updatedAt: string;
};

export type WeightRateListData = {
  total: number;
  page: number;
  pageSize: number;
  weightRates: AdminWeightRateDto[];
};

export type CreateWeightRatePayload = {
  pricingRuleId: string;
  baseWeightKg: number;
  baseFee: number;
  additionalWeightKg: number;
  additionalFee: number;
};

export type UpdateWeightRatePayload = Partial<
  Omit<CreateWeightRatePayload, "pricingRuleId">
>;

export type ListWeightRatesParams = {
  page?: number;
  pageSize?: number;
  pricingRuleId?: string;
  search?: string;
};

export type AdminDistanceRangeDto = {
  id: string;
  pricingRuleId: string;
  minDistanceKm: number;
  maxDistanceKm: number | null;
  fee: number;
  pricingRule: PricingRuleSummaryDto;
  createdAt: string;
  updatedAt: string;
};

export type DistanceRangeListData = {
  total: number;
  page: number;
  pageSize: number;
  distanceRanges: AdminDistanceRangeDto[];
};

export type CreateDistanceRangePayload = {
  pricingRuleId: string;
  minDistanceKm: number;
  maxDistanceKm: number | null;
  fee: number;
};

export type UpdateDistanceRangePayload = {
  minDistanceKm?: number;
  maxDistanceKm?: number | null;
  fee?: number;
};

export type ListDistanceRangesParams = {
  page?: number;
  pageSize?: number;
  pricingRuleId?: string;
  search?: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export type DeliveryCityRateStatus = "ACTIVE" | "INACTIVE";

export type AdminDeliveryCityRateDto = {
  id: string;
  deliveryCompanyId: string;
  fromDistrictId: string;
  toDistrictId: string;
  amount: number;
  currency: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  status: DeliveryCityRateStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateDeliveryCityRatePayload = {
  deliveryCompanyId: string;
  fromDistrictId: string;
  toDistrictId: string;
  amount: number;
  currency: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
};

export type UpdateDeliveryCityRatePayload = Partial<
  Omit<CreateDeliveryCityRatePayload, "fromDistrictId" | "toDistrictId">
>;

export type DeliveryCityRateListData = {
  total: number;
  page: number;
  pageSize: number;
  cityRates: AdminDeliveryCityRateDto[];
};

export type ListDeliveryCityRatesParams = {
  page?: number;
  pageSize?: number;
  status?: DeliveryCityRateStatus;
  deliveryCompanyId?: string;
  fromDistrictId?: string;
  toDistrictId?: string;
};

export type ShippingSettingsDto = {
  id: string;
  calculationMethod: ShippingCalculationMethod;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryCompanyStatus = "ACTIVE" | "INACTIVE";

export type DeliveryCompanyDto = {
  id: string;
  code: string;
  name: string;
  providerId: string | null;
  description: string | null;
  logoUrl: string | null;
  status: DeliveryCompanyStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateDeliveryCompanyPayload = {
  code: string;
  name: string;
  providerId: string;
  description?: string | null;
  logoUrl?: string | null;
};

export type UpdateDeliveryCompanyPayload = Partial<CreateDeliveryCompanyPayload>;

export type DeliveryProviderOption = {
  id: string;
  code: string;
  name: string;
  active: boolean;
};

export type DeliveryCompanyListData = {
  total: number;
  page: number;
  pageSize: number;
  companies: DeliveryCompanyDto[];
};

export type ListDeliveryCompaniesParams = {
  page?: number;
  pageSize?: number;
  status?: DeliveryCompanyStatus;
  search?: string;
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
        return "Cannot reach the shipping service. Check that it is running on port 5020, then try again.";
      }
      return error.message || fallback;
    }
    const data = error.response.data as
      | { error?: { message?: string } | string; message?: string }
      | undefined;
    const nested =
      typeof data?.error === "object" ? data?.error?.message : data?.error;
    const message = nested ?? data?.message;
    if (typeof message === "string" && message.trim()) return message;
    if (error.response.status === 502 || error.response.status === 503) {
      return "Shipping service is temporarily unavailable. Please try again in a moment.";
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export const adminShippingApi = {
  listPricingRules(
    params: ListPricingRulesParams = {},
  ): Promise<AxiosResponse<ApiEnvelope<PricingRuleListData>>> {
    return shippingClient.get("/admin/pricing-rules", { params });
  },

  getPricingRule(
    id: string,
  ): Promise<AxiosResponse<ApiEnvelope<DeliveryPricingRuleDto>>> {
    return shippingClient.get(`/admin/pricing-rules/${id}`);
  },

  createPricingRule(
    payload: CreatePricingRulePayload,
  ): Promise<AxiosResponse<ApiEnvelope<DeliveryPricingRuleDto>>> {
    return shippingClient.post("/admin/pricing-rules", payload);
  },

  updatePricingRule(
    id: string,
    payload: UpdatePricingRulePayload,
  ): Promise<AxiosResponse<ApiEnvelope<DeliveryPricingRuleDto>>> {
    return shippingClient.put(`/admin/pricing-rules/${id}`, payload);
  },

  deletePricingRule(
    id: string,
  ): Promise<AxiosResponse<ApiEnvelope<{ deleted: boolean; id: string }>>> {
    return shippingClient.delete(`/admin/pricing-rules/${id}`);
  },

  listWeightRates(
    params: ListWeightRatesParams = {},
  ): Promise<AxiosResponse<ApiEnvelope<WeightRateListData>>> {
    return shippingClient.get("/admin/weight-rates", { params });
  },

  getWeightRate(
    id: string,
  ): Promise<AxiosResponse<ApiEnvelope<AdminWeightRateDto>>> {
    return shippingClient.get(`/admin/weight-rates/${id}`);
  },

  createWeightRate(
    payload: CreateWeightRatePayload,
  ): Promise<AxiosResponse<ApiEnvelope<AdminWeightRateDto>>> {
    return shippingClient.post("/admin/weight-rates", payload);
  },

  updateWeightRate(
    id: string,
    payload: UpdateWeightRatePayload,
  ): Promise<AxiosResponse<ApiEnvelope<AdminWeightRateDto>>> {
    return shippingClient.put(`/admin/weight-rates/${id}`, payload);
  },

  deleteWeightRate(
    id: string,
  ): Promise<AxiosResponse<ApiEnvelope<{ deleted: boolean; id: string }>>> {
    return shippingClient.delete(`/admin/weight-rates/${id}`);
  },

  listDistanceRanges(
    params: ListDistanceRangesParams = {},
  ): Promise<AxiosResponse<ApiEnvelope<DistanceRangeListData>>> {
    return shippingClient.get("/admin/distance-ranges", { params });
  },

  getDistanceRange(
    id: string,
  ): Promise<AxiosResponse<ApiEnvelope<AdminDistanceRangeDto>>> {
    return shippingClient.get(`/admin/distance-ranges/${id}`);
  },

  createDistanceRange(
    payload: CreateDistanceRangePayload,
  ): Promise<AxiosResponse<ApiEnvelope<AdminDistanceRangeDto>>> {
    return shippingClient.post("/admin/distance-ranges", payload);
  },

  updateDistanceRange(
    id: string,
    payload: UpdateDistanceRangePayload,
  ): Promise<AxiosResponse<ApiEnvelope<AdminDistanceRangeDto>>> {
    return shippingClient.put(`/admin/distance-ranges/${id}`, payload);
  },

  deleteDistanceRange(
    id: string,
  ): Promise<AxiosResponse<ApiEnvelope<{ deleted: boolean; id: string }>>> {
    return shippingClient.delete(`/admin/distance-ranges/${id}`);
  },

  listDeliveryQuotes(
    params: ListDeliveryQuotesParams = {},
  ): Promise<AxiosResponse<ApiEnvelope<DeliveryQuoteListData>>> {
    return shippingClient.get("/admin/quotes", { params });
  },

  getDeliveryQuote(
    id: string,
  ): Promise<AxiosResponse<ApiEnvelope<DeliveryQuoteDto>>> {
    return shippingClient.get(`/admin/quotes/${id}`);
  },

  cancelDeliveryQuote(
    id: string,
  ): Promise<AxiosResponse<ApiEnvelope<DeliveryQuoteDto>>> {
    return shippingClient.post(`/admin/quotes/${id}/cancel`);
  },

  deleteDeliveryQuote(
    id: string,
  ): Promise<AxiosResponse<ApiEnvelope<{ deleted: boolean; id: string }>>> {
    return shippingClient.delete(`/admin/quotes/${id}`);
  },

  listDeliveryCityRates(
    params: ListDeliveryCityRatesParams = {},
  ): Promise<AxiosResponse<ApiEnvelope<DeliveryCityRateListData>>> {
    return shippingClient.get("/admin/city-rates", { params });
  },

  getDeliveryCityRate(
    id: string,
  ): Promise<AxiosResponse<ApiEnvelope<AdminDeliveryCityRateDto>>> {
    return shippingClient.get(`/admin/city-rates/${id}`);
  },

  createDeliveryCityRate(
    payload: CreateDeliveryCityRatePayload,
  ): Promise<AxiosResponse<ApiEnvelope<AdminDeliveryCityRateDto>>> {
    return shippingClient.post("/admin/city-rates", payload);
  },

  updateDeliveryCityRate(
    id: string,
    payload: UpdateDeliveryCityRatePayload,
  ): Promise<AxiosResponse<ApiEnvelope<AdminDeliveryCityRateDto>>> {
    return shippingClient.put(`/admin/city-rates/${id}`, payload);
  },

  updateDeliveryCityRateStatus(
    id: string,
    status: DeliveryCityRateStatus,
  ): Promise<AxiosResponse<ApiEnvelope<AdminDeliveryCityRateDto>>> {
    return shippingClient.patch(`/admin/city-rates/${id}/status`, { status });
  },

  deleteDeliveryCityRate(
    id: string,
  ): Promise<AxiosResponse<ApiEnvelope<{ deleted: boolean; id: string }>>> {
    return shippingClient.delete(`/admin/city-rates/${id}`);
  },

  getShippingSettings(): Promise<
    AxiosResponse<ApiEnvelope<ShippingSettingsDto>>
  > {
    return shippingClient.get("/admin/shipping-settings");
  },

  updateShippingSettings(payload: {
    calculationMethod: ShippingCalculationMethod;
  }): Promise<AxiosResponse<ApiEnvelope<ShippingSettingsDto>>> {
    return shippingClient.put("/admin/shipping-settings", payload);
  },

  listDeliveryCompanies(
    params: ListDeliveryCompaniesParams = {},
  ): Promise<AxiosResponse<ApiEnvelope<DeliveryCompanyListData>>> {
    return shippingClient.get("/admin/delivery-companies", { params });
  },

  getDeliveryCompany(
    id: string,
  ): Promise<AxiosResponse<ApiEnvelope<DeliveryCompanyDto>>> {
    return shippingClient.get(`/admin/delivery-companies/${id}`);
  },

  async listDeliveryProviders(): Promise<DeliveryProviderOption[]> {
    const response = await deliveryClient.get<{ providers: DeliveryProviderOption[] }>("/delivery-providers");
    return response.data.providers;
  },

  createDeliveryCompany(
    payload: CreateDeliveryCompanyPayload,
  ): Promise<AxiosResponse<ApiEnvelope<DeliveryCompanyDto>>> {
    return shippingClient.post("/admin/delivery-companies", payload);
  },

  updateDeliveryCompany(
    id: string,
    payload: UpdateDeliveryCompanyPayload,
  ): Promise<AxiosResponse<ApiEnvelope<DeliveryCompanyDto>>> {
    return shippingClient.patch(`/admin/delivery-companies/${id}`, payload);
  },

  updateDeliveryCompanyStatus(
    id: string,
    status: DeliveryCompanyStatus,
  ): Promise<AxiosResponse<ApiEnvelope<DeliveryCompanyDto>>> {
    return shippingClient.patch(`/admin/delivery-companies/${id}/status`, { status });
  },

  deleteDeliveryCompany(
    id: string,
  ): Promise<AxiosResponse<ApiEnvelope<{ deleted: boolean; id: string }>>> {
    return shippingClient.delete(`/admin/delivery-companies/${id}`);
  },

  getApiErrorMessage,
};
