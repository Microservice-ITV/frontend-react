import { Link } from "react-router-dom";

const actions = ["Vouchers", "Coins", "Majulah Club", "Fulfilled", "Supermarket", "Styled", "Home", "Tech", "Mall", "Promotions"];

const HomeQuickActions = () => {
    return (
        <section className="bg-white">
            {/* SAME WIDTH AS HOME BANNER */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6">

                {/* MOBILE: horizontal snap scroll | DESKTOP: grid */}
                <div
                    className="flex md:grid grid-cols-10 gap-4 py-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none scrollbar-hide"
                >
                    {actions.map((label) => (
                        <Link
                            key={label}
                            to="#"
                            className="flex-shrink-0 md:flex-shrink w-20 md:w-auto snap-start flex flex-col items-center gap-2 text-center"
                        >
                            {/* Icon */}
                            <div className="w-14 h-14 rounded-lg bg-gray-100 border flex items-center justify-center text-xs text-gray-400">
                                Icon
                            </div>

                            {/* Label */}
                            <span className="text-xs text-gray-700 leading-tight">
                                {label}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HomeQuickActions;
