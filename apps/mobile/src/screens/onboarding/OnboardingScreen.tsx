import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui';
import { ROUTES } from '../../constants/routes';
import { colors, spacing, typography } from '../../constants/theme';
import type { AuthStackParamList } from '../../types/navigation.types';

type Props = NativeStackScreenProps<AuthStackParamList, typeof ROUTES.AUTH.ONBOARDING>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Ensemble, sauvons des vies',
    description: 'SAUVI connecte les personnes en urgence médicale aux donneurs de sang bénévoles.',
    image: require('../../../assets/images/onboarding/slide1.png'),
  },
  {
    id: '2',
    title: 'Alertez en un clic',
    description:
      'Envoyez un SOS et trouvez rapidement des donneurs compatibles en quelques minutes.',
    image: require('../../../assets/images/onboarding/slide2.png'),
  },
  {
    id: '3',
    title: 'Devenez un héros',
    description:
      "Rejoignez notre communauté de donneurs et recevez des notifications lorsqu'une vie dépend de vous.",
    image: require('../../../assets/images/onboarding/slide3.png'),
  },
];

export function OnboardingScreen({ navigation }: Props): React.JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.value = event.nativeEvent.contentOffset.x;
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const skipToLogin = () => {
    navigation.replace(ROUTES.AUTH.LOGIN);
  };

  const goToRegister = () => {
    navigation.navigate(ROUTES.AUTH.REGISTER_STEP1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={skipToLogin}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image source={item.image} style={styles.placeholder} contentFit='contain' />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((slide, index) => {
            const animatedStyle = useAnimatedStyle(() => {
              const dotWidth = interpolate(
                scrollX.value,
                [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
                [8, 24, 8],
                Extrapolation.CLAMP,
              );
              const opacity = interpolate(
                scrollX.value,
                [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
                [0.3, 1, 0.3],
                Extrapolation.CLAMP,
              );
              return {
                width: withSpring(dotWidth, { damping: 15 }),
                opacity: withSpring(opacity),
              };
            });

            return <Animated.View key={slide.id} style={[styles.dot, animatedStyle]} />;
          })}
        </View>

        {currentIndex === SLIDES.length - 1 ? (
          <Button label="Commencer l'aventure" onPress={goToRegister} fullWidth />
        ) : (
          <Button
            label='Suivant'
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
            }}
            variant='outline'
            fullWidth
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    alignItems: 'flex-end',
  },
  skipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  placeholder: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xxl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.lg,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
