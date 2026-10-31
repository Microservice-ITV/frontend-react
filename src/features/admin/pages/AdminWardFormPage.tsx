import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { locationApi, type StateOption } from '@/features/account/api/locationApi'
import { adminLocationApi } from '@/features/admin/api/adminLocationApi'
import { loadAllCities, loadAllWards, type CityOptionWithState } from '@/features/admin/api/locationOptions'
import LocationRecordForm from '@/features/admin/components/LocationRecordForm'

type AdminWardFormPageProps = {
  mode: 'create' | 'edit'
}

const listTo = '/super-admin/locations/wards'

const AdminWardFormPage = ({ mode }: AdminWardFormPageProps) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [states, setStates] = useState<StateOption[]>([])
  const [cities, setCities] = useState<CityOptionWithState[]>([])
  const [stateId, setStateId] = useState('')
  const [cityId, setCityId] = useState('')
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
        const [statesResponse, cityRows] = await Promise.all([locationApi.getStates(), loadAllCities()])
        if (cancelled) return
        setStates(statesResponse.data?.data?.states ?? [])
        setCities(cityRows)
        if (mode === 'edit') {
          const wards = await loadAllWards()
          const ward = wards.find((item) => item.id === id)
          if (!ward) {
            setMissing(true)
          } else {
            setStateId(String(ward.stateId))
            setCityId(ward.cityId)
            setName(ward.name)
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load the ward form.')
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

  const cityOptions = useMemo(
    () =>
      cities
        .filter((city) => String(city.stateId) === stateId)
        .map((city) => ({ value: city.id, label: city.name })),
    [cities, stateId],
  )

  const save = async () => {
    const trimmed = name.trim()
    if (!stateId || !cityId) {
      setError('Choose a state and city.')
      return
    }
    if (!trimmed) {
      setError('Ward name is required.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      if (mode === 'create') {
        await adminLocationApi.createWard({ city_id: Number(cityId), name: trimmed })
      } else if (id) {
        await adminLocationApi.updateWard(Number(id), { city_id: Number(cityId), name: trimmed })
      }
      navigate(listTo)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save ward.')
      setSubmitting(false)
    }
  }

  return (
    <LocationRecordForm
      title={mode === 'create' ? 'Add ward' : 'Edit ward'}
      description="Choose the state and city this ward belongs to, then enter the ward name."
      listLabel="Wards"
      listTo={listTo}
      fields={[
        {
          id: 'ward-state',
          label: 'State',
          value: stateId,
          placeholder: 'Search state...',
          emptyLabel: 'Select state',
          options: states.map((state) => ({ value: String(state.id), label: state.name })),
          onChange: (nextStateId) => {
            setStateId(nextStateId)
            setCityId('')
          },
        },
        {
          id: 'ward-city',
          label: 'City',
          value: cityId,
          placeholder: 'Search city...',
          emptyLabel: 'Select city',
          options: cityOptions,
          disabled: !stateId,
          onChange: setCityId,
        },
      ]}
      name={name}
      nameLabel="Ward name"
      onNameChange={setName}
      onSubmit={save}
      submitLabel={mode === 'create' ? 'Create ward' : 'Save changes'}
      cancelTo={listTo}
      loading={loading}
      missingMessage={missing ? 'This ward could not be found.' : null}
      error={error}
      submitting={submitting}
    />
  )
}

export default AdminWardFormPage
