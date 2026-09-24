import { locationApi } from "@/features/account/api/locationApi";

export type CityOptionWithState = {
  id: string;
  name: string;
  stateId: number;
  stateName: string;
};

/**
 * Loads all cities across every state from the auth-service locations API.
 * City ids round-trip as strings (matching shipping `delivery_city_rates`.
 * `from_city_id` / `to_city_id`, which store the numeric auth city id as text).
 */
export async function loadAllCities(): Promise<CityOptionWithState[]> {
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