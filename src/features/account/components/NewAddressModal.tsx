import { useEffect, useRef, useState } from 'react'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectAuthUser } from '@/features/auth/store/authSelectors'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { createUserAddress, updateUserAddress } from '../store/accountThunks'
import { locationApi, type StateOption, type CityOption, type WardOption } from '../api/locationApi'
import type { UpsertAddressPayload, UserAddress } from '../types/addressTypes'
import { MapLocationPicker } from '@/components/maps/MapLocationPicker'
import { locateAddressPin } from '@/lib/geocoding/geocode'
import { DEFAULT_MAP_CENTER } from '@/components/maps/mapConstants'

type Props = {
  /** Called after a successful create/update; receives the saved address from the API. */
  onSaved?: (savedAddress?: UserAddress) => Promise<void> | void
  mode?: 'create' | 'edit'
  initialAddress?: UserAddress
  description?: string
  /** Runs when user clicks Cancel (modal body button). GlobalModal backdrop/X use separate onSecondary on CheckoutPage. */
  onCancel?: () => void
}

type AddressFormErrors = Partial<{
  fullName: string
  phoneNumber: string
  location: string
  addressLine: string
}>

const LOCATION_REQUIRED_ERROR = 'Please select State and City. Choose a ward when this city has wards.'

/** Backend / JSON may return lat/lng as strings; map + `toFixed` need real numbers. */
const parseCoordinate = (value: unknown): number | null => {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value.trim())
    return Number.isFinite(n) ? n : null
  }
  return null
}

const resolveLabelAs = (type: string | null | undefined): 'HOME' | 'OFFICE' => {
  if (type === 'OFFICE') return 'OFFICE'
  return 'HOME'
}

const addressFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Full Name is required.')
    .max(120, 'Full Name must be at most 120 characters.'),
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Phone Number is required.')
    .max(30, 'Phone Number must be at most 30 characters.'),
  postalCode: z.string(),
  unitNo: z.string(),
  addressLine: z
    .string()
    .trim()
    .min(1, 'Street name and building are required.')
    .max(255, 'Street must be at most 255 characters.'),
  labelAs: z.enum(['HOME', 'OFFICE']),
  isDefault: z.boolean(),
  stateId: z.number().nullable(),
  cityId: z.number().nullable(),
  districtId: z.number().nullable(),
  wardId: z.number().nullable(),
  // Virtual field used to keep existing single-location error behavior.
  location: z.string().min(1, LOCATION_REQUIRED_ERROR),
})

type FormValues = z.infer<typeof addressFormSchema>

const INITIAL_FORM_VALUES: FormValues = {
  fullName: '',
  phoneNumber: '',
  postalCode: '',
  unitNo: '',
  addressLine: '',
  labelAs: 'HOME' as const,
  isDefault: false,
  stateId: null,
  cityId: null,
  districtId: null,
  wardId: null,
  location: '',
}

const getInitialFormValues = (mode: 'create' | 'edit', initialAddress?: UserAddress): FormValues => {
  if (mode !== 'edit' || !initialAddress) return INITIAL_FORM_VALUES

  return {
    fullName: initialAddress.full_name ?? '',
    phoneNumber: initialAddress.phone_no ?? '',
    postalCode: initialAddress.postal_code ?? '',
    unitNo: initialAddress.address_line_2 ?? '',
    addressLine: initialAddress.address_line_1 ?? '',
    labelAs: resolveLabelAs(initialAddress.type),
    isDefault: Boolean(initialAddress.is_default),
    // Keep location ids empty until dropdown options are hydrated and mapped.
    // This avoids UI/form mismatch during initial edit render.
    stateId: null,
    cityId: null,
    districtId: null,
    wardId: null,
    location: '',
  }
}

