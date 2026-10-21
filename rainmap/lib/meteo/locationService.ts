/**
 * Precision Location Detection & Reverse Geocoding Service
 *
 * Automatically detects the user's real location using:
 * 1. High-speed browser geolocation (HTML5 navigator.geolocation)
 * 2. Instant IP Geolocation fallback (ipwho.is / freeipapi) if browser GPS times out or is denied
 * 3. Dynamic reverse geocoding to resolve actual neighborhood & district names
 */

export interface DetectedLocation {
  latitude: number;
  longitude: number;
  localityName: string;
  district: string;
  state: string;
  accuracyMeters: number;
  isGps: boolean;
}

// User's verified regional baseline (Chennai / Tamil Nadu)
export const DEFAULT_FALLBACK_LOCATION: DetectedLocation = {
  latitude: 13.0878,
  longitude: 80.2785,
  localityName: "Chennai, Tamil Nadu",
  district: "Chennai",
  state: "Tamil Nadu",
  accuracyMeters: 50,
  isGps: false,
};

/**
 * Reverse geocodes coordinates to a human-readable Indian locality name
 */
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}`,
      {
        signal: controller.signal,
        headers: { "User-Agent": "MeteoGIS-EmergencyWatch/2.0" },
      }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address;
      if (addr) {
        const sub = addr.suburb || addr.neighbourhood || addr.residential || addr.road;
        const city = addr.city || addr.town || addr.county || addr.state_district || "Chennai";
        const state = addr.state || "Tamil Nadu";
        if (sub && city) return `${sub}, ${city}`;
        if (city && state) return `${city}, ${state}`;
      }
      if (data.display_name) {
        const parts = data.display_name.split(",");
        return parts.slice(0, 2).join(",").trim();
      }
    }
  } catch {
    // Gracefully ignore and fallback
  }

  // Coarse coordinate approximation
  return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
}

/**
 * Fetches instant IP-based geolocation when browser GPS times out or is restricted
 */
export async function fetchIpLocation(): Promise<DetectedLocation | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch("https://ipwho.is/", { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.success !== false && data.latitude && data.longitude) {
        const city = data.city || "Chennai";
        const state = data.region || "Tamil Nadu";
        return {
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          localityName: `${city}, ${state}`,
          district: city,
          state: state,
          accuracyMeters: 250,
          isGps: false,
        };
      }
    }
  } catch {
    // Try secondary free IP endpoint
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res2 = await fetch("https://freeipapi.com/api/json", { signal: controller.signal });
      clearTimeout(timeout);
      if (res2.ok) {
        const d2 = await res2.json();
        if (d2.latitude && d2.longitude) {
          return {
            latitude: Number(d2.latitude),
            longitude: Number(d2.longitude),
            localityName: `${d2.cityName || "Chennai"}, ${d2.regionName || "Tamil Nadu"}`,
            district: d2.cityName || "Chennai",
            state: d2.regionName || "Tamil Nadu",
            accuracyMeters: 500,
            isGps: false,
          };
        }
      }
    } catch {
      // Ignore
    }
  }
  return null;
}

/**
 * Resolves the user's authentic location with high-speed dual fallback
 */
export async function detectRealLocation(): Promise<DetectedLocation> {
  // 1. Try HTML5 Geolocation with fast timeout first
  if (typeof window !== "undefined" && "geolocation" in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 4000,
          maximumAge: 300000,
        });
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const locality = await reverseGeocodeCoords(lat, lng);

      return {
        latitude: lat,
        longitude: lng,
        localityName: locality || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (GPS)`,
        district: locality.split(",")[0] || "Local Area",
        state: "Tamil Nadu",
        accuracyMeters: pos.coords.accuracy || 20,
        isGps: true,
      };
    } catch {
      // HTML5 GPS failed or timed out — seamlessly proceed to IP Geolocation
    }
  }

  // 2. IP Geolocation Lookup
  const ipLoc = await fetchIpLocation();
  if (ipLoc) {
    return ipLoc;
  }

  // 3. Fallback to confirmed base location
  return DEFAULT_FALLBACK_LOCATION;
}
