import { useCallback, useEffect, useState } from 'react'
import { adminLocationApi } from '@/features/admin/api/adminLocationApi'
import { loadAllCities, resetLocationOptionCache } from '@/features/admin/api/locationOptions'
import LocationIndexPage, { type LocationIndexRow } from '@/features/admin/components/LocationIndexPage'

const AdminCitiesPage = () => {
  const [rows, setRows] = useState<LocationIndexRow[]>([])
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    setError(null)
    resetLocationOptionCache()
    try {
      const cities = await loadAllCities()
      setRows(
        cities
          .map((city) => ({
            id: Number(city.id),
            name: city.name,
            parent: city.stateName,
          }))
          .sort((left, right) => left.name.localeCompare(right.name)),
      )
      setStatus('succeeded')
    } catch (loadError) {
      setRows([])
      setStatus('failed')
      setError(loadError instanceof Error ? loadError.message : 'Unable to load cities.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <LocationIndexPage
      title="Cities"
      description="Cities belong to a state. Choose the state when you create or edit a city."
      addLabel="Add city"
      addTo="/super-admin/locations/cities/new"
      editTo={(id) => `/super-admin/locations/cities/${id}/edit`}
      parentHeading="State"
      itemLabel="cities"
      rows={rows}
      status={status}
      error={error}
      onRefresh={() => void load()}
      onDelete={async (row) => {
        await adminLocationApi.deleteCity(row.id)
        await load()
      }}
      deleteMessage={(row) => `Delete city "${row.name}"? Its wards will also be removed.`}
    />
  )
}

export default AdminCitiesPage
