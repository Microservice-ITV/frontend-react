import { useAppSelector } from '@/app/hooks'
import HomeBanner from '@/components/home/HomeBanner'
import HomeQuickActions from '@/components/home/HomeQuickActions'

const HomePage = () => {
    const appName = useAppSelector((state) => state.app.appName)

    return (
        <div className="bg-gray-50">
            <HomeBanner /> {/* Banner */}
            <HomeQuickActions /> {/* Quick Actions */}

            {/* Content */}
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome to {appName}
                </h1>

                <p className="mt-4 text-gray-600">
                    Redux + Tailwind + TypeScript are working correctly!
                </p>
            </div>
        </div>
    );
};

export default HomePage