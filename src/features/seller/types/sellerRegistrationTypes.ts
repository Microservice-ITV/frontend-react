/** Client-side seller application wizard (draft + submit to product-service). */
export type SellerRegistrationStep = 0 | 1 | 2 | 3 | 4

export const SELLER_REGISTRATION_STEP_LABELS = [
    'Shop Information',
    'Shipping settings',
    'Identification information',
    'Tax information',
    'Complete',
] as const

export type SellerShopInfoDraft = {
    shopName: string
    /** Display line built from saved `UserAddress` (or legacy free text). */
    pickupAddress: string
    /** Set when pickup came from account address API (enables Edit in modal). */
    pickupAddressId: string | null
    email: string
    phone: string
}

export type SellerEntityType = 'individual' | 'business'

export type SellerIdDocumentType = 'national_id' | 'passport' | 'drivers_license' | 'other'

/** MVP: text persisted locally; file bytes stay in memory until upload API exists. */
export type SellerIdentificationDraft = {
    entityType: SellerEntityType
    legalName: string
    /** ISO date string (input type="date"). */
    dateOfBirth: string
    idDocumentType: SellerIdDocumentType | ''
    idDocumentNumber: string
    /** Optional; mainly for business. */
    businessRegistrationNumber: string
    additionalNotes: string
}

export const SELLER_ID_DOCUMENT_OPTIONS: { value: SellerIdDocumentType; label: string }[] = [
    { value: 'national_id', label: 'National ID' },
    { value: 'passport', label: 'Passport' },
    { value: 'drivers_license', label: "Driver's license" },
    { value: 'other', label: 'Other' },
]

export const emptySellerIdentificationDraft = (): SellerIdentificationDraft => ({
    entityType: 'individual',
    legalName: '',
    dateOfBirth: '',
    idDocumentType: '',
    idDocumentNumber: '',
    businessRegistrationNumber: '',
    additionalNotes: '',
})

/**
 * Minimal tax step for Myanmar-focused onboarding (no VAT/TIN-style requirements for now).
 * Expand when statutory or marketplace tax rules need structured fields.
 */
export type SellerTaxDraft = {
    /** Optional — e.g. company registration reference if the seller wants to note it. */
    notes: string
    /** Required to continue this step. */
    infoConfirmed: boolean
}

export const emptySellerTaxDraft = (): SellerTaxDraft => ({
    notes: '',
    infoConfirmed: false,
})