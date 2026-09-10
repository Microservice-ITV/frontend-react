import { Search } from 'lucide-react'

type HelpSearchHeroProps = {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onSubmit: () => void
}

const HelpSearchHero = ({ searchQuery, onSearchQueryChange, onSubmit }: HelpSearchHeroProps) => (
  <section className="relative left-1/2 w-screen -translate-x-1/2 bg-gradient-to-br from-emerald-100 via-emerald-50 to-gray-50 px-4 py-10 sm:px-6">
    <h1 className="text-center text-2xl font-semibold text-emerald-700 sm:text-3xl">
      Hi, how can we help?
    </h1>

    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      className="mx-auto mt-8 flex max-w-3xl items-stretch overflow-hidden rounded-sm border border-gray-300 bg-white focus-within:border-emerald-500"
    >
      <input
        type="text"
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
        placeholder="Search..."
        className="min-w-0 flex-1 px-5 py-4 text-base text-gray-700 outline-none placeholder:text-gray-500"
      />
      <button
        type="submit"
        className="flex h-[58px] w-[58px] shrink-0 items-center justify-center border-l border-gray-300 bg-emerald-600 text-white transition-colors hover:bg-emerald-700"
        aria-label="Search help centre"
      >
        <Search className="h-5 w-5" />
      </button>
    </form>
  </section>
)

export default HelpSearchHero
