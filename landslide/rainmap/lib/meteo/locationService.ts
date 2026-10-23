/**
 * Precision Location Detection & Reverse Geocoding Service
 *
 * Automatically detects the user's authentic real-time location using:
 * 1. Hardware GPS via expo-location (Foreground Permission & GPS Sensor)
 * 2. High-speed browser geolocation (HTML5 navigator.geolocation) when running on web
 * 3. IP Geolocation fallback (ipwho.is / freeipapi) if GPS permission is unavailable
 * 4. Reverse geocoding to resolve genuine neighborhood & district names
 */

import * as Location from "expo-location";
import { Platform } from "react-native";

export interface DetectedLocation {
  latitude: number;
  longitude: number;
  localityName: string;
  district: string;
  state: string;
  accuracyMeters: number;
  isGps: boolean;
}

// User's default fallback location
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
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}`,
      {
        signal: controller.signal,
        headers: { "User-Agent": "Loony-IMD-EmergencyMap/2.0" },
      }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address;
      if (addr) {
        const sub = addr.suburb || addr.neighbourhood || addr.residential || addr.road;
        const city = addr.city || addr.town || addr.county || addr.state_district;
        const state = addr.state || "";
        if (sub && city) return `${sub}, ${city}`;
        if (city && state) return `${city}, ${state}`;
        if (city) return city;
      }
      if (data.display_name) {
        const parts = data.display_name.split(",");
        return parts.slice(0, 2).join(",").trim();
      }
    }
  } catch {
    // Gracefully ignore and fallback
  }

  return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
}

/**
 * Fetches IP-based geolocation when GPS is unavailable
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
        const city = data.city || "Local Area";
        const state = data.region || "India";
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
            localityName: `${d2.cityName || "Local Area"}, ${d2.regionName || "India"}`,
            district: d2.cityName || "Local Area",
            state: d2.regionName || "India",
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
 * Resolves the user's authentic location using native Android GPS hardware via expo-location
 */
export async function detectRealLocation(): Promise<DetectedLocation> {
  // 1. Try Native Android / iOS GPS Hardware via expo-location
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      let locality = "";
      try {
        const rev = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (rev && rev.length > 0) {
          const item = rev[0];
          const parts = [item.district || item.city || item.subregion, item.region].filter(Boolean);
          locality = parts.join(", ");
        }
      } catch {}

      if (!locality) {
        locality = await reverseGeocodeCoords(lat, lng);
      }

      return {
        latitude: lat,
        longitude: lng,
        localityName: locality || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
        district: locality.split(",")[0]?.trim() || "Current Location",
        state: locality.split(",")[1]?.trim() || "India",
        accuracyMeters: pos.coords.accuracy || 15,
        isGps: true,
      };
    }
  } catch {}

  // 2. HTML5 Web Browser Geolocation fallback
  if (typeof window !== "undefined" && "geolocation" in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000,
        });
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const locality = await reverseGeocodeCoords(lat, lng);

      return {
        latitude: lat,
        longitude: lng,
        localityName: locality || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (GPS)`,
        district: locality.split(",")[0]?.trim() || "Current Location",
        state: locality.split(",")[1]?.trim() || "India",
        accuracyMeters: pos.coords.accuracy || 20,
        isGps: true,
      };
    } catch {
      // HTML5 GPS failed or timed out
    }
  }

  // 3. IP Geolocation Lookup
  const ipLoc = await fetchIpLocation();
  if (ipLoc) {
    return ipLoc;
  }

  // 4. Default baseline
  return DEFAULT_FALLBACK_LOCATION;
}
