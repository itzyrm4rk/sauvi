import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { CheckCircle2, MapPin, RotateCcw, Search } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Button, Card, Input } from '../../components/ui';
import { ROUTES } from '../../constants/routes';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useHospitalSearch } from '../../hooks/useHospitalSearch';
import type { SosStackParamList } from '../../types/navigation.types';

type Props = NativeStackScreenProps<SosStackParamList, typeof ROUTES.SOS.STEP2>;

interface Region {
  latitude: number;
  longitude: number;
}

const DEFAULT_REGION: Region = {
  latitude: 4.0511,
  longitude: 9.7679,
};

export function SosStep2Screen({ navigation, route }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const hasPrefilledHospital = Boolean(route.params.initialHospitalName);

  const [region, setRegion] = useState<Region>(
    route.params.initialLatitude && route.params.initialLongitude
      ? { latitude: route.params.initialLatitude, longitude: route.params.initialLongitude }
      : DEFAULT_REGION,
  );
  const [hospitalName, setHospitalName] = useState(route.params.initialHospitalName || '');
  const [hospitalAddress, setHospitalAddress] = useState(route.params.initialHospitalAddress || '');
  const [city, setCity] = useState(route.params.initialCity || 'Douala');
  const [manualSearch, setManualSearch] = useState('');
  const [isLocating, setIsLocating] = useState(!hasPrefilledHospital);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [autoDetected, setAutoDetected] = useState(hasPrefilledHospital);
  const { fetchNearbyHospital, searchHospital } = useHospitalSearch();

  useEffect(() => {
    if (hasPrefilledHospital) {
      return;
    }
    let mounted = true;

    async function requestLocation(): Promise<void> {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!mounted) return;

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setPermissionDenied(true);
        setIsLocating(false);
        return;
      }

      let currentLocation: Location.LocationObject;
      try {
        currentLocation = (await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 5000)),
        ])) as Location.LocationObject;
      } catch {
        if (!mounted) return;
        setPermissionDenied(true);
        setIsLocating(false);
        return;
      }

      if (!mounted) return;

      const { latitude, longitude } = currentLocation.coords;
      const nearestHospital = await fetchNearbyHospital(latitude, longitude);

      if (!mounted) return;

      if (nearestHospital) {
        setRegion({
          latitude: nearestHospital.latitude,
          longitude: nearestHospital.longitude,
        });
        setHospitalName(nearestHospital.name);
        setHospitalAddress(nearestHospital.address);
        setCity(nearestHospital.city);
        setAutoDetected(true);
      } else {
        setRegion({
          latitude,
          longitude,
        });
        setHospitalName('');
        setHospitalAddress('');
        setAutoDetected(false);
      }
      setIsLocating(false);
    }

    requestLocation().catch(() => {
      if (!mounted) return;
      setPermissionDenied(true);
      setIsLocating(false);
    });

    return () => {
      mounted = false;
    };
  }, [fetchNearbyHospital, hasPrefilledHospital]);

  const applyManualSearch = async (): Promise<void> => {
    const search = manualSearch.trim();
    if (!search) return;

    setIsLocating(true);
    const results = await searchHospital(search);

    const hospital = results?.[0];
    if (hospital) {
      setHospitalName(hospital.name);
      setHospitalAddress(hospital.address);
      setCity(hospital.city);
      setRegion({
        latitude: hospital.latitude,
        longitude: hospital.longitude,
      });
      setAutoDetected(false);
    }
    setIsLocating(false);
  };

  const confirmLocation = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate(ROUTES.SOS.CONFIRM, {
      ...route.params,
      hospitalName,
      hospitalAddress,
      latitude: region.latitude,
      longitude: region.longitude,
      city,
    });
  };

  const canConfirm = hospitalName.trim().length > 1 && hospitalAddress.trim().length > 4;

  const mapHtml = useMemo(
    () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; }
        html, body, #map { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          touchZoom: false,
          scrollWheelZoom: false,
          doubleClickZoom: false
        }).setView([${region.latitude}, ${region.longitude}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        var icon = L.divIcon({
          html: '<div style="width:28px;height:28px;background:#E24B4A;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          className: ''
        });
        L.marker([${region.latitude}, ${region.longitude}], { icon: icon }).addTo(map);
      </script>
    </body>
    </html>
  `,
    [region.latitude, region.longitude],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top + spacing.sm, spacing.xxl) },
        ]}
        keyboardShouldPersistTaps='handled'
      >
        {hasPrefilledHospital && (
          <View style={styles.relaunchBanner}>
            <RotateCcw size={16} color={colors.primary} />
            <Text style={styles.relaunchBannerText}>
              Lieu et hôpital pré-remplis depuis votre alerte précédente.
            </Text>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.title}>Où faut-il envoyer les donneurs ?</Text>
          <Text style={styles.subtitle}>Indiquez l'hôpital pour orienter les donneurs.</Text>
          <View style={styles.progressContainer}>
            <Text style={styles.stepText}>Étape 2/3</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: '66%' }]} />
            </View>
          </View>
        </View>

        {isLocating ? (
          <Card style={styles.mapCard}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} size='large' />
              <Text style={styles.loadingText}>Détection de votre position...</Text>
            </View>
          </Card>
        ) : (
          <>
            <Card style={styles.mapCard}>
              <View style={styles.mapHeader}>
                <View>
                  <Text style={styles.cardTitle}>Localisation</Text>
                  <Text style={styles.muted}>
                    {permissionDenied ? 'Position saisie manuellement' : 'Position détectée'}
                  </Text>
                </View>
                {!permissionDenied && (
                  <View style={styles.gpsBadge}>
                    <CheckCircle2 size={12} color={colors.success} style={{ marginRight: 4 }} />
                    <Text style={styles.gpsBadgeText}>GPS</Text>
                  </View>
                )}
              </View>

              <View style={styles.mapShell}>
                <WebView
                  source={{ html: mapHtml }}
                  style={styles.map}
                  scrollEnabled={false}
                  javaScriptEnabled
                  originWhitelist={['*']}
                />
              </View>
            </Card>

            <Card style={styles.detectedCard}>
              <View style={styles.hospitalRow}>
                <View style={styles.hospitalIcon}>
                  {autoDetected ? (
                    <CheckCircle2 color={colors.success} size={22} />
                  ) : (
                    <MapPin color={colors.primary} size={22} />
                  )}
                </View>
                <View style={styles.hospitalText}>
                  <Text style={styles.hospitalName}>
                    {hospitalName || 'Sélectionnez un hôpital'}
                  </Text>
                  <Text style={styles.muted}>
                    {hospitalAddress || 'Recherche GPS ou saisie manuelle'}
                  </Text>
                </View>
              </View>
            </Card>
          </>
        )}

        {(permissionDenied || !autoDetected) && !isLocating ? (
          <View style={styles.searchSection}>
            <View style={styles.searchHeader}>
              <Search color={colors.primary} size={20} />
              <Text style={styles.searchTitle}>Recherche manuelle</Text>
            </View>
            <Text style={styles.muted}>
              {permissionDenied
                ? "Le GPS n'est pas disponible. Recherchez votre hôpital ci-dessous."
                : 'Aucun hôpital trouvé automatiquement à proximité. Veuillez le rechercher manuellement.'}
            </Text>
            <Input
              placeholder="Nom de l'hôpital ou clinique"
              value={manualSearch}
              onChangeText={setManualSearch}
              leftIcon={<Search color={colors.textSecondary} size={18} />}
              rightIcon={<Search color={colors.primary} size={20} />}
              onRightIconPress={applyManualSearch}
              returnKeyType='search'
              onSubmitEditing={applyManualSearch}
            />
          </View>
        ) : null}

        <Button
          label='Confirmer la localisation'
          fullWidth
          disabled={!canConfirm}
          onPress={confirmLocation}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 200,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xxl,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stepText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  mapCard: {
    padding: spacing.md,
    gap: spacing.md,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  muted: {
    marginTop: spacing.xs,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    color: colors.textSecondary,
  },
  mapShell: {
    height: 220,
    overflow: 'hidden',
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
  },
  detectedCard: {
    padding: spacing.lg,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hospitalIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primaryLight,
  },
  hospitalText: {
    flex: 1,
  },
  hospitalName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  searchTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  searchSection: {
    gap: spacing.sm,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}22`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  gpsBadgeText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.success,
  },
  relaunchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.card,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.2)',
  },
  relaunchBannerText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    lineHeight: typography.lineHeight.xs,
  },
});
