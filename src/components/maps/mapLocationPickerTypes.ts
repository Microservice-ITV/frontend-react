export type MapLocationPickerProps = {
    latitude: number | null
    longitude: number | null
    onChange: (lat: number, lng: number) => void
    className?: string
}