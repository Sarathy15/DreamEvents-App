import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import locationiq, { LocationIQPlace } from '../services/locationiq';

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string;
    name?: string;
    lat: number;
    lng: number;
    placeId: string;
  }) => void;
  placeholder?: string;
  value?: string;
  className?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  placeholder = "Enter location...",
  value = "",
  className = ""
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationIQPlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const debounceRef = useRef<number | undefined>(undefined);
  

  useEffect(() => {
    // when value prop changes, update internal value
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      if (!navigator.geolocation) throw new Error('Geolocation not supported');
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        // Attempt reverse geocode; if it fails, still provide lat/lng so user can edit
        let place = null as any;
        try {
          place = await locationiq.reverseGeocode(lat, lng);
        } catch (e) {
          console.warn('LocationIQ reverse geocode failed', e);
        }
        // If LocationIQ didn't return a useful place, try a lightweight Nominatim fallback
        if (!place) {
          try {
            const resp = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
              { headers: { 'Accept-Language': 'en', 'User-Agent': 'DREAM-EVENTS/1.0' } }
            );
            if (resp.ok) {
              const body = await resp.json();
              if (body) {
                place = body;
              }
            }
          } catch (e) {
            console.warn('Nominatim fallback failed', e);
          }
        }
        // Prefer a concise city/state style address when available. Try multiple address fields.
        let shortAddress: string | null = null;
        if (place && place.address) {
          const a = place.address;
          // LocationIQ / Nominatim use slightly different keys; prefer city-like fields
          const primary = a.city || a.town || a.village || a.hamlet || a.suburb || a.county || a.municipality || a.city_district;
          const region = a.state || a.region || a.county || a.state_district;
          if (primary && region) shortAddress = `${primary}, ${region}`;
          else if (primary) shortAddress = primary;
          else if (region) shortAddress = region;
        }

        const location = {
          address: shortAddress || (place ? (place.display_name || place.display_name) : `${lat.toFixed(5)}, ${lng.toFixed(5)}`),
          lat,
          lng,
          placeId: place && (place.place_id || place.place_id === 0) ? String(place.place_id) : `${lat},${lng}`
        };

        setInputValue(location.address);
        onLocationSelect(location);
        setLoading(false);
        toast.success('Current location detected — you can edit it if needed');
      }, (err) => {
        console.error('Geolocation error', err);
        toast.error('Location access denied');
        setLoading(false);
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      toast.error('Location access denied');
      setLoading(false);
    }
  };

  const doSearch = async (q: string) => {
    try {
      const results = await locationiq.searchPlaces(q, 6);
      setSuggestions(results);
      // show suggestions area even if empty so we can display a 'no results' message
      setShowSuggestions(true);
    } catch (error) {
      console.error('LocationIQ search error', error);
      setSuggestions([]);
      setShowSuggestions(true);
      // Display a clearer message if authentication error
      const msg = (error as Error).message || '';
      if (msg.includes('authentication') || msg.includes('401') || msg.includes('403')) {
        toast.error('LocationIQ API key missing or invalid. Please set VITE_LOCATIONIQ_KEY in your .env and restart the dev server.');
      } else {
        toast.error('Location search failed. Check your API key or try again.');
      }
    }
  };

  const onInputChange = (val: string) => {
    setInputValue(val);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      if (val.trim().length >= 2) doSearch(val.trim());
      else {
        setSuggestions([]);
        // show prompt when input is empty
        setShowSuggestions(true);
      }
    }, 300);
  };

  const selectSuggestion = (place: LocationIQPlace) => {
    const location = {
      address: place.display_name,
      lat: Number(place.lat),
      lng: Number(place.lon),
      placeId: place.place_id ? String(place.place_id) : `${place.lat},${place.lon}`
    };
    setInputValue(location.address);
    setShowSuggestions(false);
    setSuggestions([]);
    onLocationSelect(location);
  };

  const renderSuggestionItem = (s: LocationIQPlace, i: number) => {
    const parts = s.display_name.split(',').map(p => p.trim());
    const primary = parts[0];
    const secondary = parts.slice(1).join(', ');
    const key = `${(s.place_id ?? (s.lat + ',' + s.lon))}-${i}`;
    return (
      <li
        key={key}
        className={`p-2 text-sm cursor-pointer hover:bg-gray-100 ${highlighted === i ? 'bg-gray-100' : ''}`}
        onMouseDown={(ev) => { ev.preventDefault(); selectSuggestion(s); }}
        onMouseEnter={() => setHighlighted(i)}
      >
        <div className="font-medium text-gray-900">{primary}</div>
        {secondary && <div className="text-xs text-gray-500">{secondary}</div>}
      </li>
    );
  };

  // no map required — vendors can use autocomplete or current-location and then edit the input

  return (
    <div className="relative">
  <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={() => { if (inputValue.trim().length >= 2) doSearch(inputValue.trim()); setShowSuggestions(true); }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          onKeyDown={(e) => {
            if (!showSuggestions) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlighted((prev) => (prev === null ? 0 : Math.min(suggestions.length - 1, prev + 1)));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlighted((prev) => (prev === null ? suggestions.length - 1 : Math.max(0, prev - 1)));
            } else if (e.key === 'Enter' && highlighted !== null) {
              e.preventDefault();
              selectSuggestion(suggestions[highlighted]);
            }
          }}
        />
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          className="absolute right-3 top-3 p-1 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
          title="Use current location"
        >
          {loading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </button>
      </div>

      {showSuggestions && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-sm max-h-52 overflow-auto">
          {/* If input is empty, show a prompt to use current location */}
          {inputValue.trim().length === 0 ? (
            <li className="p-3 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Use your current location</div>
                  <div className="text-xs text-gray-500">Detect your city and set it as the service location. You can edit it if needed.</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); getCurrentLocation(); setShowSuggestions(false); }}
                    className="bg-blue-600 text-white text-xs px-3 py-1 rounded-md"
                  >Use</button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setShowSuggestions(false); }}
                    className="text-xs px-3 py-1 rounded-md text-gray-600 hover:bg-gray-100"
                  >Cancel</button>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">Or type to search for a different location</div>
            </li>
          ) : (
            // if no suggestions, show a helpful message
            suggestions.length === 0 ? (
              <li className="p-3 text-sm text-gray-500">No results found. Try a different keyword.</li>
            ) : (
              suggestions.map((s, i) => renderSuggestionItem(s, i))
            ) )}
        </ul>
      )}

      {/* No inline map here — autocomplete + current-location allow editing */}
    </div>
  );
};

export default LocationPicker;