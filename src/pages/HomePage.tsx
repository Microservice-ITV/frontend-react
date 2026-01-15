import { useAppSelector } from '@/app/hooks'
import Categories from '@/features/home/components/Categories';
import HomeBanner from '@/features/home/components/HomeBanner'
import HomeQuickActions from '@/features/home/components/HomeQuickActions'

const HomePage = () => {
    const appName = useAppSelector((state) => state.app.appName)

    return (
        <div className="bg-gray-50">
            <HomeBanner /> {/* Banner */}
            <HomeQuickActions /> {/* Quick Actions */}
            <Categories /> {/* Categories */}
        </div>
    );
};

export default HomePage