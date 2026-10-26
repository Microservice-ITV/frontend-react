# Implementation Plan: Redesign DailyNeedItems Invoice and Receipt Generation for POS Thermal Printing

## Current Codebase Analysis

### Existing Implementation:
1. **Invoice Documents**:
   - `InvoiceDocumentSheet.tsx`: Main invoice component with A4 print styling via `INVOICE_PRINT_STYLES`
   - `ScopedInvoiceDetailPage.tsx`: Dashboard invoice page with Print Invoice, Download PDF, and Print Receipt (58mm/80mm) buttons
   - `CustomerInvoiceDetailPage.tsx`: Customer invoice page with Print Invoice and Download PDF buttons
   - `CustomerInvoicePrintPage.tsx`: Print-only route for customers with A4 styling

2. **Receipt Documents**:
   - `ReceiptDocumentSheet.tsx`: Thermal receipt component with 58mm/80mm support
   - `CustomerReceiptPrintPage.tsx`: Print-only route for thermal receipts
   - `thermalReceiptStyles.ts`: Thermal-specific styles with proper @page rules for 58mm/80mm widths
   - `ScopedInvoiceDetailPage.tsx`: Has "Print 58mm" and "Print 80mm" buttons that open receipt print page

3. **Backend Services**:
   - `receipt-pdf.service.ts`: Generates receipt PDFs with 80mm width and content-based height (not A4)
   - Invoice PDF generation uses existing A4 styling

### Issues Identified:
1. **Invoice printing uses A4 styling** instead of thermal layouts
2. **Customer pages lack receipt printing buttons** - only dashboard has them
3. **Receipt PDF generation** exists in backend but frontend lacks "Download Receipt" action (as required)
4. **Thermal invoice printing** doesn't exist - only A4 print available
5. **Print buttons redirect** to customer-only routes from dashboard

## File Modification Strategy

### New Components to Create:
1. `ThermalInvoiceDocumentSheet.tsx`: New component for thermal invoice printing (58mm/80mm)
2. `ThermalInvoicePrintPage.tsx`: Print-only route for thermal invoices (both dashboard and customer contexts)
3. `ThermalDocumentStyles.ts`: Shared thermal styling utilities for both invoices and receipts

### Components to Modify:
1. `ScopedInvoiceDetailPage.tsx`: Update print buttons to use thermal invoice printing
2. `CustomerInvoiceDetailPage.tsx`: Add receipt printing buttons and thermal invoice printing
3. `InvoiceDocumentSheet.tsx`: Keep A4 styling for PDF download only
4. `thermalReceiptStyles.ts`: Extract shared thermal styling patterns
5. Routing configuration to add thermal invoice print routes

## Component Architecture

### Shared Thermal Components:
```
ThermalDocumentStyles.ts
├── getThermalDocumentStyles(width)
├── THERMAL_DOCUMENT_STYLES (shared base)
├── THERMAL_PRINT_STYLES_58MM
└── THERMAL_PRINT_STYLES_80MM

ThermalInvoiceDocumentSheet.tsx
├── Uses ThermalDocumentStyles
├── Professional POS design with:
│   ├── Daily Need Items branding
│   ├── Document type and numbers
│   ├── Date/time and references
│   ├── Item table with wrapping product names
│   ├── Totals section
│   ├── Payment information
│   └── QR code (using existing dni_website_qr.png)
└── 58mm/80mm width support

ThermalReceiptDocumentSheet.tsx (refactor from ReceiptDocumentSheet)
├── Uses ThermalDocumentStyles
└── Enhanced POS receipt design
```

### Print Flow Design:

**Dashboard Context:**
- Print Invoice → Opens thermal invoice print view in new window
- Print Receipt → Opens thermal receipt print view in new window  
- Download Invoice PDF → Downloads A4 PDF (unchanged)

**Customer Context:**
- Print Invoice → Opens thermal invoice print view in same context
- Print Receipt → Opens thermal receipt print view in same context
- Download Invoice PDF → Downloads A4 PDF (unchanged)

**Thermal Print Pages:**
- `/dashboard/invoices/:invoiceNumber/print/thermal?width=58mm|80mm` (dashboard)
- `/account/invoices/:invoiceNumber/print/thermal?width=58mm|80mm` (customer)
- Both use appropriate authentication checks

## Implementation Plan

- [ ] 1. **Create shared thermal document styles**
      Extract shared thermal styling patterns from thermalReceiptStyles.ts into reusable ThermalDocumentStyles.ts
      Files: `frontend-react/src/features/invoices/lib/ThermalDocumentStyles.ts`
      Verify: `npm run typecheck` passes, styles compile without errors

