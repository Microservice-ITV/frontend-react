import { socialFacebookIcon, socialGoogleIcon } from "@/assets/icons"
import { getOAuthRedirectUrl } from "@/lib/api/apiConfig"

const POPUP_WIDTH = 500
const POPUP_HEIGHT = 600

const SocialAuthSection = () => {
    const handleSocialClick = (provider: 'google' | 'facebook') => {
        const url = getOAuthRedirectUrl(provider)

        const left = Math.round((window.screen.width - POPUP_WIDTH) / 2)
        const top = Math.round((window.screen.height - POPUP_HEIGHT) / 2)
        const features = [
            `width=${POPUP_WIDTH}`,
            `height=${POPUP_HEIGHT}`,
            `left=${left}`,
            `top=${top}`,
            'resizable=yes',
            'scrollbars=yes',
        ].join(',')

        const popup = window.open(url, 'oauthPopup', features)
        if (popup) {
            popup.focus()
        } else {
            // Popup blocked – gracefully fall back to full redirect
            window.location.href = url
        }
    }

    return (
        <div className="mt-3">
            {/* OR Divider */}
            <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">OR</span>
                <div className="flex-1 h-px bg-gray-300" />
            </div>

            {/* Social Buttons */}
            <div className="mt-3 grid grid-cols-2 gap-4">
                {/* Facebook */}
                <button
                    type="button"
                    onClick={() => handleSocialClick('facebook')}
                    className="flex items-center justify-center gap-3 border border-gray-300 py-2 rounded bg-white hover:border-gray-400 transition cursor-pointer"
                >
                    <img src={socialFacebookIcon} alt="Facebook" className="w-6 h-6" />
                    <span className="text-sm font-medium text-gray-700">Facebook</span>
                </button>

                {/* Google */}
                <button
                    type="button"
                    onClick={() => handleSocialClick('google')}
                    className="flex items-center justify-center gap-3 border border-gray-300 py-2 rounded bg-white hover:border-gray-400 transition cursor-pointer"
                >
                    <img src={socialGoogleIcon} alt="Google" className="w-6 h-6" />
                    <span className="text-sm font-medium text-gray-700">Google</span>
                </button>
            </div>
        </div>
    )
}

export default SocialAuthSection