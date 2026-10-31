import type { ProductDetail } from "@/features/products/types/productTypes";
import { useEffect, useMemo, useState } from "react";
import { resolvePreviewVideo } from "@/features/products/utils/videoEmbed";
import YouTubeMark from "@/features/products/components/YouTubeMark";

const COLLAPSED_CHARS = 480;

type Props = { product: ProductDetail };

const SectionTitle = ({ children }: { children: string }) => (
  <div className="flex items-center gap-2 mb-3 sm:mb-4">
    <span
      className="h-5 w-1 rounded-full bg-[var(--dni-primary)]"
      aria-hidden
    />
    <h2 className="text-base sm:text-lg font-semibold text-gray-900">
      {children}
    </h2>
  </div>
);

/** Description (left) + click-to-load YouTube Preview Video (right). */
const ProductDescriptionSection = ({ product }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);

  useEffect(() => {
    setVideoStarted(false);
    setExpanded(false);
  }, [product.id, product.videoUrl]);

  const { displayText, embedSrc, thumbnailSrc } = useMemo(
    () => resolvePreviewVideo(product.description, product.videoUrl),
    [product.description, product.videoUrl],
  );

  const needsCollapse = displayText.length > COLLAPSED_CHARS;
  const shown =
    !displayText || !needsCollapse || expanded
      ? displayText
      : `${displayText.slice(0, COLLAPSED_CHARS).trimEnd()}…`;

  return (
    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-start">
      <section className="min-w-0 flex-1 bg-white rounded-sm p-4 sm:p-6 w-full">
        <SectionTitle>Product Description</SectionTitle>

        {displayText ? (
          <>
            <div className="text-sm sm:text-[15px] text-gray-700 whitespace-pre-wrap leading-relaxed">
              {shown}
            </div>
            {needsCollapse ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-3 text-sm font-medium text-[var(--dni-primary)] hover:text-[var(--dni-primary-hover)] transition cursor-pointer"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            ) : null}
          </>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {product.brandName ? (
              <div>
                <dt className="text-gray-500">Brand</dt>
                <dd className="mt-0.5 font-medium text-gray-900">
                  {product.brandName}
                </dd>
              </div>
            ) : null}
            {product.category?.name ? (
              <div>
                <dt className="text-gray-500">Category</dt>
                <dd className="mt-0.5 font-medium text-gray-900">
                  {product.category.name}
                </dd>
              </div>
            ) : null}
            {product.sku ? (
              <div>
                <dt className="text-gray-500">SKU</dt>
                <dd className="mt-0.5 font-medium text-gray-900">
                  {product.sku}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-gray-500">Shop</dt>
              <dd className="mt-0.5 font-medium text-gray-900">
                {product.shop.name}
              </dd>
            </div>
          </dl>
        )}
      </section>

      <aside className="w-full lg:w-[360px] xl:w-[400px] flex-shrink-0 self-start">
        <div className="bg-white rounded-sm p-4 sm:p-5">
          <SectionTitle>Preview Video</SectionTitle>

          {embedSrc ? (
            <div className="overflow-hidden rounded-xl bg-black aspect-video">
              {videoStarted ? (
                <iframe
                  src={embedSrc}
                  title={`${product.name} YouTube video`}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setVideoStarted(true)}
                  className="group relative h-full w-full cursor-pointer"
                  aria-label={`Play preview video for ${product.name}`}
                >
                  {thumbnailSrc ? (
                    <img
                      src={thumbnailSrc}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="absolute inset-0 bg-gray-900" />
                  )}
                  <span className="absolute inset-0 bg-black/25 transition group-hover:bg-black/35" />
                  <span
                    className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-white shadow-md transition group-hover:scale-105"
                    aria-hidden
                  >
                    <svg viewBox="0 0 24 24" className="ml-0.5 h-7 w-7 fill-current">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <YouTubeMark size={24} />
              </span>
              <p className="text-sm font-medium text-gray-700">
                No YouTube video yet
              </p>
              <p className="text-xs text-gray-500 max-w-[14rem] leading-relaxed">
                Add a YouTube URL in seller product create/edit to play it here.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default ProductDescriptionSection;
