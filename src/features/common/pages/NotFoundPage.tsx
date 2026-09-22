import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import notFoundImg from "@/assets/notfound/notfound.png";

const NotFoundPage = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/", { replace: true });
  };

  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center text-center">
          <img
            src={notFoundImg}
            alt="404 not found"
            className="h-36 w-auto"
            loading="lazy"
          />

          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Page not found
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            The page you&apos;re looking for doesn&apos;t exist or was moved.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Path:
            <span className="ml-1 font-mono text-slate-800">{pathname}</span>
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-sm border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-sm bg-[var(--dni-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--dni-primary-hover)]"
            >
              <Home className="h-4 w-4" aria-hidden />
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
