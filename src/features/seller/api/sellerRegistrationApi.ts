import axios from "axios";
import { productClient } from "@/lib/api/productClient";
import { slugifyShopSegment } from "@/utils/slugify";

export type ShopStatusDto = {
  id: number;
  code: string;
  label: string;
  description?: string | null;
};

export type ShopRowDto = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  userId: string | null;
  userName: string | null;
  sellerContactEmail?: string | null;
  sellerContactPhone?: string | null;
  originAddress: string | null;
  shopStatusId: number;
  shopStatus?: ShopStatusDto;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateSellerShopPayload = {
  name: string;
  slug: string;
  userName: string;
  description?: string;
  cityId?: string | null;
  districtId?: string | null;
  originAddress?: string | null;
  originLat?: number | null;
  originLng?: number | null;
  sellerContactEmail?: string;
  sellerContactPhone?: string;
};

export type SellerIdentityPayload = {
  entityType: "individual" | "business";
  legalName: string;
  dateOfBirth?: string;
  idDocumentType: "national_id" | "passport" | "drivers_license" | "other";
  idDocumentNumber: string;
  businessRegistrationNumber?: string;
  additionalNotes?: string;
  idFrontBase64: string;
  idBackBase64: string;
  idFrontFileName?: string;
  idBackFileName?: string;
};

export const getProductServiceErrorMessage = (
  err: unknown,
  fallback: string,
): string => {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.error?.message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

/** Always non-empty — avoids invalid slugs like `my-shop-` when slice() is empty. */
const randomSlugSuffix = (): string => {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 6; i += 1) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
};

/**
 * Creates a shop, retrying with a new slug when the server reports a slug collision (409).
 * Name collisions and “already have a shop” errors are surfaced to the caller.
 */
export const createSellerShopWithResilientSlug = async (
  shopName: string,
  rest: Omit<CreateSellerShopPayload, "slug" | "name">,
): Promise<ShopRowDto> => {
  const base = slugifyShopSegment(shopName) || "shop";
  for (let attempt = 0; attempt < 10; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${randomSlugSuffix()}`;
    try {
      return await sellerRegistrationApi.createShop({
        name: shopName.trim(),
        slug,
        ...rest,
      });
    } catch (e) {
      if (!axios.isAxiosError(e) || e.response?.status !== 409) throw e;
      const msg = getProductServiceErrorMessage(e, "").toLowerCase();
      if (msg.includes("slug") && attempt < 9) continue;
      throw e;
    }
  }
  throw new Error(
    "Could not reserve a unique shop link. Please try a different shop name.",
  );
};

export const sellerRegistrationApi = {
  async listShopsForUser(userId: string): Promise<ShopRowDto[]> {
    const res = await productClient.get<{
      success?: boolean;
      data?: ShopRowDto[];
    }>(`/shops/user/${userId}`);
    return res.data.data ?? [];
  },

  async createShop(body: CreateSellerShopPayload): Promise<ShopRowDto> {
    const res = await productClient.post<{
      success?: boolean;
      data?: ShopRowDto;
    }>("/shops", body);
    const shop = res.data.data;
    if (!shop?.id) throw new Error("Invalid response from shop create");
    return shop;
  },

  async upsertSellerIdentity(
    shopId: string,
    body: SellerIdentityPayload,
  ): Promise<void> {
    await productClient.put(`/shops/${shopId}/seller-identity`, body, {
      headers: { "Content-Type": "application/json" },
    });
  },
};
