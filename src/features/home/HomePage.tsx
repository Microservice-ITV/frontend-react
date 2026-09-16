
import HomeBanner from '@/features/home/components/HomeBanner'
import HomeQuickActions from '@/features/home/components/HomeQuickActions'
import CategoriesSection from '@/features/categories/components/CategoriesSection'
import TopOrderedProducts from './components/TopOrderedProducts'
import RecentlyAddedSection from './components/RecentlyAddedSection'
import FlashDealsSection from "@/features/flash-deals/components/FlashDealsSection";


const HomePage = () => {
  return (
    <>
      {/* FULL WIDTH – WHITE */}
      <section className="w-full bg-white">
        <HomeBanner />
        <HomeQuickActions />
      </section>

      <section className="bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <div className="bg-white">
            <CategoriesSection />
          </div>
        </div>
      </section>
      <section className="bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <div className="bg-white">
            <FlashDealsSection />
          </div>
        </div>
      </section>

      <section className="bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <div className="bg-white">
            <TopOrderedProducts />
          </div>
        </div>
      </section>

      <section className="bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 my-4">
          <div className="bg-white">
            <RecentlyAddedSection />
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePage;
