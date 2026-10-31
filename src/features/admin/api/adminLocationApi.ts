import axios from 'axios'
import { authClient } from '@/lib/api/authClient'
import { resetLocationOptionCache } from '@/features/admin/api/locationOptions'

export type AdminCity = {
  id: number
  name: string
  state_id: number
}

export type AdminWard = {
  id: number
  name: string
  city_id: number
}

type Success<T> = {
  success: boolean
  data: T
}

function toLocationError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined
    const fieldError = data?.errors ? Object.values(data.errors).flat()[0] : undefined
    return new Error(fieldError || data?.message || fallback)
  }
  if (error instanceof Error && error.message.trim()) return error
  return new Error(fallback)
}

async function request<T>(run: () => Promise<{ data: Success<T> }>, fallback: string): Promise<T> {
  try {
    const response = await run()
    return response.data.data
  } catch (error) {
    throw toLocationError(error, fallback)
  }
}

export const adminLocationApi = {
  listCities(stateId: number) {
    return request(
      () =>
        authClient.get<Success<{ state_id: number; cities: AdminCity[] }>>('/admin/locations/cities', {
          params: { state_id: stateId },
        }),
      'Unable to load cities.',
    ).then((data) => data.cities)
  },

  createCity(payload: { state_id: number; name: string }) {
    return request(
      () => authClient.post<Success<{ city: AdminCity }>>('/admin/locations/cities', payload),
      'Unable to create city.',
    ).then((data) => {
      resetLocationOptionCache()
      return data.city
    })
  },

  updateCity(cityId: number, payload: { name: string; state_id?: number }) {
    return request(
      () => authClient.patch<Success<{ city: AdminCity }>>(`/admin/locations/cities/${cityId}`, payload),
      'Unable to update city.',
    ).then((data) => {
      resetLocationOptionCache()
      return data.city
    })
  },

  deleteCity(cityId: number) {
    return request(
      () => authClient.delete<Success<{ deleted: boolean }>>(`/admin/locations/cities/${cityId}`),
      'Unable to delete city.',
    ).then((data) => {
      resetLocationOptionCache()
      return data
    })
  },

  listWards(cityId: number) {
    return request(
      () =>
        authClient.get<Success<{ city_id: number; wards: AdminWard[] }>>('/admin/locations/wards', {
          params: { city_id: cityId },
        }),
      'Unable to load wards.',
    ).then((data) => data.wards)
  },

  createWard(payload: { city_id: number; name: string }) {
    return request(
      () => authClient.post<Success<{ ward: AdminWard }>>('/admin/locations/wards', payload),
      'Unable to create ward.',
    ).then((data) => {
      resetLocationOptionCache()
      return data.ward
    })
  },

  updateWard(wardId: number, payload: { name: string; city_id?: number }) {
    return request(
      () => authClient.patch<Success<{ ward: AdminWard }>>(`/admin/locations/wards/${wardId}`, payload),
      'Unable to update ward.',
    ).then((data) => {
      resetLocationOptionCache()
      return data.ward
    })
  },

  deleteWard(wardId: number) {
    return request(
      () => authClient.delete<Success<{ deleted: boolean }>>(`/admin/locations/wards/${wardId}`),
      'Unable to delete ward.',
    ).then((data) => data)
  },
}
