import { useAppSelector } from '@/app/hooks'
import Categories from '@/features/home/components/Categories'
import HomeBanner from '@/features/home/components/HomeBanner'
import HomeQuickActions from '@/features/home/components/HomeQuickActions'

const HomePage = () => {
    const appName = useAppSelector((state) => state.app.appName)

    return (
        <>
            {/* FULL WIDTH – WHITE */}
            <section className="w-full bg-white">
                <HomeBanner />
                <HomeQuickActions />
            </section>

            {/* CENTERED – WHITE CARD */}
            <section className="bg-[#f5f5f5]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 bg-white my-4">
                <Categories />
                </div>
            </section>
        </>
    )
}

export default HomePage