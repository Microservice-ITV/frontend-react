import { Link } from 'react-router-dom'
import { Clock, Store } from 'lucide-react'

type Props =
    | {
          variant: 'pending'
          shopName: string
      }
    | {
          variant: 'approved'
          shopName: string
      }

const SellerRegistrationBlocked = (props: Props) => {
    if (props.variant === 'pending') {
        return (
            <div className="min-h-[calc(100vh-120px)] bg-[#f5f5f5] py-6 sm:py-10">
                <div className="mx-auto w-full max-w-lg px-4">
                    <div className="rounded-sm border border-amber-100 bg-white px-6 py-10 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                            <Clock className="h-7 w-7" strokeWidth={2} aria-hidden />
                        </div>
                        <h1 className="text-lg font-semibold text-gray-900">Application under review</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Your shop <span className="font-medium text-gray-800">{props.shopName}</span> is pending
                            Super Admin approval. You&apos;ll be able to manage products once it&apos;s approved.
                        </p>
                        <Link
                            to="/"
                            className="mt-8 inline-block rounded-sm bg-[var(--dni-primary)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
                        >
                            Back to home
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-120px)] bg-[#f5f5f5] py-6 sm:py-10">
            <div className="mx-auto w-full max-w-lg px-4">
                <div className="rounded-sm border border-emerald-100 bg-white px-6 py-10 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                        <Store className="h-7 w-7" strokeWidth={2} aria-hidden />
                    </div>
                    <h1 className="text-lg font-semibold text-gray-900">Shop approved</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium text-gray-800">{props.shopName}</span> is approved. If your
                        account still shows as a buyer only, sign out and back in so your seller role refreshes.
                    </p>
                    <Link
                        to="/seller/overview"
                        className="mt-8 inline-block rounded-sm bg-[var(--dni-primary)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
                    >
                        Go to seller dashboard
                    </Link>
                    <Link to="/" className="mt-3 block text-sm text-gray-600 underline hover:text-gray-900">
                        Back to home
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default SellerRegistrationBlocked