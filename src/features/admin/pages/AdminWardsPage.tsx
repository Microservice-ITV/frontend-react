import { useCallback, useEffect, useState } from 'react'
import { adminLocationApi } from '@/features/admin/api/adminLocationApi'
import { loadAllWards } from '@/features/admin/api/locationOptions'
import LocationIndexPage, { type LocationIndexRow } from '@/features/admin/components/LocationIndexPage'

const AdminWardsPage = () => {
  const [rows, setRows] = useState<LocationIndexRow[]>([])
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const wards = await loadAllWards()
      setRows(
        wards.map((ward) => ({
          id: Number(ward.id),
          name: ward.name,
          parent: [ward.cityName, ward.stateName].filter(Boolean).join(' · '),
        })),
      )
      setStatus('succeeded')
    } catch (loadError) {
      setRows([])
      setStatus('failed')
      setError(loadError instanceof Error ? loadError.message : 'Unable to load wards.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <LocationIndexPage
      title="Wards"
      description="Wards belong to a city. Choose the state and city when you create or edit a ward."
      addLabel="Add ward"
      addTo="/super-admin/locations/wards/new"
      editTo={(id) => `/super-admin/locations/wards/${id}/edit`}
      parentHeading="City"
      itemLabel="wards"
      rows={rows}
      status={status}
      error={error}
      onRefresh={() => void load()}
      onDelete={async (row) => {
        await adminLocationApi.deleteWard(row.id)
        await load()
      }}
      deleteMessage={(row) => `Delete ward "${row.name}"?`}
    />
  )
}

export default AdminWardsPage
