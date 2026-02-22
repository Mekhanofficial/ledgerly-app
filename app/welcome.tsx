import { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';

const { width, height } = Dimensions.get('window');

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  tags: string[];
  features: string[];
};

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const slides: Slide[] = [
    {
      key: 'dashboard',
      title: 'Live business snapshot',
      subtitle: 'Track cash flow, sales, and stock levels in one clean dashboard.',
      icon: 'bar-chart',
      accent: colors.primary500,
      tags: ['Revenue', 'Invoices', 'Inventory'],
      features: [
        'Daily performance at a glance',
        'Outstanding invoices highlighted',
        'Low-stock alerts built in',
      ],
    },
    {
      key: 'invoicing',
      title: 'Invoices in seconds',
      subtitle: 'Create professional invoices fast with smart totals and templates.',
      icon: 'document-text-outline',
      accent: colors.info,
      tags: ['Auto totals', 'PDF share', 'Templates'],
      features: [
        'Auto tax, discounts, and totals',
        'Send PDF or shareable link',
        'Save reusable invoice layouts',
      ],
    },
    {
      key: 'receipts',
      title: 'Receipts + inventory together',
      subtitle: 'Capture payments and keep inventory updated from your phone.',
      icon: 'receipt-outline',
      accent: colors.success,
      tags: ['Payments', 'Receipts', 'History'],
      features: [
        'Instant receipt delivery',
        'Inventory adjusts automatically',
        'Customer history stays synced',
      ],
    },
  ];

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const goToSlide = (index: number) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    scrollRef.current?.scrollTo({ x: width * clamped, y: 0, animated: true });
    setActiveIndex(clamped);
  };

  const isLastSlide = activeIndex === slides.length - 1;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.background} pointerEvents="none">
        <LinearGradient
          colors={[colors.primary50, colors.background, colors.primary100]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.glow,
            {
              backgroundColor: colors.primary500 + '22',
              top: -60,
              right: -40,
            },
          ]}
        />
        <View
          style={[
            styles.glowSmall,
            {
              backgroundColor: colors.info + '22',
              bottom: 120,
              left: -20,
            },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={[styles.logoBadge, { backgroundColor: colors.primary100 }]}>
              <Image
                source={require('@/assets/images/ledgerly-logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>LEDGERLY</Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Professional invoicing and inventory, designed for modern business owners.
          </Text>
        </View>

        <View style={styles.carousel}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={width}
            onMomentumScrollEnd={handleScrollEnd}
            scrollEventThrottle={16}
          >
            {slides.map((slide) => (
              <View key={slide.key} style={[styles.slide, { width }]}>
                <View style={styles.slideContent}>
                  <View
                    style={[
                      styles.heroCard,
                      { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
                    ]}
                  >
                    <LinearGradient
                      colors={[slide.accent + '22', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />

                    <View style={[styles.iconBadge, { backgroundColor: slide.accent + '20' }]}>
                      <Ionicons name={slide.icon} size={28} color={slide.accent} />
                    </View>

                    <Text style={[styles.slideTitle, { color: colors.text }]}>{slide.title}</Text>
                    <Text style={[styles.slideSubtitle, { color: colors.textSecondary }]}>{slide.subtitle}</Text>

                    <View style={styles.tagRow}>
                      {slide.tags.map((tag) => (
                        <View
                          key={`${slide.key}-${tag}`}
                          style={[styles.tag, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                        >
                          <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.featureList}>
                      {slide.features.map((feature) => (
                        <View key={`${slide.key}-${feature}`} style={styles.featureItem}>
                          <Ionicons name="checkmark-circle" size={18} color={slide.accent} />
                          <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.pagination}>
          {slides.map((slide, index) => (
            <View
              key={`dot-${slide.key}`}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === activeIndex ? colors.primary500 : colors.borderDark,
                  width: index === activeIndex ? 22 : 8,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, { shadowColor: colors.shadow }]}
              onPress={() =>
                isLastSlide ? router.push('/(auth)/login') : goToSlide(activeIndex + 1)
              }
            >
              <LinearGradient colors={[colors.primary500, colors.primary600]} style={styles.buttonGradient}>
                <Text style={styles.primaryButtonText}>
                  {isLastSlide ? 'Get Started' : 'Next'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {isLastSlide ? (
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.primary500, backgroundColor: colors.surface }]}
                onPress={() => router.push('/(auth)/signup')}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.primary500 }]}>Create Account</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            By continuing, you agree to our{' '}
            <Text style={[styles.footerLink, { color: colors.primary500 }]}>Terms</Text> &{' '}
            <Text style={[styles.footerLink, { color: colors.primary500 }]}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  glowSmall: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogo: {
    width: 24,
    height: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: width * 0.78,
  },
  carousel: {
    marginHorizontal: -24,
  },
  slide: {
    paddingHorizontal: 24,
  },
  slideContent: {
    minHeight: height * 0.52,
    justifyContent: 'center',
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 6,
    overflow: 'hidden',
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  slideSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  bottomSection: {
    marginTop: 8,
  },
  buttonsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  secondaryButton: {
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
