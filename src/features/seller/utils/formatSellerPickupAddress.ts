import type { UserAddress } from '@/features/account/types/addressTypes'

/** Single-line summary for seller pickup (matches account address + contact). */
export function formatSellerPickupAddressSummary(a: UserAddress): string {
    const locality = [a.address_line_1, a.ward, a.district, a.city, a.state].filter(Boolean).join(', ')
    return `${a.full_name} | ${a.phone_no} ${locality}`.trim()
}
