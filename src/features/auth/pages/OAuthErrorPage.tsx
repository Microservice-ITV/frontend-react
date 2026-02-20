import { Link } from 'react-router-dom'

const OAuthErrorPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Social login failed
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          We couldn&apos;t complete your sign in with Google or Facebook. Please try again
          or use your email and password.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 transition"
          >
            Back to login
          </Link>
          <Link
            to="/"
            className="text-xs text-gray-500 hover:text-gray-700 transition"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OAuthErrorPage

