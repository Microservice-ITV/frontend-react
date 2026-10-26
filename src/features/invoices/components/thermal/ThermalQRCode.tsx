import { useState } from 'react'
import { QrCode, ImageOff } from 'lucide-react'
import dniWebsiteQr from '@/assets/images/app/dni_website_qr.png'

interface ThermalQRCodeProps {
  title?: string
  subtitle?: string
  className?: string
}

/**
 * Real QR code generation component for thermal printing
 * Uses the existing verified store URL QR code asset
 */
const ThermalQRCode = ({ title = "Scan to verify", subtitle = "Visit our store", className = '' }: ThermalQRCodeProps) => {
  const [qrError, setQrError] = useState(false)

  return (
    <div className={`receipt-qr-container ${className}`}>
      <p className="receipt-qr-caption mb-2">{title}</p>
      
      {!qrError ? (
        <img
          src={dniWebsiteQr}
          alt="Daily Need Items Website QR Code"
          onError={() => setQrError(true)}
          className="receipt-qr-image max-w-full h-auto"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-4 border receipt-border rounded receipt-faint">
          <ImageOff size={24} className="mb-2" />
          <span className="text-xs">QR Code unavailable</span>
        </div>
      )}
      
      {subtitle && (
        <p className="receipt-qr-caption mt-2">{subtitle}</p>
      )}
    </div>
  )
}

export default ThermalQRCode