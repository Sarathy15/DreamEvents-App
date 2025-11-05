// Lightweight helper for OpenStreetMap Nominatim search & reverse
export interface NominatimPlace {
  display_name: string;
  lat: string;
  lon: string;
  place_id?: string | number;
  boundingbox?: string[];
  address?: any;
}

const BASE = 'https://nominatim.openstreetmap.org';

const defaultHeaders = {
  'Accept': 'application/json',
  // Nominatim requires a valid user-agent and/or referer. Update as needed.
  'User-Agent': 'DreamEvents/1.0'
};

export const searchPlaces = async (query: string, limit = 6): Promise<NominatimPlace[]> => {
  if (!query) return [];
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(limit)
  });

  const res = await fetch(`${BASE}/search?${params.toString()}`, { headers: defaultHeaders });
  if (!res.ok) throw new Error('Nominatim search failed');
  return (await res.json()) as NominatimPlace[];
};

export const reverseGeocode = async (lat: number, lon: number): Promise<NominatimPlace | null> => {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'jsonv2',
    addressdetails: '1'
  });

  const res = await fetch(`${BASE}/reverse?${params.toString()}`, { headers: defaultHeaders });
  if (!res.ok) return null;
  const body = await res.json();
  return body as NominatimPlace;
};

export default { searchPlaces, reverseGeocode };
