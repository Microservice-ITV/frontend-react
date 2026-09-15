import { Phone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const PhoneAuthSection = () => {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate('/phone-auth')}
      className="
        group
        flex
        w-full
        items-center
        justify-center
        gap-3
        rounded-xl
        border
        border-gray-200
        bg-white
        px-4
        py-3
        text-sm
        font-semibold
        text-gray-800
        shadow-sm
        transition-all
        duration-200
        hover:border-gray-300
        hover:bg-gray-50
        hover:shadow-md
        active:scale-[0.99]
        focus:outline-none
        focus:ring-2
        focus:ring-black
        focus:ring-offset-2
      "
    >
      <span
        className="
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-full
          bg-gray-100
          transition-colors
          group-hover:bg-gray-200
        "
      >
        <Phone className="h-4 w-4" strokeWidth={2.2} />
      </span>

      Continue with phone
    </button>
  )
}

export default PhoneAuthSection