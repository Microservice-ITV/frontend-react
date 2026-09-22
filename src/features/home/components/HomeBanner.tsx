import { useEffect, useState } from "react";
import { heroBannerApi } from "@/features/heroBanners/api/heroBannerApi";
import { promoCardApi } from "@/features/promoCards/api/promoCardApi";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import type { HeroBanner } from "@/features/heroBanners/types/heroBannerTypes";
import type { PromoCard } from "@/features/promoCards/types/promoCardTypes";

const BannerImage = ({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className: string;
}) => {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative ${className} flex items-center justify-center bg-gray-100`}
    >
      <ImageIcon className="h-10 w-10 text-gray-300" aria-hidden />
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
};

const HomeBanner = () => {
  const [current, setCurrent] = useState(0);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [sideBanners, setSideBanners] = useState<PromoCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const [heroRes, promoRes] = await Promise.all([
          heroBannerApi.getAll({ isActive: true }),
          promoCardApi.getAll(),
        ]);

        const activeHeroes = heroRes.data
          .filter((b) => b.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        const activePromos = promoRes.data
          .filter((p) => p.isActive)
          .sort((a, b) => {
            if (a.position === b.position) return 0;
            return a.position === "TOP" ? -1 : 1;
          });

        setHeroBanners(activeHeroes);
        setSideBanners(activePromos);
      } catch (error) {
        console.error("Failed to load banners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Auto slide
  useEffect(() => {
    if (heroBanners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroBanners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [heroBanners.length]);

  useEffect(() => {
    if (heroBanners.length > 0 && current >= heroBanners.length) setCurrent(0);
    if (heroBanners.length === 0 && current !== 0) setCurrent(0);
  }, [current, heroBanners.length]);

  if (loading) {
    return (
      <section className="w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 h-[235px] bg-gray-200 animate-pulse rounded-lg" />
            <div className="hidden md:flex flex-col gap-4">
              <div className="h-[110px] bg-gray-200 animate-pulse rounded-lg" />
              <div className="h-[110px] bg-gray-200 animate-pulse rounded-lg" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const heroSlides: Array<{ key: string; imageUrl?: string }> =
    heroBanners.length > 0
      ? heroBanners.map((b) => ({ key: b.id, imageUrl: b.imageUrl }))
      : [{ key: "fallback", imageUrl: undefined }];

  const promoSlots = 2;
  const promoSlides: Array<{ key: string; imageUrl?: string }> = Array.from(
    { length: promoSlots },
    (_, i) => {
      const banner = sideBanners[i];
      if (banner) return { key: banner.id, imageUrl: banner.imageUrl };
      return { key: `promo-fallback-${i}`, imageUrl: undefined };
    },
  );

  return (
    <section className="w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Carousel */}
          <div className="relative md:col-span-2 overflow-hidden rounded-lg group">
            <div
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {heroSlides.map((banner) => (
                <div key={banner.key} className="min-w-full">
                  <BannerImage
                    src={banner.imageUrl}
                    alt="Hero Banner"
                    className="w-full h-[235px] object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Arrows */}
            {heroBanners.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrent(
                      current === 0 ? heroBanners.length - 1 : current - 1,
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white drop-shadow-md hover:text-gray-200 p-1 cursor-pointer opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={28} />
                </button>

                <button
                  onClick={() => setCurrent((current + 1) % heroBanners.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white drop-shadow-md hover:text-gray-200 p-1 cursor-pointer opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  aria-label="Next slide"
                >
                  <ChevronRight size={28} />
                </button>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {heroBanners.map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 w-2 rounded-full ${
                        i === current ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Side Banners */}
          <div className="hidden md:flex flex-col gap-4">
            {promoSlides.map((banner) => (
              <div key={banner.key} className="rounded-lg overflow-hidden">
                <BannerImage
                  src={banner.imageUrl}
                  alt="Promo Banner"
                  className="w-full h-[110px] object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeBanner;
