type AuthBootstrapLoadingProps = {
  fullScreen?: boolean
}

const AuthBootstrapLoading = ({ fullScreen = false }: AuthBootstrapLoadingProps) => {
  return (
    <div
      className={
        fullScreen
          ? 'flex min-h-screen flex-col items-center justify-center gap-[18px] bg-[#f5f5f5]'
          : 'flex min-h-[200px] items-center justify-center'
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={`relative grid place-items-center ${fullScreen ? 'h-[88px] w-[88px]' : 'h-11 w-11'}`}>
        <span
          className="absolute inset-0 animate-spin rounded-full border-[3px] border-[#d1fae5] border-t-[#059669] motion-reduce:animate-none motion-reduce:border-[#059669]"
          aria-hidden="true"
        />
        {fullScreen && (
          <img src="/brand-logo.svg?v=2" alt="" width={48} height={48} className="h-12 w-12" />
        )}
      </div>
      {fullScreen && (
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Loading
        </p>
      )}
      <span className="sr-only">Loading</span>
    </div>
  )
}

export default AuthBootstrapLoading