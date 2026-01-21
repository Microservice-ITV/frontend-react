import HomeBanner from '@/features/home/components/HomeBanner'
import HomeQuickActions from '@/features/home/components/HomeQuickActions'
import Categories from '../categories/components/Categories'

const HomePage = () => {
    return (
        <>
            {/* FULL WIDTH – WHITE */}
            <section className="w-full bg-white">
                <HomeBanner />
                <HomeQuickActions />
            </section>

            <section className="bg-[#f5f5f5]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 bg-white my-4">
                <Categories />
                </div>
            </section>
        </>
    )
}

export default HomePage