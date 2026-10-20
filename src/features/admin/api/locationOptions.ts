import { locationApi } from "@/features/account/api/locationApi";

export type CityOptionWithState = {
  id: string;
  name: string;
  stateId: number;
  stateName: string;
};

export type DistrictOptionWithCity = {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
};

/** In-flight / resolved promises so concurrent callers share one network waterfall. */
let citiesPromise: Promise<CityOptionWithState[]> | null = null;
let districtsPromise: Promise<DistrictOptionWithCity[]> | null = null;

async function fetchAllCities(): Promise<CityOptionWithState[]> {
  const statesRes = await locationApi.getStates();
  const states = statesRes.data?.data?.states ?? [];

  const perState = await Promise.all(
    states.map(async (state) => {
      try {
        const res = await locationApi.getCities(state.id);
        return (res.data?.data?.cities ?? []).map((city) => ({
          id: String(city.id),
          name: city.name,
          stateId: state.id,
          stateName: state.name,
        }));
      } catch {
        return [];
      }
    }),
  );

  return perState.flat();
}

async function fetchAllDistricts(): Promise<DistrictOptionWithCity[]> {
  const res = await locationApi.getAllDistricts();
  return (res.data?.data?.districts ?? []).map((district) => ({
    id: String(district.id),
    name: district.name,
    cityId: String(district.city_id),
    cityName: district.city_name,
  }));
}

/**
 * Loads all cities across every state from the auth-service locations API.
 * City ids round-trip as strings (matching shipping `delivery_city_rates`.
 * `from_city_id` / `to_city_id`, which store the numeric auth city id as text).
 */
export function loadAllCities(): Promise<CityOptionWithState[]> {
  if (!citiesPromise) {
    citiesPromise = fetchAllCities().catch((error) => {
      citiesPromise = null;
      throw error;
    });
  }
  return citiesPromise;
}

/**
 * Loads every district under every city. District ids are the auth `districts.id`
 * stored as text on `delivery_city_rates.from_district_id` / `to_district_id`.
 */
export function loadAllDistricts(): Promise<DistrictOptionWithCity[]> {
  if (!districtsPromise) {
    districtsPromise = fetchAllDistricts().catch((error) => {
      districtsPromise = null;
      throw error;
    });
  }
  return districtsPromise;
}
