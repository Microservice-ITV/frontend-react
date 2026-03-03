import { AxiosResponse } from 'axios'
import { authApi } from '@/lib/api/authApi'
import type { UpsertAddressPayload, UserAddressDto } from '../types/addressTypes'

interface ListUserAddressesResponse {
  success: boolean
  data: {
    user_id: string
    addresses: UserAddressDto[]
  }
}

interface SingleUserAddressResponse {
  success: boolean
  data: {
    user_id: string
    address: UserAddressDto
  }
}

export const addressApi = {
  list(userId: string): Promise<AxiosResponse<ListUserAddressesResponse>> {
    return authApi.get(`/users/${userId}/addresses`)
  },

  create(userId: string, payload: UpsertAddressPayload): Promise<AxiosResponse<SingleUserAddressResponse>> {
    return authApi.post(`/users/${userId}/addresses`, payload)
  },

  delete(userId: string, addressId: string): Promise<AxiosResponse<void>> {
    return authApi.delete(`/users/${userId}/addresses/${addressId}`)
  },

  setDefault(userId: string, addressId: string): Promise<AxiosResponse<SingleUserAddressResponse>> {
    return authApi.post(`/users/${userId}/addresses/${addressId}/set-default`)
  },
}

