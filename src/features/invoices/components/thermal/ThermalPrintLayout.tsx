import { ReactNode } from 'react'
import { getCombinedThermalStyles } from '@/features/invoices/lib/thermalReceiptStyles'

interface ThermalPrintLayoutProps {
  children: ReactNode
  width: '58mm' | '80mm'
  className?: string
}

/**
 * Base thermal print layout component with proper @page rules and width selectors
 * Shared between invoice and receipt thermal printing
 */
const ThermalPrintLayout = ({ children, width, className = '' }: ThermalPrintLayoutProps) => {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: getCombinedThermalStyles(width) }} />
      <div className={`thermal-receipt ${className}`} style={{ width: width === '58mm' ? '52mm' : '70mm' }}>
        {children}
      </div>
    </>
  )
}

export default ThermalPrintLayout