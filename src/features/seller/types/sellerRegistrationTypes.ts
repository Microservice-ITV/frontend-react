/** Client-side seller application wizard (no API yet). */
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