export const NewAddressModal = ({ onSaved, mode = 'create', initialAddress, description, onCancel }: Props) => {
  const dispatch = useAppDispatch()
  const authUser = useAppSelector(selectAuthUser)
  const { closeModal } = useGlobalModal()
  const initialFormValues = getInitialFormValues(mode, initialAddress)
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitted },
    trigger,
  } = useForm<FormValues>({
    resolver: zodResolver(addressFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: initialFormValues,
  })

  const [states, setStates] = useState<StateOption[]>([])
  const [cities, setCities] = useState<CityOption[]>([])
  const [wards, setWards] = useState<WardOption[]>([])
  const [wardsStatus, setWardsStatus] = useState<'idle' | 'loading' | 'ready'>('idle')

  const [selectedState, setSelectedState] = useState<StateOption | null>(null)
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null)
  const [selectedWard, setSelectedWard] = useState<WardOption | null>(null)

  const [latitude, setLatitude] = useState<number | null>(() => parseCoordinate(initialAddress?.latitude))
  const [longitude, setLongitude] = useState<number | null>(() => parseCoordinate(initialAddress?.longitude))
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'locating' | 'located' | 'approximate' | 'failed'>('idle')
  const pinLat = parseCoordinate(latitude)
  const pinLng = parseCoordinate(longitude)
  const mapSectionRef = useRef<HTMLDivElement | null>(null)
  /** Ward id we already matched to coordinates (geocode or server). */
  const geocodeWardRef = useRef<number | null>(null)
  /** Increments when the user moves the pin on the map (skip stale geocode overwrites). */
  const userMapInteractionRef = useRef(0)
  /** Bumps each time we schedule a new Nominatim request so stale responses are ignored. */
  const geocodeSeqRef = useRef(0)

  const fullName = watch('fullName')
  const phoneNumber = watch('phoneNumber')
  const labelAs = watch('labelAs')
  const isDefault = watch('isDefault')

  const cityHasNoWards = wardsStatus === 'ready' && wards.length === 0
  const hasSelectedFullLocation =
    !!selectedState && !!selectedCity && (cityHasNoWards || !!selectedWard)

  const getFieldError = (field: keyof AddressFormErrors) => {
    const message = errors[field]?.message
    return typeof message === 'string' ? message : undefined
  }

  useEffect(() => {
    const loadStates = async () => {
      try {
        const res = await locationApi.getStates()
        setStates(res.data.data.states)
      } catch {
        setStates([])
      }
    }
    if (authUser?.id) {
      loadStates()
    }
  }, [authUser?.id])

  useEffect(() => {
    if (mode !== 'edit' || !initialAddress || states.length === 0) return

    const initializeLocation = async () => {
      const initialStateOption =
        states.find((state) => {
          if (initialAddress.state_id) return state.id === initialAddress.state_id
          return state.name === initialAddress.state
        }) ?? null

      if (!initialStateOption) return

      setSelectedState(initialStateOption)
      setValue('stateId', initialStateOption.id, { shouldDirty: false, shouldValidate: false })

      try {
        const cityRes = await locationApi.getCities(initialStateOption.id)
        const fetchedCities = cityRes.data.data.cities
        setCities(fetchedCities)

        const initialCityOption =
          fetchedCities.find((city) => {
            if (initialAddress.city_id) return city.id === initialAddress.city_id
            return city.name === initialAddress.city
          }) ?? null

        if (!initialCityOption) return

        setSelectedCity(initialCityOption)
        setValue('cityId', initialCityOption.id, { shouldDirty: false, shouldValidate: false })

        const wardRes = await locationApi.getWards(initialCityOption.id)
        const fetchedWards = wardRes.data.data.wards
        setWards(fetchedWards)
        setWardsStatus('ready')

        const initialWardOption =
          fetchedWards.find((ward) => {
            if (initialAddress.ward_id) return ward.id === initialAddress.ward_id
            return ward.name === initialAddress.ward
          }) ?? null

        if (!initialWardOption) return

        setSelectedWard(initialWardOption)
        setValue('wardId', initialWardOption.id, { shouldDirty: false, shouldValidate: false })
      } catch {
        setCities([])
        setWards([])
        setWardsStatus('idle')
      }
    }

    void initializeLocation()
  }, [mode, initialAddress, states, setValue])

  useEffect(() => {
    if (mode === 'edit' && initialAddress) {
      setLatitude(parseCoordinate(initialAddress.latitude))
      setLongitude(parseCoordinate(initialAddress.longitude))
      return
    }
    setLatitude(null)
    setLongitude(null)
  }, [mode, initialAddress?.address_id])

  useEffect(() => {
    geocodeWardRef.current = null
    setGeocodeStatus('idle')
  }, [mode, initialAddress?.address_id])

  /**
   * Pin + coords only existed after a map tap or saved address — the dropdown has no lat/lng.
   * After the user picks a ward, we suggest a pin via OSM Nominatim (approximate area center).
   */
  useEffect(() => {
    if (!selectedState || !selectedCity || wardsStatus !== 'ready') {
      setGeocodeStatus('idle')
      return
    }
    if (!cityHasNoWards && !selectedWard) {
      setGeocodeStatus('idle')
      return
    }

    const placeKey = selectedWard?.id ?? -selectedCity.id
    if (geocodeWardRef.current === placeKey) return

    const savedLat = mode === 'edit' ? parseCoordinate(initialAddress?.latitude) : null
    const savedLng = mode === 'edit' ? parseCoordinate(initialAddress?.longitude) : null
    const savedWardId = initialAddress?.ward_id != null ? Number(initialAddress.ward_id) : null
    const wardStillOriginal = selectedWard
      ? savedWardId != null && Number.isFinite(savedWardId)
        ? savedWardId === selectedWard.id
        : (initialAddress?.ward ?? '').trim().toLowerCase() === selectedWard.name.trim().toLowerCase()
      : cityHasNoWards && (initialAddress?.ward_id == null || initialAddress.ward_id === 0)
    // Keep the saved pin only while the place is unchanged. A new ward must get a new pin.
    if (savedLat != null && savedLng != null && wardStillOriginal) {
      geocodeWardRef.current = placeKey
      setLatitude(savedLat)
      setLongitude(savedLng)
      setGeocodeStatus('located')
      return
    }

    const epoch = userMapInteractionRef.current
    geocodeSeqRef.current += 1
    const seq = geocodeSeqRef.current
    const geocodeParts = {
      ward: selectedWard?.name ?? selectedCity.name,
      district: selectedCity.name,
      city: selectedCity.name,
      state: selectedState.name,
    }
    let cancelled = false
    setGeocodeStatus('locating')
    const t = window.setTimeout(() => {
      void locateAddressPin(geocodeParts)
        .catch(() => null)
        .then((match) => {
          if (cancelled || seq !== geocodeSeqRef.current) return
          if (userMapInteractionRef.current !== epoch) return
          const point = match?.point ?? DEFAULT_MAP_CENTER
          setLatitude(point.lat)
          setLongitude(point.lng)
          geocodeWardRef.current = placeKey
          setGeocodeStatus(match && !match.approximate ? 'located' : 'approximate')
        })
    }, 450)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [selectedState, selectedCity, selectedWard, cityHasNoWards, wardsStatus, mode, initialAddress?.address_id, initialAddress?.latitude, initialAddress?.longitude, initialAddress?.ward, initialAddress?.ward_id])

  useEffect(() => {
    const locationValue = hasSelectedFullLocation ? 'selected' : ''
    setValue('location', locationValue, { shouldDirty: true, shouldValidate: isSubmitted })
    if (isSubmitted) {
      void trigger('location')
    }
  }, [hasSelectedFullLocation, isSubmitted, setValue, trigger])

  const selectState = async (state: StateOption) => {
    setSelectedState(state)
    setSelectedCity(null)
    setSelectedWard(null)
    setLatitude(null)
    setLongitude(null)
    geocodeWardRef.current = null
    setGeocodeStatus('idle')
    setValue('stateId', state.id, { shouldDirty: true })
    setValue('cityId', null, { shouldDirty: true })
    setValue('districtId', null, { shouldDirty: true })
    setValue('wardId', null, { shouldDirty: true })
    setWardsStatus('idle')
    try {
      const res = await locationApi.getCities(state.id)
      setCities(res.data.data.cities)
      setWards([])
    } catch {
      setCities([])
      setWards([])
    }
  }

  const selectCity = async (city: CityOption) => {
    setSelectedCity(city)
    setSelectedWard(null)
    setLatitude(null)
    setLongitude(null)
    geocodeWardRef.current = null
    setGeocodeStatus('idle')
    setValue('cityId', city.id, { shouldDirty: true })
    setValue('districtId', null, { shouldDirty: true })
    setValue('wardId', null, { shouldDirty: true })
    setWardsStatus('loading')
    try {
      const res = await locationApi.getWards(city.id)
      setWards(res.data.data.wards ?? [])
      setWardsStatus('ready')
    } catch {
      setWards([])
      setWardsStatus('idle')
    }
  }

  const selectWard = (ward: WardOption) => {
    // New ward → clear previous pin so geocode can drop a fresh one for this selection.
    if (selectedWard?.id !== ward.id) {
      setLatitude(null)
      setLongitude(null)
      geocodeWardRef.current = null
      setGeocodeStatus('idle')
    }
    setSelectedWard(ward)
    setValue('wardId', ward.id, { shouldDirty: true })
  }

  const onSubmit = async (values: FormValues) => {
    if (!authUser?.id || !selectedState || !selectedCity) return
    if (!cityHasNoWards && !selectedWard) return

    if (pinLat == null || pinLng == null) {
      setGeocodeStatus('failed')
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      return
    }

    const payload: UpsertAddressPayload = {
      type: values.labelAs,
      label: values.labelAs === 'HOME' ? 'Home' : 'Work',
      full_name: values.fullName,
      phone_no: values.phoneNumber,
      country_code: 'MM',
      state: selectedState.name,
      city: selectedCity.name,
      ward: selectedWard?.name ?? '',
      state_id: selectedState.id,
      city_id: selectedCity.id,
      district_id: null,
      ward_id: selectedWard?.id ?? null,
      address_line_1: values.addressLine,
      address_line_2: values.unitNo || null,
      postal_code: values.postalCode || null,
      is_default: values.isDefault,
      is_shipping: true,
      is_billing: false,
      latitude: pinLat,
      longitude: pinLng,
    }

    let savedAddress: UserAddress
    if (mode === 'edit' && initialAddress?.address_id) {
      savedAddress = await dispatch(
        updateUserAddress({
          userId: authUser.id,
          addressId: initialAddress.address_id,
          payload,
        }),
      ).unwrap()
    } else {
      savedAddress = await dispatch(
        createUserAddress({
          userId: authUser.id,
          payload,
        }),
      ).unwrap()
    }

    await Promise.resolve(onSaved?.(savedAddress))
    closeModal()
  }

  const canEditAddressDetails = hasSelectedFullLocation

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      {description && (
        <p className="text-xs text-gray-500 -mt-1">{description}</p>
      )}

      {/* Row 1: Full name / Phone number */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            placeholder="Full Name"
            {...register('fullName')}
            className={`w-full border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
              getFieldError('fullName') && (isSubmitted || !!fullName)
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-emerald-600'
            }`}
          />
          {getFieldError('fullName') && (isSubmitted || !!fullName) && (
            <p className="mt-1 text-[11px] text-red-500">{getFieldError('fullName')}</p>
          )}
        </div>

        <div>
          <input
            type="text"
            placeholder="Phone Number"
            {...register('phoneNumber')}
            className={`w-full border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
              getFieldError('phoneNumber') && (isSubmitted || !!phoneNumber)
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-emerald-600'
            }`}
          />
          {getFieldError('phoneNumber') && (isSubmitted || !!phoneNumber) && (
            <p className="mt-1 text-[11px] text-red-500">{getFieldError('phoneNumber')}</p>
          )}
        </div>
      </div>

      {/* Row 2: State, City, Ward */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelect
          placeholder="Search state..."
          emptyLabel="Select State"
          options={states.map((s) => ({ value: String(s.id), label: s.name }))}
          value={selectedState ? String(selectedState.id) : ''}
          onChange={(val) => {
            const state = states.find((s) => String(s.id) === val)
            if (state) void selectState(state)
          }}
        />
        <SearchableSelect
          placeholder="Search city..."
          emptyLabel="Select City"
          options={cities.map((c) => ({ value: String(c.id), label: c.name }))}
          value={selectedCity ? String(selectedCity.id) : ''}
          onChange={(val) => {
            const city = cities.find((c) => String(c.id) === val)
            if (city) void selectCity(city)
          }}
          disabled={!selectedState}
        />
        <SearchableSelect
          placeholder="Search ward..."
          emptyLabel={
            wardsStatus === 'loading' ? 'Loading wards...' : cityHasNoWards ? 'No ward' : 'Select Ward'
          }
          options={wards.map((w) => ({ value: String(w.id), label: w.name }))}
          value={selectedWard ? String(selectedWard.id) : ''}
          onChange={(val) => {
            const ward = wards.find((w) => String(w.id) === val)
            if (ward) selectWard(ward)
          }}
          disabled={!selectedCity || wardsStatus === 'loading' || cityHasNoWards}
        />
        <div>
          <input
            type="text"
            placeholder="Full Address"
            {...register('addressLine')}
            disabled={!canEditAddressDetails}
            className={`w-full border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
              getFieldError('addressLine') && isSubmitted
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-emerald-600'
            } ${
              !canEditAddressDetails ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
            }`}
          />
          {getFieldError('addressLine') && isSubmitted && (
            <p className="mt-1 text-[11px] text-red-500">{getFieldError('addressLine')}</p>
          )}
        </div>
      </div>
      {getFieldError('location') && isSubmitted && (
        <p className="mt-1 text-[11px] text-red-500">{getFieldError('location')}</p>
      )}

      <div className="space-y-2">
        <button
          type="button"
          disabled={!canEditAddressDetails}
          onClick={() => mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
          className={`mt-1 inline-flex items-center px-3 py-1 text-xs border rounded-sm ${
            canEditAddressDetails
              ? 'border-gray-400 text-gray-700 bg-white cursor-pointer'
              : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
          }`}
        >
          + Add Location
        </button>

        {canEditAddressDetails && (
          <div ref={mapSectionRef} className="mt-2 space-y-1">
            <p className="text-[10px] text-gray-500">
              {cityHasNoWards
                ? 'This city has no wards. Place the pin on the map at your exact spot, then submit.'
                : 'After you choose a ward, we locate the area on the map (not always the exact doorway). Drag the pin to fine-tune your exact spot.'}
            </p>
            {geocodeStatus === 'locating' && (
              <p className="text-[10px] text-gray-500">Locating this area on the map…</p>
            )}
            {geocodeStatus === 'approximate' && (
              <p className="text-[10px] text-amber-700">
                A pin is on the map near this area. Drag it to your exact spot, then submit.
              </p>
            )}
            {geocodeStatus === 'failed' && (
              <p className="text-[10px] text-amber-600">
                Couldn&apos;t find this place automatically. Tap the map at your exact spot to drop the pin.
              </p>
            )}
            {isSubmitted && (pinLat == null || pinLng == null) && (
              <p className="text-[10px] text-red-500">
                Please drop a map pin for this address before submitting.
              </p>
            )}
            {pinLat != null && pinLng != null && (
              <p className="text-[10px] text-gray-600 font-mono">
                Pin: {pinLat.toFixed(6)}, {pinLng.toFixed(6)}
              </p>
            )}
            <div className="overflow-hidden rounded-sm border border-gray-200">
              <MapLocationPicker
                key={`${initialAddress?.address_id ?? 'new-address'}-${selectedWard?.id ?? 'no-ward'}`}
                latitude={pinLat}
                longitude={pinLng}
                onChange={(lat, lng) => {
                  userMapInteractionRef.current += 1
                  setLatitude(lat)
                  setLongitude(lng)
                  setGeocodeStatus('located')
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium text-gray-700">Label As:</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setValue('labelAs', 'HOME', { shouldDirty: true })}
            className={`px-4 py-1 text-xs font-medium rounded-sm cursor-pointer border ${
              labelAs === 'HOME'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => setValue('labelAs', 'OFFICE', { shouldDirty: true })}
            className={`px-4 py-1 text-xs font-medium rounded-sm cursor-pointer border ${
              labelAs === 'OFFICE'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            Work
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-700">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setValue('isDefault', e.target.checked, { shouldDirty: true })}
          className="h-4 w-4 border-gray-300 rounded-sm focus:ring-emerald-600 accent-emerald-600"
        />
        <span>Set as Default Address</span>
      </label>

      {/* Modal footer actions */}
      <div className="pt-2 flex justify-end gap-3">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 cursor-pointer"
          onClick={() => {
            onCancel?.()
            closeModal()
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-sm hover:bg-emerald-700 cursor-pointer"
        >
          Submit
        </button>
      </div>
    </form>
  )
}

