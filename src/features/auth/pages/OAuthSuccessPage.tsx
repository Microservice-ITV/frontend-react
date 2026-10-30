import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch } from '@/app/hooks'
import { fetchMe } from '@/features/auth/store/authThunks'
import { setAccessToken, setHasSession } from '@/features/auth/store/authSlice'
import { setSessionCookie } from '@/utils/session'
import { extractRolesFromUser } from '@/app/rbac/normalizers'
import { getDefaultLandingPathByRole } from '@/app/rbac/navigation'

const OAuthSuccessPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash

    const params = new URLSearchParams(hash)
    const token = params.get('token')

    if (!token) {
      navigate('/oauth-error', { replace: true })
      return
    }

    // If opened in a popup, notify the opener and close this window
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(
          { type: 'OAUTH_SUCCESS', token },
          window.location.origin
        )
        window.close()
        return
      } catch {
        // If cross-origin or any error, fall back to in-window handling below
      }
    }

    // Clean hash from URL so the token isn't left in the address bar
    window.history.replaceState(
      null,
      document.title,
      location.pathname + location.search
    )

    ;(async () => {
      try {
        dispatch(setAccessToken(token))
        dispatch(setHasSession(true))
        setSessionCookie()
        const user = await dispatch(fetchMe()).unwrap()
        const role = extractRolesFromUser(user)
        navigate(getDefaultLandingPathByRole(role), { replace: true })
      } catch {
        navigate('/oauth-error', { replace: true })
      }
    })()
  }, [dispatch, navigate, location.pathname, location.search])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-sm text-gray-600">Signing you in with your social account...</p>
      </div>
    </div>
  )
}

export default OAuthSuccessPage

