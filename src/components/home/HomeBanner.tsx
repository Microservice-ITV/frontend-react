import { useEffect, useState } from 'react'

const banners = [
  {
    id: 1,
    image:
      'https://down-sg.img.susercontent.com/file/sg-11134258-81ztm-miv2sg2cjwn86f',
    link: '/promo/1',
  },
  {
    id: 2,
    image:
      'https://down-sg.img.susercontent.com/file/sg-11134258-82615-mj9stjoprdvk8c',
    link: '/promo/2',
  },
  {
    id: 3,
    image:
      'https://down-sg.img.susercontent.com/file/sg-11134258-81zw2-mivbg22wlq820e',
    link: '/promo/3',
  },
]

const sideBanners = [
  {
    id: 1,
    image:
      'https://down-sg.img.susercontent.com/file/sg-11134258-81zwd-miv2tonncr9ge9',
    link: '/promo/side-1',
  },
  {
    id: 2,
    image:
      'https://down-sg.img.susercontent.com/file/sg-11134258-81zud-miv2wdgvbwg2ca',
    link: '/promo/side-2',
  },
]

const HomeBanner = () => {
  const [current, setCurrent] = useState(0)

  // Auto slide
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="w-full bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Carousel */}
          <div className="relative md:col-span-2 overflow-hidden rounded-lg">
            <div
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {banners.map((banner) => (
                <a
                  key={banner.id}
                  href={banner.link}
                  className="min-w-full"
                >
                  <img
                    src={banner.image}
                    alt="Banner"
                    className="w-full h-[235px] object-cover"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>

            {/* Arrows */}
            <button
              onClick={() =>
                setCurrent(
                  current === 0 ? banners.length - 1 : current - 1
                )
              }
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow cursor-pointer"
            >
              ‹
            </button>

            <button
              onClick={() =>
                setCurrent((current + 1) % banners.length)
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow cursor-pointer"
            >
              ›
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full ${
                    i === current ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Side Banners */}
          <div className="hidden md:flex flex-col gap-4">
            {sideBanners.map((banner) => (
              <a
                key={banner.id}
                href={banner.link}
                className="rounded-lg overflow-hidden"
              >
                <img
                  src={banner.image}
                  alt="Side Banner"
                  className="w-full h-[110px] object-cover"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomeBanner