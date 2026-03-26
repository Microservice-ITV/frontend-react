import { Link } from 'react-router-dom'

const ForbiddenPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-sm p-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">403 Forbidden</h1>
        <p className="mt-3 text-sm text-gray-600">
          You do not have permission to access this page.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-sm hover:bg-emerald-700"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForbiddenPage
