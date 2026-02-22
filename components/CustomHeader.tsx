import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { useData } from '@/context/DataContext';
import { StatusBar } from 'expo-status-bar';

interface CustomHeaderProps {
  showNotificationBadge?: boolean;
  badgeCount?: number;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CustomHeader({
  showNotificationBadge = true,
  badgeCount = 3,
  onNotificationPress,
  onProfilePress,
}: CustomHeaderProps) {
  const { colors, isDark } = useTheme();
  const { user } = useUser();
  const { notifications } = useData();
  const insets = useSafeAreaInsets();

  // Only the actual header height (NOT status bar)
  const headerContentHeight = 64;

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleProfilePress =
    onProfilePress || (() => router.push('/(modals)/profile'));

  const handleNotificationPress =
    onNotificationPress || (() => router.push('/(modals)/notification'));

  const renderProfileImage = () => {
    const initials = user?.firstName?.charAt(0)?.toUpperCase() || 'U';

    if (user?.profileImage) {
      return (
        <Image
          source={{ uri: user.profileImage }}
          style={[styles.profileImage, { borderColor: colors.primary100 }]}
        />
      );
    } else {
      return (
        <View
          style={[
            styles.profileInitialsContainer,
            {
              backgroundColor: colors.primary50,
              borderColor: colors.primary100,
            },
          ]}
        >
          <Text style={[styles.profileInitials, { color: colors.primary600 }]}>
            {initials}
          </Text>
        </View>
      );
    }
  };

  return (
    <>
      {/* StatusBar at the very top */}
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={colors.header}
        translucent={Platform.OS === 'android'} // Translucent for Android
      />

      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.header,
            paddingTop: insets.top,
            height: headerContentHeight + insets.top,
          },
        ]}
      >
        {/* Android StatusBar background fix */}
        {Platform.OS === 'android' && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: insets.top,
              backgroundColor: colors.header,
            }}
          />
        )}

        <View
          style={[
            styles.contentContainer,
            {
              backgroundColor: colors.header,
              shadowColor: colors.shadow,
              height: headerContentHeight,
            },
          ]}
        >
          {/* Left */}
          <View style={styles.logoContainer}>
            <View
              style={[
                styles.logoBadge,
                { backgroundColor: colors.primary100 },
              ]}
            >
              <Image
                source={require('@/assets/images/ledgerly-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Right */}
          <View style={styles.rightContainer}>
            <TouchableOpacity
              style={[
                styles.notificationButton,
                { backgroundColor: colors.surface + '80' },
              ]}
              onPress={handleNotificationPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.textTertiary}
              />
              {showNotificationBadge && unreadCount > 0 && (
                <View
                  style={[
                    styles.notificationBadge,
                    {
                      backgroundColor: colors.error,
                      minWidth: unreadCount > 9 ? 24 : 20,
                    },
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleProfilePress}
              style={styles.profileButton}
              activeOpacity={0.7}
            >
              {renderProfileImage()}
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[styles.bottomBorder, { backgroundColor: colors.border }]}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomBorder: {
    height: 1,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 26,
    height: 26,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
  },
  profileButton: {},
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  profileInitialsContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 16,
    fontWeight: '700',
  },
});
