import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function SplashScreen() {
  const { colors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/welcome');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={styles.logo}>🧾</Text>
        <Text style={[styles.appName, { color: colors.text }]}>LEDGERLY</Text>
        <Text style={[styles.tagline, { color: colors.textTertiary }]}>
          Invoice, Receipt & Inventory Management
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    fontSize: 80,
    marginBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});