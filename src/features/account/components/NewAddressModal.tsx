import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectAuthUser } from '@/features/auth/store/authSelectors'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { createUserAddress, updateUserAddress } from '../store/accountThunks'
import { locationApi, type StateOption, type CityOption, type DistrictOption, type WardOption } from '../api/locationApi'
import type { UpsertAddressPayload, UserAddress } from '../types/addressTypes'

type Props = {
  onSaved: () => Promise<void> | void
  mode?: 'create' | 'edit'
  initialAddress?: UserAddress
  description?: string
}

type AddressFormErrors = Partial<{
  fullName: string
  phoneNumber: string
  location: string
  addressLine: string
}>

const LOCATION_REQUIRED_ERROR = 'Please select State, City, District, and Ward.'

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

export const NewAddressModal = ({ onSaved, mode = 'create', initialAddress, description }: Props) => {
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

  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
  const [locationTab, setLocationTab] = useState<'state' | 'city' | 'district' | 'ward'>('state')

  const [states, setStates] = useState<StateOption[]>([])
  const [cities, setCities] = useState<CityOption[]>([])
  const [districts, setDistricts] = useState<DistrictOption[]>([])
  const [wards, setWards] = useState<WardOption[]>([])

  const [selectedState, setSelectedState] = useState<StateOption | null>(null)
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictOption | null>(null)
  const [selectedWard, setSelectedWard] = useState<WardOption | null>(null)

  const fullName = watch('fullName')
  const phoneNumber = watch('phoneNumber')
  const labelAs = watch('labelAs')
  const isDefault = watch('isDefault')

  const hasSelectedFullLocation = !!selectedState && !!selectedCity && !!selectedDistrict && !!selectedWard
  const locationLabel = [selectedState?.name, selectedCity?.name, selectedDistrict?.name, selectedWard?.name]
    .filter(Boolean)
    .join(', ')

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

        const districtRes = await locationApi.getDistricts(initialCityOption.id)
        const fetchedDistricts = districtRes.data.data.districts
        setDistricts(fetchedDistricts)

        const initialDistrictOption =
          fetchedDistricts.find((district) => {
            if (initialAddress.district_id) return district.id === initialAddress.district_id
            return district.name === initialAddress.district
          }) ?? null

        if (!initialDistrictOption) return

        setSelectedDistrict(initialDistrictOption)
        setValue('districtId', initialDistrictOption.id, { shouldDirty: false, shouldValidate: false })

        const wardRes = await locationApi.getWards(initialDistrictOption.id)
        const fetchedWards = wardRes.data.data.wards
        setWards(fetchedWards)

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
        setDistricts([])
        setWards([])
      }
    }

    void initializeLocation()
  }, [mode, initialAddress, states, setValue])

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
    setSelectedDistrict(null)
    setSelectedWard(null)
    setValue('stateId', state.id, { shouldDirty: true })
    setValue('cityId', null, { shouldDirty: true })
    setValue('districtId', null, { shouldDirty: true })
    setValue('wardId', null, { shouldDirty: true })
    setLocationTab('city')

    try {
      const res = await locationApi.getCities(state.id)
      setCities(res.data.data.cities)
      setDistricts([])
      setWards([])
    } catch {
      setCities([])
      setDistricts([])
      setWards([])
    }
  }

  const selectCity = async (city: CityOption) => {
    setSelectedCity(city)
    setSelectedDistrict(null)
    setSelectedWard(null)
    setValue('cityId', city.id, { shouldDirty: true })
    setValue('districtId', null, { shouldDirty: true })
    setValue('wardId', null, { shouldDirty: true })
    setLocationTab('district')

    try {
      const res = await locationApi.getDistricts(city.id)
      setDistricts(res.data.data.districts)
      setWards([])
    } catch {
      setDistricts([])
      setWards([])
    }
  }

  const selectDistrict = async (district: DistrictOption) => {
    setSelectedDistrict(district)
    setSelectedWard(null)
    setValue('districtId', district.id, { shouldDirty: true })
    setValue('wardId', null, { shouldDirty: true })
    setLocationTab('ward')

    try {
      const res = await locationApi.getWards(district.id)
      setWards(res.data.data.wards)
    } catch {
      setWards([])
    }
  }

  const selectWard = (ward: WardOption) => {
    setSelectedWard(ward)
    setValue('wardId', ward.id, { shouldDirty: true })
    setLocationDropdownOpen(false)
  }

  const onSubmit = async (values: FormValues) => {
    if (!authUser?.id || !selectedState || !selectedCity || !selectedDistrict || !selectedWard) return

    const payload: UpsertAddressPayload = {
      type: values.labelAs,
      label: values.labelAs === 'HOME' ? 'Home' : 'Work',
      full_name: values.fullName,
      phone_no: values.phoneNumber,
      country_code: 'MM',
      state_id: selectedState.id,
      city_id: selectedCity.id,
      district_id: selectedDistrict.id,
      ward_id: selectedWard.id,
      address_line_1: values.addressLine,
      address_line_2: values.unitNo || null,
      postal_code: values.postalCode || null,
      is_default: values.isDefault,
      is_shipping: true,
      is_billing: false,
    }

    if (mode === 'edit' && initialAddress?.address_id) {
      await dispatch(
        updateUserAddress({
          userId: authUser.id,
          addressId: initialAddress.address_id,
          payload,
        }),
      ).unwrap()
    } else {
      await dispatch(
        createUserAddress({
          userId: authUser.id,
          payload,
        }),
      ).unwrap()
    }

    await Promise.resolve(onSaved())
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

      {/* Row 2: State, City, District, Ward dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setLocationDropdownOpen((open) => !open)}
          className="w-full flex justify-between items-center border border-gray-300 rounded-sm px-3 py-2 text-sm bg-white text-left focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
        >
          <span className={locationLabel ? 'text-gray-900' : 'text-gray-400'}>
            {locationLabel || 'State, City, District, Ward'}
          </span>
          <span className="text-gray-400 text-xs">▼</span>
        </button>

        {locationDropdownOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-sm shadow-lg text-xs">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 text-[11px]">
              {(['state', 'city', 'district', 'ward'] as const).map((tab) => {
                const isActive = locationTab === tab
                const isDisabled =
                  (tab === 'city' && !selectedState) ||
                  (tab === 'district' && !selectedCity) ||
                  (tab === 'ward' && (!selectedCity || !selectedDistrict))
                return (
                  <button
                    key={tab}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && setLocationTab(tab)}
                    className={`flex-1 py-2 text-center uppercase ${
                      isDisabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer text-gray-700'
                    }`}
                  >
                    <span>{tab}</span>
                    {isActive && <div className="mt-1 h-[2px] w-full bg-emerald-600" />}
                  </button>
                )
              })}
            </div>

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto">
              {locationTab === 'state' && (
                <ul>
                  {states.map((state) => (
                    <li
                      key={state.id}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => void selectState(state)}
                    >
                      {state.name}
                    </li>
                  ))}
                </ul>
              )}

              {locationTab === 'city' && (
                <ul>
                  {selectedState ? (
                    cities.map((city) => (
                      <li
                        key={city.id}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => void selectCity(city)}
                      >
                        {city.name}
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-2 text-gray-400">Please select a state first.</li>
                  )}
                </ul>
              )}

              {locationTab === 'district' && (
                <ul>
                  {selectedCity ? (
                    districts.map((district) => (
                      <li
                        key={district.id}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => void selectDistrict(district)}
                      >
                        {district.name}
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-2 text-gray-400">Please select a city first.</li>
                  )}
                </ul>
              )}

              {locationTab === 'ward' && (
                <ul>
                  {selectedDistrict ? (
                    wards.map((ward) => (
                      <li
                        key={ward.id}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => selectWard(ward)}
                      >
                        {ward.name}
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-2 text-gray-400">Please select a district first.</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        )}
      {getFieldError('location') && isSubmitted && (
        <p className="mt-1 text-[11px] text-red-500">{getFieldError('location')}</p>
      )}
      </div>
      

      {/* Row 3: Street name & Add Location (enabled only after basic info + location) */}
      <div className="space-y-2">
        <div>
          <input
            type="text"
            placeholder="Street Name, Building, House No..."
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

        <button
          type="button"
          disabled={!canEditAddressDetails}
          className={`mt-1 inline-flex items-center px-3 py-1 text-xs border rounded-sm ${
            canEditAddressDetails
              ? 'border-gray-400 text-gray-700 bg-white cursor-pointer'
              : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
          }`}
        >
          + Add Location
        </button>

        {canEditAddressDetails && (
          <div className="mt-2 h-32 w-full bg-gray-100 border border-gray-200 rounded-sm flex items-center justify-center text-[11px] text-gray-500">
            Map preview (placeholder)
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
          onClick={closeModal}
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

