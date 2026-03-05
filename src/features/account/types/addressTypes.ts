// Backend DTOs for user addresses (deliveryAddress shape)
export interface UserAddress {
  address_id: string
  country_code: string
  country: string | null
  state_id?: number | null
  city_id?: number | null
  district_id?: number | null
  ward_id?: number | null
  state: string | null
  city: string | null
  district: string | null
  ward: string | null
  address_line_1: string
  address_line_2: string | null
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  type: string | null
  label: string | null
  full_name: string
  phone_no: string
  email: string | null
  delivery_note: string | null
  is_default: boolean
  is_shipping: boolean
  is_billing?: boolean
}

// Payload for creating/updating an address from the frontend
export interface UpsertAddressPayload {
  type?: 'HOME' | 'OFFICE' | string
  label?: string
  full_name: string
  phone_no: string
  email?: string | null
  delivery_note?: string | null
  country_code?: string // defaults to 'MM' on backend if omitted
  state_id: number
  city_id: number
  district_id: number
  ward_id: number
  address_line_1: string
  address_line_2?: string | null
  postal_code?: string | null
  latitude?: number | null
  longitude?: number | null
  is_default?: boolean
  is_shipping?: boolean
  is_billing?: boolean
}

