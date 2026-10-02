import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { productClient } from "@/lib/api/productClient";
import ProductGrid from "@/features/products/components/ProductGrid";
import Pagination from "@/components/ui/Pagination";
import { usePageTitle } from "@/components/routing/PageTitle";
import type { Product } from "@/features/products/types/productTypes";

const PAGE_SIZE = 10;

type ShopDetail = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  isActive?: boolean;
};

type ProductListItemRaw = {
  id: string;
  name: string;
  price: number | string;
  images?: string[];
  categoryId?: string;
  tags?: string[];
};

const ShopPage = () => {
  const { shopId } = useParams();
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "failed" | "succeeded">("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  usePageTitle(shop?.name);

  useEffect(() => {
    const id = String(shopId ?? "").trim();
    if (!id) return;

    let cancelled = false;
    setStatus("loading");
    setError(null);
    setCurrentPage(1);

    Promise.all([
      productClient.get<{ success: boolean; data: ShopDetail }>(`/shops/${id}`),
      productClient.get<{ success: boolean; data: ProductListItemRaw[] }>(`/products`, {
        params: { shopId: id, limit: 100 },
      }),
    ])
      .then(([shopRes, productsRes]) => {
        if (cancelled) return;
        setShop(shopRes.data.data);
        const rows = productsRes.data.data ?? [];
        setProducts(
          rows.map((p) => ({
            id: p.id,
            name: p.name,
            price: typeof p.price === "string" ? Number(p.price) : p.price,
            images: p.images ?? [],
            categoryId: p.categoryId ?? "",
            tags: p.tags ?? [],
          })),
        );
        setStatus("succeeded");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setStatus("failed");
        setError(e instanceof Error ? e.message : "Failed to load shop");
      });

    return () => {
      cancelled = true;
    };
  }, [shopId]);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedProducts = useMemo(
    () => products.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [products, safePage],
  );
  const pageStart = products.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safePage * PAGE_SIZE, products.length);

  return (
    <div className="bg-[#f5f5f5] pt-4 sm:pt-5 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {status === "loading" && (
          <div className="py-20 text-center text-sm text-gray-500 font-medium">
            Loading shop...
          </div>
        )}

        {status === "failed" && (
          <div className="py-20 text-center text-sm text-red-500 font-medium">
            {error || "Failed to load shop."}
          </div>
        )}

        {status === "succeeded" && shop && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-[2px] bg-emerald-600 px-2 py-px text-xs text-white">Shop</span>
              <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">
                {shop.name}
              </h1>
              {shop.description &&
              shop.description.trim().toLowerCase() !== shop.name.trim().toLowerCase() ? (
                <p className="w-full text-sm text-gray-500">{shop.description}</p>
              ) : null}
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-800">
                Products
              </h2>
              {products.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">No products found.</p>
              ) : (
                <>
                  <div className="mt-4">
                    <ProductGrid products={pagedProducts} />
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                      <p className="text-xs text-slate-600">
                        Showing {pageStart}-{pageEnd} of {products.length} products
                      </p>
                      <Pagination
                        page={safePage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        className="justify-center sm:justify-end"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShopPage;

