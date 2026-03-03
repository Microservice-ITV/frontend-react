// Backend DTOs for user addresses
export interface UserAddressDto {
  address_id: string
  line1: string
  line2: string | null
  line3: string | null
  city: string | null
  region_id: number | null
  postal_code: string | null
  country_code: string
  latitude: number | null
  longitude: number | null
  type: string | null
  label: string | null
  full_name: string
  phone_number: string
  is_default: boolean
  is_shipping: boolean
  is_billing?: boolean
}

// Payload for creating/updating an address from the frontend
export interface UpsertAddressPayload {
  type?: 'HOME' | 'OFFICE' | string
  label?: string
  full_name: string
  phone_number: string
  line1: string
  line2?: string | null
  line3?: string | null
  postal_code?: string | null
  is_default?: boolean
  is_shipping?: boolean
  is_billing?: boolean
}

