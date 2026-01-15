import { useState } from 'react'
import { Link } from 'react-router-dom'
import ContentContainer from '@/components/layouts/ContentContainer'
import { categoriesMock } from '../mocks/categories.mock'

const ITEMS_PER_PAGE = 10;

const Categories = () => {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(categoriesMock.length / ITEMS_PER_PAGE);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <section className="bg-white py-6">
      <ContentContainer>
        <h2 className="mb-4 text-base font-semibold text-gray-800">
          Categories
        </h2>

        {/* ===== Desktop Carousel ===== */}
        <div className="relative hidden md:block">
          <div className="overflow-hidden">
            <ul
              className="flex transition-transform duration-500 ease-out"
              style={{
                width: `${totalPages * 100}%`,
                transform: `translateX(-${page * (100 / totalPages)}%)`,
              }}
            >
              {Array.from({ length: totalPages }).map((_, pageIndex) => (
                <li
                  key={pageIndex}
                  className="grid grid-cols-5 gap-y-6 w-full shrink-0"
                  style={{ width: `${100 / totalPages}%` }}
                >
                  {categoriesMock
                    .slice(
                      pageIndex * ITEMS_PER_PAGE,
                      pageIndex * ITEMS_PER_PAGE + ITEMS_PER_PAGE
                    )
                    .map((cat) => (
                      <Link
                        key={cat.id}
                        to={cat.link}
                        className="flex flex-col items-center text-center hover:bg-gray-50 py-2"
                      >
                        <div
                          className="
                            w-16 h-16
                            rounded-full
                            border
                            bg-gray-50
                            flex items-center justify-center
                            text-xs text-gray-400
                          "
                        >
                          Icon
                        </div>

                        <span className="mt-2 text-xs text-gray-700 line-clamp-2 px-2">
                          {cat.name}
                        </span>
                      </Link>
                    ))}
                </li>
              ))}
            </ul>
          </div>

          {/* Left Arrow */}
          {canPrev && (
            <button
              onClick={() => setPage((p) => p - 1)}
              className="
                absolute left-0 top-1/2 -translate-y-1/2
                w-9 h-9 rounded-full
                bg-white shadow
                flex items-center justify-center
                hover:bg-gray-100
              "
            >
              ‹
            </button>
          )}

          {/* Right Arrow */}
          {canNext && (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="
                absolute right-0 top-1/2 -translate-y-1/2
                w-9 h-9 rounded-full
                bg-white shadow
                flex items-center justify-center
                hover:bg-gray-100
              "
            >
              ›
            </button>
          )}
        </div>

        {/* ===== Mobile Scroll ===== */}
        <div className="md:hidden overflow-x-auto">
          <ul className="flex gap-4 w-max">
            {categoriesMock.map((cat) => (
              <li key={cat.id} className="shrink-0 w-[96px]">
                <Link
                  to={cat.link}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className="
                      w-16 h-16
                      rounded-full
                      border
                      bg-gray-50
                      flex items-center justify-center
                      text-xs text-gray-400
                    "
                  >
                    Icon
                  </div>

                  <span className="mt-2 text-xs text-gray-700 line-clamp-2">
                    {cat.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </ContentContainer>
    </section>
  );
};

export default Categories;
