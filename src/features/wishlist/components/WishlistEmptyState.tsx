import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

const WishlistEmptyState = () => {
  return (
    <section className="min-h-[20rem] py-10 sm:min-h-[20rem] sm:py-12 bg-white">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        {/* ICON */}
        <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-rose-50">
          <Heart
            className="h-16 w-16 fill-rose-200 text-rose-300"
            strokeWidth={1.5}
          />
        </div>

        {/* TITLE */}
        <p className="mb-6 text-base font-medium text-gray-700">
          Your wishlist is empty
        </p>

        <p className="mb-6 text-sm leading-relaxed text-gray-600">
          You don&apos;t have any products in the wishlist yet. You will find a
          lot of interesting products on our &quot;Shop&quot; page.
        </p>

        {/* CTA */}
        <Link to="/">
          <button className="rounded-sm bg-[var(--dni-primary)] px-8 py-3 text-sm font-medium text-white hover:opacity-90 cursor-pointer">
            Start shopping now
          </button>
        </Link>
      </div>
    </section>
  );
};

export default WishlistEmptyState;
