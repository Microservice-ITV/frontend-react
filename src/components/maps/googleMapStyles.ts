/**
 * Grab/Foodpanda-like basemap: warm light base, tinted parks/water, clearly-drawn buildings and
 * roads, and prominent dark road/building name labels. Zoom to ≈18 to see footprints + names.
 */
export const GRAB_LIKE_MAP_STYLES: google.maps.MapTypeStyle[] = [
    // Base layer
    { elementType: 'geometry', stylers: [{ color: '#f3f4f6' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#3f454d' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },

    // State / town / neighbourhood names
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#d7dce3' }] },
    { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#30363d' }] },
    { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#5b626b' }] },

    // Landscape / greenery
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#eef3ea' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#cfe8c0' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#4f7042' }] },

    // Building / place name labels stay ON; only the icons are removed.
    { featureType: 'poi', elementType: 'labels.text', stylers: [{ color: '#4b525b' }] },
    { featureType: 'poi.business', elementType: 'labels.text', stylers: [{ color: '#4b525b' }] },

    // Building footprints — visible, with a defined edge.
    { featureType: 'landscape.man_made', elementType: 'geometry.fill', stylers: [{ color: '#e3e5e8' }, { visibility: 'on' }] },
    { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#d0d4d9' }, { visibility: 'on' }] },

    // Roads, arterials, highways
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#d5d9df' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#3f454d' }] },
    { featureType: 'road', elementType: 'labels.text', stylers: [{ weight: '500' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{ color: '#cfd3d9' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f8e3ad' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e8d095' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#6f5f34' }] },

    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit.line', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit.station', stylers: [{ visibility: 'off' }] },

    // Water
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a6cfe8' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#5f8ca8' }] },
]

const BRAND_GREEN = '#059669'

/** Teardrop pin in the app's brand green with a white centre. */
export const MAP_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
  <path d="M20 1C9.5 1 1 9.5 1 20c0 13.5 19 31 19 31s19-17.5 19-31C39 9.5 30.5 1 20 1z" fill="${BRAND_GREEN}" stroke="#ffffff" stroke-width="2"/>
  <circle cx="20" cy="19" r="7.5" fill="#ffffff"/>
  <circle cx="20" cy="19" r="3" fill="${BRAND_GREEN}"/>
</svg>`

/** Data URI for the pin; `scaledSize`/`anchor` are added at runtime in the component. */
export const MAP_PIN_DATA_URI = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(MAP_PIN_SVG)}`