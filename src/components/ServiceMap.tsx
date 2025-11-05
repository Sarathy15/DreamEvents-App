import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Loader } from 'lucide-react';
import locationiq from '../services/locationiq';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Service {
  id: string;
  title: string;
  vendor: string;
  price: number;
  location: string;
  locationData?: {
    address: string;
    lat: number;
    lng: number;
  };
  image: string;
  category: string;
}

interface ServiceMapProps {
  services: Service[];
  onServiceSelect?: (service: Service) => void;
  height?: string;
  className?: string;
}

const ServiceMap: React.FC<ServiceMapProps> = ({
  services,
  onServiceSelect,
  height = "400px",
  className = ""
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<any | null>(null);
  const markersRef = React.useRef<any[]>([]);

  useEffect(() => {
    initializeMap();
    
    // Cleanup function to remove the map instance when component unmounts
    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
  }, []);

  useEffect(() => {
    if (map && services.length > 0) {
      addServiceMarkers();
    }
  }, [map, services]);

  const initializeMap = async () => {
    if (!mapRef.current || map) return;

    try {
      setLoading(true);
      
      // Default center to Chennai, India
      const center: L.LatLngExpression = [13.0827, 80.2707];
      
      // Create map instance with specific options
      const mapInstance = L.map(mapRef.current, {
        center: center,
        zoom: 11,
        minZoom: 4,
        maxZoom: 18,
        scrollWheelZoom: true,
        attributionControl: true
      });
      
      // Add OpenStreetMap tiles with proper attribution
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        tileSize: 512,
        zoomOffset: -1
      }).addTo(mapInstance);

      // Listen for tile load errors
      mapInstance.on('tileerror', (err: any) => {
        console.warn('Leaflet tile error', err);
        setError('Failed to load map tiles');
      });

      // Invalidate size after a short delay
      setTimeout(() => {
        mapInstance.invalidateSize();
      }, 200);

      setMap(mapInstance);
      setError(null);
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to load map');
    } finally {
      setLoading(false);
    }
  };

  // Cache for geocoding results
  const geocodeCache = useRef<Record<string, {
    lat: number;
    lng: number;
    address: string;
  } | null>>({});

  const geocodeLocation = async (locationStr: string) => {
    // Check cache first
    if (geocodeCache.current[locationStr] !== undefined) {
      return geocodeCache.current[locationStr];
    }

    try {
      const results = await locationiq.searchPlaces(locationStr, 1);
      if (results && results.length > 0) {
        const place = results[0];
        const result = {
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon),
          address: place.display_name
        };
        // Cache the result
        geocodeCache.current[locationStr] = result;
        return result;
      }
    } catch (e) {
      console.warn('Failed to geocode location:', locationStr, e);
      // Cache the failure
      geocodeCache.current[locationStr] = null;
    }
    return null;
  };

  const addServiceMarkers = async () => {
    if (!map) return;

    // clear existing markers
    try {
      markersRef.current.forEach(m => { try { map.removeLayer(m); } catch(e){}});
    } catch (e) {}
    markersRef.current = [];

    // First geocode any services that have a location string but no coordinates
    const locatedServices = [...services];
    for (const service of locatedServices) {
      if (!service.locationData?.lat && service.location) {
        const geoData = await geocodeLocation(service.location);
        if (geoData) {
          service.locationData = geoData;
        }
      }
    }

    const locations = locatedServices
      .filter(service => service.locationData?.lat && service.locationData?.lng)
      .map(service => ({
        lat: service.locationData!.lat,
        lng: service.locationData!.lng,
        title: service.title,
        info: `
          <div class="p-3 max-w-xs">
            <img src="${service.image}" alt="${service.title}" class="w-full h-32 object-cover rounded-lg mb-2" />
            <h3 class="font-semibold text-gray-900 mb-1">${service.title}</h3>
            <p class="text-sm text-gray-600 mb-1">by ${service.vendor}</p>
            <p class="text-sm text-gray-600 mb-2">${service.locationData!.address}</p>
            <div class="flex items-center justify-between">
              <span class="text-lg font-bold text-blue-600">₹${service.price.toLocaleString('en-IN')}</span>
              <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">${service.category}</span>
            </div>
          </div>
        `,
        onClick: () => onServiceSelect?.(service)
      }));

    if (locations.length > 0) {
      // Create markers for each location
      const markers = locations.map(loc => {
        const marker = L.marker([loc.lat, loc.lng])
          .addTo(map)
          .bindPopup(loc.info, {
            maxWidth: 300,
            minWidth: 250,
            className: 'service-popup',
            autoPan: true,
            closeButton: true,
            closeOnClick: false,
            autoPanPadding: [50, 50]
          });
        
        if (loc.onClick) {
          marker.on('click', loc.onClick);
        }
        
        // Highlight marker on hover
        marker.on('mouseover', () => {
          marker.openPopup();
        });
        
        return marker;
      });
      
      markersRef.current = markers;

      // Fit map to show all markers
      try {
        const latlngs = locations.map(loc => [loc.lat, loc.lng] as [number, number]);
        const bounds = L.latLngBounds(latlngs);
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (e) {
        console.warn('Could not fit bounds on map', e);
      }
    }
  };

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`} style={{ height }}>
      {error ? (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => { setError(null); initializeMap(); }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : loading && (
        <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
            <Loader className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default ServiceMap;