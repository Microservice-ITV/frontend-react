type AuthBootstrapLoadingProps = {
  fullScreen?: boolean
}

const AuthBootstrapLoading = ({ fullScreen = false }: AuthBootstrapLoadingProps) => {
  return (
    <div className={fullScreen ? 'flex min-h-screen items-center justify-center' : 'flex min-h-[200px] items-center justify-center'}>
      <span className="text-slate-500">Loading...</span>
    </div>
  )
}

export default AuthBootstrapLoading