/**
 * Soft copy for storefront load failures — never surface raw API/429 text.
 */
export const STOREFRONT_UNAVAILABLE_MESSAGE =
  'This section is temporarily unavailable. Please try again in a moment.';

type StorefrontUnavailableNoticeProps = {
  className?: string;
  withRetry?: boolean;
  onRetry?: () => void;
};

export const StorefrontUnavailableNotice = ({
  className = '',
  withRetry = false,
  onRetry,
}: StorefrontUnavailableNoticeProps) => (
  <div
    className={`flex flex-col items-center justify-center gap-3 py-8 text-center text-sm text-gray-500 ${className}`}
    role="status"
  >
    <p>{STOREFRONT_UNAVAILABLE_MESSAGE}</p>
    {withRetry && onRetry ? (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 text-gray-600 transition-colors hover:border-emerald-500 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      >
        Try again
      </button>
    ) : null}
  </div>
);

export default StorefrontUnavailableNotice;
