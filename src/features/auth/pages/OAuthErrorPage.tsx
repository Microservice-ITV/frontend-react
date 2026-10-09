import { Link } from 'react-router-dom'

const OAuthErrorPage = () => {
  return (
    <div className="px-4 pt-8 pb-12 flex flex-col items-center">
      <div className="w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold text-gray-900 text-center">
          Social login failed
        </h1>

        <p className="mt-2 text-sm text-gray-600 text-center">
          We couldn&apos;t complete your sign in with Google or Facebook. Please try again
          or use your email and password.
        </p>

        <Link
          to="/login"
          className="mt-6 inline-flex h-10 w-full cursor-pointer items-center justify-center rounded bg-emerald-600 py-2 text-white transition hover:bg-emerald-700"
        >
          Back to login
        </Link>

        <p className="mt-6 text-sm text-center text-gray-600">
          <Link to="/" className="font-medium text-black hover:underline">
            Go to homepage
          </Link>
        </p>
      </div>
    </div>
  )
}

export default OAuthErrorPage
