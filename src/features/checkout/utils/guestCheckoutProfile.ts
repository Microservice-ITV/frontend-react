import type { UserAddress } from '@/features/account/types/addressTypes'
import type { CityOptionWithState } from '@/features/admin/api/locationOptions'

export const GUEST_CHECKOUT_PROFILE_KEY = 'dni.guest_checkout.profile'
export const GUEST_CHECKOUT_EDIT_PROFILE_KEY = 'dni.guest_checkout.edit_profile'

export type GuestCheckoutProfile = {
  fullName: string
  /** National digits only (no +95). */
  phone: string
  address: string
  cityId: string
}

const emptyProfile = (): GuestCheckoutProfile => ({
  fullName: '',
  phone: '',
  address: '',
  cityId: '',
})

const ssGet = (key: string) => {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

const ssSet = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

const ssRemove = (key: string) => {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function guestPhoneToE164(phone: string): string {
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('0')) return `+95${digits.slice(1)}`
  if (digits.length === 10 && digits.startsWith('9')) return `+95${digits}`
  return ''
}

export function isGuestCheckoutProfileComplete(p: GuestCheckoutProfile): boolean {
  return Boolean(p.fullName.trim() && guestPhoneToE164(p.phone) && p.address.trim() && p.cityId)
}

export function loadGuestCheckoutProfile(): GuestCheckoutProfile {
  try {
    const raw = ssGet(GUEST_CHECKOUT_PROFILE_KEY)
    if (!raw) return emptyProfile()
    const parsed = JSON.parse(raw) as Partial<GuestCheckoutProfile>
    return {
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone.replace(/\D/g, '').slice(0, 11) : '',
      address: typeof parsed.address === 'string' ? parsed.address : '',
      cityId: typeof parsed.cityId === 'string' ? parsed.cityId : '',
    }
  } catch {
    return emptyProfile()
  }
}

export function saveGuestCheckoutProfile(profile: GuestCheckoutProfile): void {
  ssSet(
    GUEST_CHECKOUT_PROFILE_KEY,
    JSON.stringify({
      fullName: profile.fullName.trim(),
      phone: profile.phone.replace(/\D/g, '').slice(0, 11),
      address: profile.address.trim(),
      cityId: profile.cityId,
    }),
  )
}

export function isGuestCheckoutEditingProfile(): boolean {
  return ssGet(GUEST_CHECKOUT_EDIT_PROFILE_KEY) === '1'
}

export function setGuestCheckoutEditingProfile(editing: boolean): void {
  if (editing) ssSet(GUEST_CHECKOUT_EDIT_PROFILE_KEY, '1')
  else ssRemove(GUEST_CHECKOUT_EDIT_PROFILE_KEY)
}

export function getOrCreateGuestId(): string {
  const key = 'dni.guest_id'
  const existing = ssGet(key)
  if (existing) return existing
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`
  ssSet(key, id)
  return id
}

export function buildGuestDeliveryAddress(args: {
  guestId: string
  fullName: string
  phone: string
  address: string
  city: CityOptionWithState
}): UserAddress {
  const phone_no = guestPhoneToE164(args.phone)
  return {
    address_id: `guest-${args.guestId}`,
    country_code: 'MM',
    country: 'Myanmar',
    state_id: args.city.stateId,
    city_id: Number(args.city.id),
    district_id: null,
    ward_id: null,
    state: args.city.stateName,
    city: args.city.name,
    district: null,
    ward: null,
    address_line_1: args.address.trim(),
    address_line_2: null,
    postal_code: null,
    latitude: null,
    longitude: null,
    type: null,
    label: 'Guest Address',
    full_name: args.fullName.trim(),
    phone_no,
    email: null,
    delivery_note: null,
    is_default: false,
    is_shipping: true,
    is_billing: false,
  }
}

export function persistGuestCheckoutSession(args: {
  address: UserAddress
  cartKey: string
  checkoutId?: string | null
  profile: GuestCheckoutProfile
}): void {
  saveGuestCheckoutProfile(args.profile)
  setGuestCheckoutEditingProfile(false)
  ssSet('dni.guest_checkout.delivery_address', JSON.stringify(args.address))
  ssSet('dni.guest_checkout.cart_key', args.cartKey)
  if (args.checkoutId) ssSet('dni.guest_checkout.checkout_id', String(args.checkoutId))
}

export function clearGuestCheckoutSession(): void {
  ssRemove('dni.guest_checkout.delivery_address')
  ssRemove('dni.guest_checkout.checkout_id')
  ssRemove('dni.guest_checkout.cart_key')
}

export function toGuestCheckoutApiAddress(address: UserAddress) {
  return {
    full_name: address.full_name,
    phone_no: address.phone_no,
    email: address.email ?? null,
    country_code: address.country_code || 'MM',
    country: address.country ?? '',
    state: address.state ?? '',
    city: address.city ?? '',
    city_id: address.city_id ?? null,
    district: address.district ?? '',
    district_id: address.district_id ?? null,
    ward: address.ward ?? '',
    address_line_1: address.address_line_1,
    address_line_2: address.address_line_2 ?? null,
    postal_code: address.postal_code ?? null,
    latitude: address.latitude ?? null,
    longitude: address.longitude ?? null,
    delivery_note: address.delivery_note ?? null,
  }
}
