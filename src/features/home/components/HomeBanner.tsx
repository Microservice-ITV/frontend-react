import { useEffect, useState } from "react";
import { heroBannerApi } from "@/features/heroBanners/api/heroBannerApi";
import { promoCardApi } from "@/features/promoCards/api/promoCardApi";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroBanner } from "@/features/heroBanners/types/heroBannerTypes";
import type { PromoCard } from "@/features/promoCards/types/promoCardTypes";

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

  if (heroBanners.length === 0 && sideBanners.length === 0) {
    return null;
  }

  return (
    <section className="w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Carousel */}
          {heroBanners.length > 0 && (
            <div className="relative md:col-span-2 overflow-hidden rounded-lg group">
              <div
                className="flex transition-transform duration-500"
                style={{ transform: `translateX(-${current * 100}%)` }}
              >
                {heroBanners.map((banner) => (
                  <div key={banner.id} className="min-w-full">
                    <img
                      src={banner.imageUrl}
                      alt="Hero Banner"
                      className="w-full h-[235px] object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

              {/* Arrows */}
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

              {/* Right Arrow SVG (No background box) */}
              <button
                onClick={() => setCurrent((current + 1) % heroBanners.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white drop-shadow-md hover:text-gray-200 p-1 cursor-pointer opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                aria-label="Next slide"
              >
                <ChevronRight size={28} />
              </button>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {heroBanners.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full ${
                      i === current ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Side Banners */}
          {sideBanners.length > 0 && (
            <div className="hidden md:flex flex-col gap-4">
              {sideBanners.map((banner) => (
                <div key={banner.id} className="rounded-lg overflow-hidden">
                  <img
                    src={banner.imageUrl}
                    alt="Promo Banner"
                    className="w-full h-[110px] object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeBanner;
