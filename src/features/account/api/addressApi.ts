import { AxiosResponse } from 'axios'
import { authClient } from '@/lib/api/authClient'
import type { UpsertAddressPayload, UserAddress } from '../types/addressTypes'

interface ListUserAddressesResponse {
  success: boolean
  data: {
    user_id: string
    addresses: UserAddress[]
  }
}

interface SingleUserAddressResponse {
  success: boolean
  data: {
    user_id: string
    address: UserAddress
  }
}

export const addressApi = {
  list(userId: string): Promise<AxiosResponse<ListUserAddressesResponse>> {
    return authClient.get(`/users/${userId}/addresses`)
  },

  create(userId: string, payload: UpsertAddressPayload): Promise<AxiosResponse<SingleUserAddressResponse>> {
    return authClient.post(`/users/${userId}/addresses`, payload)
  },

  update(
    userId: string,
    addressId: string,
    payload: UpsertAddressPayload,
  ): Promise<AxiosResponse<SingleUserAddressResponse>> {
    return authClient.patch(`/users/${userId}/addresses/${addressId}`, payload)
  },

  delete(userId: string, addressId: string): Promise<AxiosResponse<void>> {
    return authClient.delete(`/users/${userId}/addresses/${addressId}`)
  },

  setDefault(userId: string, addressId: string): Promise<AxiosResponse<SingleUserAddressResponse>> {
    return authClient.post(`/users/${userId}/addresses/${addressId}/set-default`)
  },
}

