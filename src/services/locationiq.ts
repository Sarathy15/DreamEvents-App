// Lightweight helper for LocationIQ forward search & reverse
export interface LocationIQPlace {
  display_name: string;
  lat: string;
  lon: string;
  place_id?: string | number;
  boundingbox?: string[];
  address?: any;
}

// Default endpoint; can be overridden with VITE_LOCATIONIQ_BASE_URL in .env
const DEFAULT_BASE = 'https://us1.locationiq.com/v1'; // change region if needed

const getBase = (): string => {
  const b = (import.meta as any).env?.VITE_LOCATIONIQ_BASE_URL;
  return b || DEFAULT_BASE;
};

const getKey = (): string => {
  // Vite env var should be prefixed with VITE_
  const key = (import.meta as any).env?.VITE_LOCATIONIQ_KEY;
  if (!key) throw new Error('LocationIQ API key not set. Add VITE_LOCATIONIQ_KEY to your .env');
  return key;
};

export const searchPlaces = async (query: string, limit = 6): Promise<LocationIQPlace[]> => {
  if (!query) return [];
  const key = getKey();
  const params = new URLSearchParams({
    key,
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: String(limit)
  });

  const BASE = getBase();
  const res = await fetch(`${BASE}/search.php?${params.toString()}`);
  if (!res.ok) {
    // Try to read message from body for better diagnostics
    let msg = '';
    try {
      const body = await res.text();
      msg = body ? `: ${body}` : '';
    } catch (e) {
      // ignore
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(`LocationIQ authentication error (status ${res.status})${msg}`);
    }
    throw new Error(`LocationIQ search failed (status ${res.status})${msg}`);
  }
  return (await res.json()) as LocationIQPlace[];
};

export const reverseGeocode = async (lat: number, lon: number): Promise<LocationIQPlace | null> => {
  const key = getKey();
  const params = new URLSearchParams({
    key,
    lat: String(lat),
    lon: String(lon),
    format: 'json',
    addressdetails: '1'
  });

  const BASE = getBase();
  const res = await fetch(`${BASE}/reverse.php?${params.toString()}`);
  if (!res.ok) {
    // don't throw for reverse (we have a fallback), but log/return null
    try {
      const txt = await res.text();
      console.warn(`LocationIQ reverse failed: ${res.status} ${txt}`);
    } catch (e) {
      console.warn(`LocationIQ reverse failed: ${res.status}`);
    }
    return null;
  }
  const body = await res.json();
  return body as LocationIQPlace;
};

export default { searchPlaces, reverseGeocode };
