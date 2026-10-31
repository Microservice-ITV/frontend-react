// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import ProductForm, {
  defaultVariantRow,
  type ProductFormValues,
} from "@/features/seller/components/ProductForm";

const colors = [
  { id: "red", name: "Red", code: "RED" },
  { id: "blue", name: "Blue", code: "BLU" },
  { id: "white", name: "White", code: "WHT" },
];

const sizes = [
  { id: "large", name: "Large" },
  { id: "medium", name: "Medium" },
];

const baseValues = (): ProductFormValues => ({
  name: "Tee",
  description: "",
  videoUrl: "",
  tags: "",
  slug: "tee",
  categoryId: "cat",
  brandId: "brand",
  primaryVariantIndex: 0,
  variants: [defaultVariantRow()],
  shopId: "shop",
  images: "",
  isActive: "true",
});

const renderForm = (initialValues: ProductFormValues = baseValues()) =>
  render(
    <MemoryRouter>
      <ProductForm
        mode="create"
        initialValues={initialValues}
        categoryOptions={[]}
        brandOptions={[]}
        colorOptions={colors}
        sizeOptions={sizes}
        submitLabel="Create Product"
        cancelTo="/seller/products"
        onSubmit={() => undefined}
      />
    </MemoryRouter>,
  );

describe("VariantSizeEditor", () => {
  afterEach(() => {
    cleanup();
  });

  it("opens one field row per ticked color and copies dimensions into the next color", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Red" }));
    expect(screen.getByText("Select a size first.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Base price")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Size"), "large");
    expect(screen.getByText("Tick a color to open its fields.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Red" }));
    // Selling price is read-only on create (set later via Inventory after PO).
    expect(screen.getByLabelText("Selling price")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Selling price")).toHaveValue("After PO");
    expect(
      screen.getByRole("button", {
        name: "Set after purchase order via Inventory → Edit selling price",
      }),
    ).toBeTruthy();
    await user.type(screen.getByLabelText("Length (cm)"), "10");

    await user.click(screen.getByRole("button", { name: "Blue" }));

    expect(screen.queryByLabelText("Base price")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Markup %")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Discount %")).not.toBeInTheDocument();
    const sellingPrices = screen.getAllByLabelText("Selling price");
    expect(sellingPrices).toHaveLength(2);
    expect(sellingPrices[0]).toHaveAttribute("readonly");
    expect(sellingPrices[0]).toHaveValue("After PO");
    expect(sellingPrices[1]).toHaveValue("After PO");
    expect(screen.getAllByLabelText("Length (cm)")[1]).toHaveValue("10");
    expect(screen.getByRole("button", { name: "Red, selected" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "White" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await user.click(screen.getByRole("button", { name: "Blue, selected" }));
    expect(screen.getAllByLabelText("Selling price")).toHaveLength(1);
  });

  it("keeps an existing size's colors together when editing", () => {
    const initial = baseValues();
    initial.variants = [
      {
        ...defaultVariantRow(),
        colorId: "red",
        sizeId: "large",
        basePrice: "10",
        listPrice: "20",
        length: "1",
        width: "2",
        height: "3",
        weight: "0.5",
      },
      {
        ...defaultVariantRow(),
        colorId: "white",
        sizeId: "large",
        basePrice: "12",
        listPrice: "22",
        length: "1",
        width: "2",
        height: "3",
        weight: "0.5",
      },
      {
        ...defaultVariantRow(),
        colorId: "blue",
        sizeId: "medium",
        basePrice: "8",
        listPrice: "18",
        length: "4",
        width: "5",
        height: "6",
        weight: "0.2",
      },
    ];
    initial.primaryVariantIndex = 2;

    renderForm(initial);

    const sizeSelects = screen.getAllByLabelText("Size");
    expect(sizeSelects).toHaveLength(2);
    expect(sizeSelects[0]).toHaveValue("large");
    expect(sizeSelects[1]).toHaveValue("medium");
    expect(
      screen.getAllByLabelText("Selling price").map((field) => (field as HTMLInputElement).value),
    ).toEqual(["20.00", "22.00", "18.00"]);
    expect(screen.getAllByLabelText("Selling price")[0]).toHaveAttribute("readonly");
    const primarySelect = screen.getByLabelText("Primary");
    expect(primarySelect).toHaveValue("blue");
    const primaryOptions = [...primarySelect.querySelectorAll("option")]
      .map((option) => option.value)
      .filter(Boolean);
    expect(primaryOptions).toEqual(["red", "white", "blue"]);
  });

  it("adds another size and hides sizes that are already used", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText("Size"), "large");
    await user.click(screen.getByRole("button", { name: "Add size" }));
    const sizeSelects = screen.getAllByLabelText("Size");
    expect(sizeSelects).toHaveLength(2);
    const secondSizeOptions = [...sizeSelects[1].querySelectorAll("option")].map(
      (option) => option.value,
    );
    expect(secondSizeOptions).not.toContain("large");
    expect(secondSizeOptions).toContain("medium");

    await user.selectOptions(sizeSelects[1], "medium");
    await user.click(screen.getAllByRole("button", { name: "White" })[1]);
    expect(screen.getAllByLabelText("Selling price")).toHaveLength(1);
    expect(screen.getAllByLabelText("Size")[1]).toHaveValue("medium");
  });
});
