import { useEffect, useRef, useState } from 'react'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { MapLocationPicker } from '@/components/maps/MapLocationPicker'
import {
  locationApi,
  type CityOption,
  type StateOption,
  type WardOption,
} from '@/features/account/api/locationApi'
import { forwardGeocodeAddress } from '@/lib/geocoding/geocode'

export type ShopOriginValue = {
  stateId: string
  cityId: string
  districtId: string
  wardId: string
  originAddress: string
  originLat: number | null
  originLng: number | null
}

type ShopOriginFieldsProps = {
  value: ShopOriginValue
  onChange: (next: ShopOriginValue) => void
}

function locationAddress(
  ward: string | undefined,
  city: string | undefined,
  state: string | undefined,
): string {
  return [ward, city, state].filter((part) => part && part.trim()).join(', ')
}

export const emptyShopOrigin = (): ShopOriginValue => ({
  stateId: '',
  cityId: '',
  districtId: '',
  wardId: '',
  originAddress: '',
  originLat: null,
  originLng: null,
})

const ShopOriginFields = ({ value, onChange }: ShopOriginFieldsProps) => {
  const [states, setStates] = useState<StateOption[]>([])
  const [cities, setCities] = useState<CityOption[]>([])
  const [wards, setWards] = useState<WardOption[]>([])
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'locating' | 'located' | 'failed'>('idle')
  const geocodeSeqRef = useRef(0)
  const valueRef = useRef(value)
  valueRef.current = value

  const selectedState = states.find((state) => String(state.id) === value.stateId) ?? null
  const selectedCity = cities.find((city) => String(city.id) === value.cityId) ?? null
  const selectedWard = wards.find((ward) => String(ward.id) === value.wardId) ?? null

  useEffect(() => {
    let cancelled = false
    void locationApi
      .getStates()
      .then((res) => {
        if (!cancelled) setStates(res.data?.data?.states ?? [])
      })
      .catch(() => {
        if (!cancelled) setStates([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!value.stateId) {
      setCities([])
      return
    }
    let cancelled = false
    void locationApi
      .getCities(Number(value.stateId))
      .then((res) => {
        if (!cancelled) setCities(res.data?.data?.cities ?? [])
      })
      .catch(() => {
        if (!cancelled) setCities([])
      })
    return () => {
      cancelled = true
    }
  }, [value.stateId])

  useEffect(() => {
    if (!value.cityId) {
      setWards([])
      return
    }
    let cancelled = false
    void locationApi
      .getWards(Number(value.cityId))
      .then((res) => {
        if (!cancelled) setWards(res.data?.data?.wards ?? [])
      })
      .catch(() => {
        if (!cancelled) setWards([])
      })
    return () => {
      cancelled = true
    }
  }, [value.cityId])

  useEffect(() => {
    if (!selectedState || !selectedCity || !selectedWard) return
    if (value.originLat != null && value.originLng != null) return

    const seq = ++geocodeSeqRef.current
    setGeocodeStatus('locating')
    const timer = window.setTimeout(() => {
      void forwardGeocodeAddress({
        ward: selectedWard.name,
        district: selectedCity.name,
        city: selectedCity.name,
        state: selectedState.name,
      }).then((point) => {
        if (seq !== geocodeSeqRef.current) return
        if (!point) {
          setGeocodeStatus('failed')
          return
        }
        onChange({
          ...valueRef.current,
          originLat: point.lat,
          originLng: point.lng,
        })
        setGeocodeStatus('located')
      })
    }, 400)

    return () => {
      window.clearTimeout(timer)
    }
  }, [
    onChange,
    selectedCity,
    selectedState,
    selectedWard,
    value.wardId,
    value.originLat,
    value.originLng,
  ])

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-slate-600">Origin address</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SearchableSelect
          id="shop-origin-state"
          placeholder="Search state..."
          emptyLabel="Select state"
          options={states.map((state) => ({ value: String(state.id), label: state.name }))}
          value={value.stateId}
          onChange={(stateId) => {
            geocodeSeqRef.current += 1
            setGeocodeStatus('idle')
            onChange({
              ...value,
              stateId,
              cityId: '',
              districtId: '',
              wardId: '',
              originAddress: '',
              originLat: null,
              originLng: null,
            })
          }}
        />
        <SearchableSelect
          id="shop-origin-city"
          placeholder="Search city..."
          emptyLabel="Select city"
          options={cities.map((city) => ({ value: String(city.id), label: city.name }))}
          value={value.cityId}
          disabled={!value.stateId}
          onChange={(cityId) => {
            geocodeSeqRef.current += 1
            setGeocodeStatus('idle')
            onChange({
              ...value,
              cityId,
              districtId: '',
              wardId: '',
              originAddress: '',
              originLat: null,
              originLng: null,
            })
          }}
        />
        <SearchableSelect
          id="shop-origin-ward"
          placeholder="Search ward..."
          emptyLabel="Select ward"
          options={wards.map((ward) => ({ value: String(ward.id), label: ward.name }))}
          value={value.wardId}
          disabled={!value.cityId}
          onChange={(wardId) => {
            geocodeSeqRef.current += 1
            setGeocodeStatus('idle')
            const ward = wards.find((item) => String(item.id) === wardId)
            onChange({
              ...value,
              districtId: '',
              wardId,
              originAddress: locationAddress(ward?.name, selectedCity?.name, selectedState?.name),
              originLat: null,
              originLng: null,
            })
          }}
        />
      </div>

      <p className="text-sm text-slate-700">
        {value.originAddress || 'Select state, city, and ward.'}
      </p>

      <div className="space-y-1">
        <p className="text-[11px] text-slate-500">
          Choosing a ward places a pin near that area. Drag the pin to the shop’s exact pickup spot.
        </p>
        {geocodeStatus === 'locating' && (
          <p className="text-[11px] text-slate-500">Locating this ward on the map…</p>
        )}
        {geocodeStatus === 'failed' && (
          <p className="text-[11px] text-amber-700">
            The map could not find this ward automatically. Tap the map to drop the pin.
          </p>
        )}
        {value.originLat != null && value.originLng != null && (
          <p className="font-mono text-[11px] text-slate-600">
            Pin: {value.originLat.toFixed(6)}, {value.originLng.toFixed(6)}
          </p>
        )}
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <MapLocationPicker
            latitude={value.originLat}
            longitude={value.originLng}
            onChange={(lat, lng) => {
              geocodeSeqRef.current += 1
              setGeocodeStatus('located')
              onChange({ ...value, originLat: lat, originLng: lng })
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default ShopOriginFields
