
import HomeBanner from '@/features/home/components/HomeBanner'
import HomeQuickActions from '@/features/home/components/HomeQuickActions'
import CategoriesSection from '@/features/categories/components/CategoriesSection'
import TopOrderedProducts from './components/TopOrderedProducts'
import RecentlyAddedSection from './components/RecentlyAddedSection'
import FlashDealsSection from "@/features/flash-deals/components/FlashDealsSection";
import { useEffect, useRef } from 'react'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors'
import { selectAuthUser } from '@/features/auth/store/authSelectors'


const HomePage = () => {
  const { openModal } = useGlobalModal()
  const navigate = useNavigate()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const authUser = useAppSelector(selectAuthUser)
  const hasOpenedPrivacyModalRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) return
    if (hasOpenedPrivacyModalRef.current) return
    if (!authUser?.id) return

    const key = `dni.privacy_notice_ack.v1.user_${authUser.id}`
    let acknowledged = false
    try {
      acknowledged = localStorage.getItem(key) === '1'
    } catch {
      acknowledged = false
    }
    if (acknowledged) return

    hasOpenedPrivacyModalRef.current = true
    openModal({
      title: 'Your Privacy Matters',
      primaryLabel: 'I Understand',
      secondaryLabel: 'Learn More',
      content: (
        <div className="space-y-3">
          <p>
            We collect your information only to provide and improve our services, process your orders,
            and keep your account secure.
          </p>
          <p className="font-semibold">
            We do not sell or rent your personal information to third parties.
          </p>
          <p className="text-gray-700">
            Your information is protected and only shared with trusted service providers when necessary
            to deliver our services.
          </p>
        </div>
      ),
      onPrimary: () => {
        try {
          localStorage.setItem(key, '1')
        } catch {
          // ignore storage errors; modal may re-appear next time in that case
        }
      },
      onSecondary: () => {
        navigate('/privacy')
      },
    })
  }, [authUser?.id, isAuthenticated, navigate, openModal])

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
