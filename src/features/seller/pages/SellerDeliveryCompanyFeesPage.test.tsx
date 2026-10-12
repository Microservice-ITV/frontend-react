// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAppSelector } from "@/app/hooks";
import { shippingApi } from "@/features/shipping/api/shippingApi";
import {
  sellerDeliveryCompanyFeeApi,
  type SellerDeliveryCompanyFee,
} from "../api/sellerDeliveryCompanyFeeApi";
import SellerDeliveryCompanyFeesPage from "./SellerDeliveryCompanyFeesPage";

vi.mock("@/app/hooks", () => ({
  useAppSelector: vi.fn(),
}));

vi.mock("@/features/shipping/api/shippingApi", () => ({
  shippingApi: {
    listActiveDeliveryCompanies: vi.fn(),
  },
}));

vi.mock("../api/sellerDeliveryCompanyFeeApi", () => ({
  sellerDeliveryCompanyFeeApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setActive: vi.fn(),
  },
  getSellerDeliveryCompanyFeeApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

const createdRule: SellerDeliveryCompanyFee = {
  id: "fee-1",
  shopId: "shop-2",
  deliveryCompanyId: "company-a",
  chargingBasis: "PER_INVOICE",
  amount: "300.00",
  currency: "MMK",
  active: true,
  effectiveFrom: "2026-10-10T00:00:00.000Z",
  effectiveTo: null,
  createdAt: "2026-10-10T00:00:00.000Z",
  updatedAt: "2026-10-10T00:00:00.000Z",
};

function renderPage() {
  return render(
    <MemoryRouter>
      <SellerDeliveryCompanyFeesPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAppSelector).mockReturnValue({
    id: "seller-1",
    active_shop_id: "shop-1",
    active_shop_name: "Shop One",
  } as never);
  vi.mocked(shippingApi.listActiveDeliveryCompanies).mockResolvedValue({
    data: {
      success: true,
      data: {
        companies: [
          { id: "company-a", code: "ROYAL", name: "Royal Delivery", status: "ACTIVE" },
        ],
      },
    },
  } as never);
  vi.mocked(sellerDeliveryCompanyFeeApi.list).mockResolvedValue([]);
  vi.mocked(sellerDeliveryCompanyFeeApi.create).mockResolvedValue(createdRule);
});

afterEach(() => {
  cleanup();
});

describe("SellerDeliveryCompanyFeesPage", () => {
  it("uses the logged-in shop context without a shop selector and preserves the customer shipping distinction", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole("heading", { name: "Delivery Expense Fees" })).toBeInTheDocument();
    expect(screen.queryByText(/Managing delivery expenses for/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No additional active Delivery Company/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Shop")).not.toBeInTheDocument();
    expect(screen.getByText(/does not change the shipping fee charged to customers at checkout/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add Delivery Company" }));
    await user.selectOptions(screen.getByLabelText("Fee basis"), "PER_INVOICE");
    await user.type(screen.getByLabelText("Provider delivery expense"), "300");
    await user.click(screen.getByRole("button", { name: "Save configuration" }));

    await waitFor(() => {
      expect(sellerDeliveryCompanyFeeApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          shopId: "shop-1",
          deliveryCompanyId: "company-a",
          chargingBasis: "PER_INVOICE",
          amount: "300",
          currency: "MMK",
          active: true,
          effectiveTo: null,
        }),
      );
    });
  });
});
