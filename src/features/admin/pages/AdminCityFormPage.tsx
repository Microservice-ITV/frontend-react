import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { locationApi, type StateOption } from '@/features/account/api/locationApi'
import { adminLocationApi } from '@/features/admin/api/adminLocationApi'
import { loadAllCities } from '@/features/admin/api/locationOptions'
import LocationRecordForm from '@/features/admin/components/LocationRecordForm'

type AdminCityFormPageProps = {
  mode: 'create' | 'edit'
}

const listTo = '/super-admin/locations/cities'

const AdminCityFormPage = ({ mode }: AdminCityFormPageProps) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [states, setStates] = useState<StateOption[]>([])
  const [stateId, setStateId] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const statesResponse = await locationApi.getStates()
        if (cancelled) return
        setStates(statesResponse.data?.data?.states ?? [])
        if (mode === 'edit') {
          const cities = await loadAllCities()
          const city = cities.find((item) => item.id === id)
          if (!city) {
            setMissing(true)
          } else {
            setStateId(String(city.stateId))
            setName(city.name)
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load the city form.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id, mode])

  const save = async () => {
    const trimmed = name.trim()
    if (!stateId) {
      setError('Choose a state.')
      return
    }
    if (!trimmed) {
      setError('City name is required.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      if (mode === 'create') {
        await adminLocationApi.createCity({ state_id: Number(stateId), name: trimmed })
      } else if (id) {
        await adminLocationApi.updateCity(Number(id), { state_id: Number(stateId), name: trimmed })
      }
      navigate(listTo)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save city.')
      setSubmitting(false)
    }
  }

  return (
    <LocationRecordForm
      title={mode === 'create' ? 'Add city' : 'Edit city'}
      description="Choose the state this city belongs to, then enter the city name."
      listLabel="Cities"
      listTo={listTo}
      fields={[
        {
          id: 'city-state',
          label: 'State',
          value: stateId,
          placeholder: 'Search state...',
          emptyLabel: 'Select state',
          options: states.map((state) => ({ value: String(state.id), label: state.name })),
          disabled: loading,
          onChange: setStateId,
        },
      ]}
      name={name}
      nameLabel="City name"
      onNameChange={setName}
      onSubmit={save}
      submitLabel={mode === 'create' ? 'Create city' : 'Save changes'}
      cancelTo={listTo}
      loading={loading}
      missingMessage={missing ? 'This city could not be found.' : null}
      error={error}
      submitting={submitting}
    />
  )
}

export default AdminCityFormPage