- [ ] 2. **Create ThermalInvoiceDocumentSheet component**
      New component with professional POS invoice design for 58mm/80mm thermal paper
      Files: `frontend-react/src/features/invoices/components/ThermalInvoiceDocumentSheet.tsx`
      Verify: Component renders without errors, shows proper thermal layout

- [ ] 3. **Create thermal invoice print routes**
      Add print-only routes for thermal invoices in both dashboard and customer contexts
      Files: 
      - `frontend-react/src/features/invoices/pages/ThermalInvoicePrintPage.tsx`
      - `frontend-react/src/features/account/pages/CustomerThermalInvoicePrintPage.tsx`
      - Update routing configurations
      Verify: Routes accessible with proper authentication, print dialog opens correctly

- [ ] 4. **Update ScopedInvoiceDetailPage (dashboard)**
      Change "Print Invoice" button to use thermal invoice printing
      Add width selection (58mm/80mm) for invoice printing
      Ensure receipt buttons work correctly
      Files: `frontend-react/src/features/invoices/pages/ScopedInvoiceDetailPage.tsx`
      Verify: All print buttons work, open correct thermal print views

- [ ] 5. **Update CustomerInvoiceDetailPage**
      Add "Print Receipt" buttons (58mm/80mm)
      Change "Print Invoice" to use thermal printing
      Add width selection for both invoice and receipt printing
      Files: `frontend-react/src/features/account/pages/CustomerInvoiceDetailPage.tsx`
      Verify: Customer has all required print actions, proper authorization maintained

- [ ] 6. **Update ReceiptDocumentSheet**
      Refactor to use shared ThermalDocumentStyles
      Enhance design to match professional POS standards
      Files: `frontend-react/src/features/invoices/components/ReceiptDocumentSheet.tsx`
      Verify: Receipt design matches invoice styling, QR code displays correctly

- [ ] 7. **Update thermalReceiptStyles.ts**
      Integrate with new ThermalDocumentStyles
      Ensure backward compatibility
      Files: `frontend-react/src/features/invoices/lib/thermalReceiptStyles.ts`
      Verify: Existing receipt printing continues to work

- [ ] 8. **Test print flows**
      Test dashboard and customer workflows at 58mm and 80mm widths
      Test with long product names, multiple items, short receipts
      Verify print preview dimensions and content wrapping
      Files: All modified components
      Verify: `npm run test` passes, print previews show correct thermal layouts

- [ ] 9. **Run builds and verify changes**
      Build frontend and check for errors
      Verify PDF dimensions in backend receipt service
      Inspect final Git diff for correctness
      Files: Entire project
      Verify: `npm run build` succeeds, `npm run test` passes, no regressions

## Professional POS Design Requirements

### Invoice Design:
- Daily Need Items branding with store details
- "INVOICE" header with unique invoice number  
- Date/time, order reference, cashier/customer details
- Compact item table: description, qty, unit price, line total
- Subtotal, delivery, discounts, tax, grand total
- Payment method and status
- QR code linking to store verification URL
- Clear separators and thermal-optimized typography

### Receipt Design:
- "PAYMENT RECEIPT" header with receipt number
- Invoice reference and date
- Customer and merchant information
- Payment details (method, reference, status)
- Amounts breakdown
- QR code
- Thank you message and footer

### Technical Requirements:
- A4 styling exclusive to Download Invoice PDF
- Thermal printing uses dedicated print styles with @page rules
- Content fits paper width (product names wrap, totals readable)
- No excessive whitespace or blank pages on short receipts
- QR code uses existing verified store URL (dni_website_qr.png)

## Testing Approach

1. **Visual Testing**: 
   - Inspect print previews at 58mm and 80mm
   - Verify content fits within paper width
   - Check product name wrapping
   - Confirm QR code displays

2. **Functional Testing**:
   - Dashboard print buttons (invoice and receipt)
   - Customer print buttons (invoice and receipt)
   - Width selection (58mm/80mm)
   - Authentication and authorization

3. **Build Verification**:
   - Frontend builds without errors
   - TypeScript compilation passes
   - Existing tests continue to pass

4. **Print Verification**:
   - Browser print dialog opens correctly
   - @page rules apply appropriate paper sizes
   - No page breaks in critical sections

## Limitations and Notes

1. **Backend unchanged**: Invoice/receipt business logic, payment validation, and APIs remain as-is
2. **QR code**: Uses existing dni_website_qr.png asset - no new endpoints invented
3. **PDF generation**: Receipt PDF service already generates thermal-sized PDFs (80mm width, content-based height)
4. **A4 PDFs**: Download Invoice PDF continues to use existing A4 styling for accounting purposes
5. **Authorization**: Dashboard and customer access rules preserved throughout