// Map service implemented with Leaflet + OpenStreetMap tiles
import L, { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';

class GoogleMapsService {
  // keep API-compatible method names used across the app

  // initializeAutocomplete is intentionally a no-op here because
  // autocomplete is handled by `LocationPicker` using LocationIQ.
  async initializeAutocomplete(_inputElement: HTMLInputElement, _onPlaceSelect: (place: any) => void) {
    console.warn('initializeAutocomplete is not supported in the Leaflet-backed service. Use LocationPicker instead.');
    return null;
  }

  async initializeMap(mapElement: HTMLElement, center: { lat: number; lng: number }, zoom = 12): Promise<LeafletMap> {
    // create map if not already created on element
    // clear previous content
    mapElement.innerHTML = '';

    const map = L.map(mapElement).setView([center.lat, center.lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    return map;
  }

  async addMarkersToMap(map: LeafletMap, locations: Array<{
    lat: number;
    lng: number;
    title: string;
    info?: string;
    onClick?: () => void;
  }>) {
    const markers: LeafletMarker[] = [];

    locations.forEach(location => {
      const marker = L.marker([location.lat, location.lng]).addTo(map);
      // bind popup with provided info (HTML allowed)
      const popup = L.popup({ maxWidth: 300 }).setContent(location.info || location.title || '');
      marker.bindPopup(popup);
      // open popup on click and call onClick handler if present
      marker.on('click', () => {
        marker.openPopup();
        if (location.onClick) {
          try { location.onClick(); } catch (e) { console.warn('marker onClick error', e); }
        }
      });
      markers.push(marker);
    });

    return markers;
  }

  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }
}

export const googleMapsService = new GoogleMapsService();