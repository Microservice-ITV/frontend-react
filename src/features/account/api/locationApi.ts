import { authClient } from '@/lib/api/authClient'

export interface LocationOption {
  id: number
  name: string
}

export interface StateOption extends LocationOption {}
export interface CityOption extends LocationOption {}
export interface DistrictOption extends LocationOption {}

export interface DistrictWithCityOption extends DistrictOption {
  city_id: number
  city_name: string
}
export interface WardOption extends LocationOption {}

export const locationApi = {
  getStates() {
    return authClient.get<{ success: boolean; data: { country_code: string; states: StateOption[] } }>(
      '/locations/states',
    )
  },

  getAllCities() {
    return authClient.get<{ success: boolean; data: { cities: CityOption[] } }>('/locations/cities')
  },

  getCities(stateId: number) {
    return authClient.get<{ success: boolean; data: { state_id: number; cities: CityOption[] } }>(
      `/locations/states/${stateId}/cities`,
    )
  },

  getDistricts(cityId: number) {
    return authClient.get<{
      success: boolean
      data: { city_id: number; districts: DistrictOption[] }
    }>(`/locations/cities/${cityId}/districts`)
  },

  getAllDistricts() {
    return authClient.get<{
      success: boolean
      data: { districts: DistrictWithCityOption[] }
    }>('/locations/districts')
  },

  getWards(districtId: number) {
    return authClient.get<{ success: boolean; data: { district_id: number; wards: WardOption[] } }>(
      `/locations/districts/${districtId}/wards`,
    )
  },
}

