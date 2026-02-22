import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const { colors, theme } = useTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence of animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/welcome');
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, slideAnim, rotateAnim]); // Added dependencies

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {/* Animated Background Gradient */}
      <LinearGradient
        colors={[
          colors.primary500 + '20', // Changed from primary to primary500
          colors.background,
          colors.primary500 + '10', // Changed from primary to primary500
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Elements */}
      <View style={styles.decorativeContainer}>
        {[...Array(3)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.decorativeCircle,
              {
                backgroundColor: colors.primary500 + '10', // Changed from primary to primary500
                transform: [
                  { scale: scaleAnim },
                  { rotate: rotate },
                ],
                left: i * 100,
                top: i * 50,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.content}>
        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { rotate: rotate },
              ],
            },
          ]}
        >
          {/* Replace this with your actual logo image */}
          <Image
            source={require('@/assets/images/ledgerly-logo.png')} // Update this path
            style={styles.logoImage}
            resizeMode="contain"
          />
          
        </Animated.View>

        {/* App Name with Animation */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={[styles.appName, { color: colors.text }]}>
            LEDGERLY
          </Text>
          
          {/* Animated Underline */}
          <Animated.View
            style={[
              styles.underline,
              {
                backgroundColor: colors.primary500, // Changed from primary to primary500
                transform: [{ scaleX: scaleAnim }],
              },
            ]}
          />
        </Animated.View>

        {/* Tagline with Animation */}
        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={[styles.tagline, { color: colors.textTertiary }]}>
            Invoice, Receipt & Inventory Management
          </Text>
        </Animated.View>

        {/* Loading Indicator */}
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.loadingDots}>
            {[...Array(3)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.loadingDot,
                  {
                    backgroundColor: colors.primary500, // Changed from primary to primary500
                  },
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </View>

      {/* Bottom Gradient */}
      <LinearGradient
        colors={['transparent', colors.primary500 + '10']} // Changed from primary to primary500
        style={styles.bottomGradient}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorativeContainer: {
    position: 'absolute',
    width: width,
    height: height,
  },
  decorativeCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
    zIndex: 2,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  underline: {
    width: 100,
    height: 3,
    borderRadius: 1.5,
  },
  taglineContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
    opacity: 0.5,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    pointerEvents: 'none',
  },
});
