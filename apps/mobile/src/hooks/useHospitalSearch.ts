import { CAMEROON_CITIES, type CameroonCity } from '@sauvi/shared';
import { useCallback, useState } from 'react';

export interface HospitalResult {
  name: string;
  address: string;
  city: CameroonCity;
  latitude: number;
  longitude: number;
}

interface BackendHospital {
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface GeoapifyFeature {
  properties: {
    name?: string;
    address_line1?: string;
    address_line2?: string;
    formatted?: string;
    category?: string;
    city?: string;
    county?: string;
    lat: number;
    lon: number;
  };
}

export const useHospitalSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNearbyHospital = useCallback(
    async (lat: number, lon: number): Promise<HospitalResult | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || '';
        const url = `${baseUrl}/sos/hospitals/nearby?lat=${lat}&lon=${lon}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des hôpitaux (Backend SAUVI)');
        }

        const json = (await response.json()) as { data: BackendHospital[] };
        const elements = json.data;

        const element = elements?.[0];

        if (element) {
          const cityTag = element.city || '';
          let matchedCity: CameroonCity = 'Douala';
          for (const c of CAMEROON_CITIES) {
            if (cityTag.toLowerCase().includes(c.toLowerCase())) {
              matchedCity = c;
              break;
            }
          }

          return {
            name: element.name,
            address: element.address,
            city: matchedCity,
            latitude: element.latitude,
            longitude: element.longitude,
          };
        }
        return null;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const searchHospital = useCallback(async (query: string): Promise<HospitalResult[]> => {
    if (!query.trim()) return [];

    setIsLoading(true);
    setError(null);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
      if (!apiKey) {
        throw new Error('Clé API Geoapify manquante');
      }

      // Geoapify Autocomplete
      // filter=countrycode:cm restreint au Cameroun
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&type=amenity&filter=countrycode:cm&limit=20&apiKey=${apiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erreur lors de la recherche (Geoapify)');
      }

      const data = await response.json();

      const features = data.features || [];
      const results: HospitalResult[] = features
        .filter((f: GeoapifyFeature) => {
          const cat = f.properties.category || '';
          const name = (f.properties.name || '').toLowerCase();
          return (
            cat.startsWith('healthcare') ||
            name.includes('hopital') ||
            name.includes('hôpital') ||
            name.includes('clinique') ||
            name.includes('hospital')
          );
        })
        .map((f: GeoapifyFeature) => {
          const props = f.properties;
          const name = props.name || props.address_line1 || 'Lieu inconnu';
          const address = props.address_line2 || props.formatted || 'Adresse inconnue';

          let matchedCity: CameroonCity = 'Douala';
          const cityString = props.city || props.county || '';
          for (const c of CAMEROON_CITIES) {
            if (cityString.toLowerCase().includes(c.toLowerCase())) {
              matchedCity = c;
              break;
            }
          }

          return {
            name,
            address,
            city: matchedCity,
            latitude: props.lat,
            longitude: props.lon,
          };
        })
        .slice(0, 5);

      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchNearbyHospital,
    searchHospital,
    isLoading,
    error,
  };
};
