import { useState } from 'react'
import { QrCode, ImageOff } from 'lucide-react'
import dniWebsiteQr from '@/assets/images/app/dni_website_qr.png'

interface ThermalQRCodeProps {
  title?: string
  subtitle?: string
  className?: string
  width?: '58mm' | '80mm'
}

/**
 * Real QR code generation component for thermal printing
 * Uses the existing verified store URL QR code asset
 */
const ThermalQRCode = ({ title = "Scan to verify", subtitle = "Visit our store", className = '', width = '58mm' }: ThermalQRCodeProps) => {
  const [qrError, setQrError] = useState(false)

  return (
    <div className={`receipt-qr-container receipt-qr-footer ${className}`}>
      {!qrError ? (
        <img
          src={dniWebsiteQr}
          alt="Daily Need Items Website QR Code"
          onError={() => setQrError(true)}
          className="receipt-qr-image max-w-full h-auto"
          style={{ width: width === '58mm' ? '12mm' : '15mm', imageRendering: 'pixelated' }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-4 border receipt-border rounded receipt-faint">
          <ImageOff size={24} className="mb-2" />
          <span className="text-xs">QR Code unavailable</span>
        </div>
      )}
      
      <div className="receipt-qr-footer-copy">
        <p className="receipt-qr-caption">{title}</p>
        {subtitle && <p className="receipt-qr-caption">{subtitle}</p>}
      </div>
    </div>
  )
}

export default ThermalQRCode
