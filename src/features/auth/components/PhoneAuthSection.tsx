import { Phone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const PhoneAuthSection = () => {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate('/phone-auth')}
      className="flex h-10 w-full items-center justify-center gap-2 border border-gray-300 rounded bg-white hover:border-gray-400 transition cursor-pointer"
    >
      <Phone className="h-4 w-4 text-gray-700" strokeWidth={2} />
      <span className="font-medium text-gray-700">Continue with phone</span>
    </button>
  )
}

export default PhoneAuthSection