import { useAppSelector } from '@/app/hooks'

function App() {
  const appName = useAppSelector(state => state.app.appName)

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <h1 className="text-3xl font-bold underline text-center text-gray-900">
        Welcome to {appName}
      </h1>

      <p className="mt-4 text-blue-600 dark:text-sky-400 text-center">
        Redux + Tailwind + TypeScript are working correctly!
      </p>
    </div>
  )
}

export default App