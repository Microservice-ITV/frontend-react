import { useAppSelector } from '@/app/hooks'
import { MyCoupons } from '../components/MyCoupons'

const CoinsPage = () => {
  const userId = useAppSelector(state => state.auth.user?.id)
  return (
    <div className="p-6">
      <h1 className="text-lg font-medium text-gray-900 mb-2">My DNI Coins</h1>
      <p className="text-sm text-gray-600">
        Manage your coupons and rewards.
      </p>
      {userId && <MyCoupons key={userId} />}
    </div>
  )
}

export default CoinsPage

