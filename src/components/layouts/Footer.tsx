import { Link } from 'react-router-dom'
// SOCIAL
import {
    facebookIcon,
    instagramIcon,
    linkedIcon,
  
    // PAYMENTS
    visaIcon,
    masterCardIcon,
    shopPayIcon,
  
    // LOGISTICS
    ninjavanIcon,
    jtExpressIcon,
    spxIcon,
  
    // APP
    qrIcon,
    appStoreIcon,
    googlePlayIcon,
    appGalleryIcon,
} from '@/assets/icons'

const Footer = () => {
    return (
      <footer className="bg-gray-100 text-xs text-gray-600 border-t-4 border-emerald-600 mt-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* CUSTOMER SERVICE */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                CUSTOMER SERVICE
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link to="#">Help Centre</Link>
                </li>
                <li>
                  <Link to="#">How To Buy</Link>
                </li>
                <li>
                  <Link to="#">How To Sell</Link>
                </li>
                <li>
                  <Link to="#">Payment Methods</Link>
                </li>
                <li>
                  <Link to="#">Ecommerce Coins</Link>
                </li>
                <li>
                  <Link to="#">Ecommerce Guarantee</Link>
                </li>
                <li>
                  <Link to="#">Return & Refund</Link>
                </li>
                <li>
                  <Link to="#">Ecommerce Mall Return & Refund</Link>
                </li>
                <li>
                  <Link to="#">Contact Us</Link>
                </li>
              </ul>
            </div>

            {/* ABOUT ECOMMERCE */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                ABOUT ECOMMERCE
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about">About Us</Link>
                </li>
                <li>
                  <Link to="/careers">Ecommerce Careers</Link>
                </li>
                <li>
                  <Link to="/policies">Policies</Link>
                </li>
                <li>
                  <Link to="/privacy">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/blog">Ecommerce Blog</Link>
                </li>
                <li>
                  <Link to="/mall">Ecommerce Mall</Link>
                </li>
                <li>
                  <Link to="/seller-centre">Seller Centre</Link>
                </li>
                <li>
                  <Link to="/seller-mentors">Seller Mentors</Link>
                </li>
                <li>
                  <Link to="/flash-deals">Flash Deals</Link>
                </li>
                <li>
                  <Link to="/media">Media Contact</Link>
                </li>
                <li>
                  <Link to="/ambassador">Ecommerce Ambassador Programme</Link>
                </li>
              </ul>
            </div>

            {/* PAYMENT & LOGISTICS */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">PAYMENT</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {[visaIcon, masterCardIcon, shopPayIcon].map((img, i) => (
                  <img key={i} src={img} alt="Payment" className="h-6" />
                ))}
              </div>

              <h3 className="font-semibold text-gray-900 mb-3">LOGISTICS</h3>
              <div className="flex flex-wrap gap-2">
                {[ninjavanIcon, jtExpressIcon, spxIcon].map((img, i) => (
                  <img key={i} src={img} alt="Logistics" className="h-6" />
                ))}
              </div>
            </div>

            {/* FOLLOW US */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">FOLLOW US</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <img src={facebookIcon} className="h-4" alt="" />
                  Facebook
                </li>
                <li className="flex items-center gap-2">
                  <img src={instagramIcon} className="h-4" alt="" />
                  Instagram
                </li>
                <li className="flex items-center gap-2">
                  <img src={linkedIcon} className="h-4" alt="" />
                  LinkedIn
                </li>
              </ul>
            </div>

            {/* APP DOWNLOAD */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">APP DOWNLOAD</h3>
              <div className="flex items-start gap-4">
                {/* QR Code */}
                <img
                  src={qrIcon}
                  alt="Ecommerce App QR Code"
                  className="w-28 h-28 border"
                />

                {/* App Store Badges */}
                <div className="flex flex-col gap-5">
                  <img
                    src={appStoreIcon}
                    alt="Download on App Store"
                    className="w-28 cursor-pointer"
                  />
                  <img
                    src={googlePlayIcon}
                    alt="Get it on Google Play"
                    className="w-28 cursor-pointer"
                  />
                  <img
                    src={appGalleryIcon}
                    alt="Download on AppGallery"
                    className="w-28 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[var(--dni-cart-border)] text-center py-4 text-xs text-gray-500">
          © 2026 Ecommerce Clone. All Rights Reserved.
        </div>
      </footer>
    );
}

export default Footer
