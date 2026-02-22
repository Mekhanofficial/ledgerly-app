import { Notification, useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert
} from 'react-native';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    clearNotifications,
    refreshData,
    addNotification,
    generateNotificationsFromData
  } = useData();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'priority'>('all');
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    filterNotifications();
  }, [notifications, filter]);

  const filterNotifications = () => {
    let filtered = [...notifications];
    
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.read);
        break;
      case 'priority':
        filtered = filtered.filter(n => n.priority === 'high');
        break;
      case 'all':
      default:
        break;
    }
    
    // Sort by priority (high first) then date (newest first)
    filtered.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = (priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low']);
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    
    setFilteredNotifications(filtered);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high' && !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'payment':
        return { name: 'cash-outline', color: colors.success };
      case 'invoice':
        return { name: 'document-text-outline', color: colors.primary500 };
      case 'success':
        return { name: 'checkmark-circle-outline', color: colors.success };
      case 'warning':
        return { name: 'warning-outline', color: colors.warning };
      case 'error':
        return { name: 'alert-circle-outline', color: colors.error };
      case 'info':
      default:
        return { name: 'information-circle-outline', color: colors.info || colors.primary400 };
    }
  };

  const getPriorityBadgeColor = (priority?: string) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textTertiary;
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read when pressed
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
    
    // Navigate if action exists
    if (notification.action) {
      router.push(notification.action.route as any);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: clearNotifications
        }
      ]
    );
  };

  const handleMarkAllAsRead = () => {
    Alert.alert(
      'Mark All as Read',
      'Mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark All', 
          onPress: markAllNotificationsAsRead
        }
      ]
    );
  };

  const formatTimeDisplay = (time: string) => {
    if (time === 'Just now') return time;
    if (time.includes('ago')) return time;
    if (time === 'Upcoming') return 'Soon';
    
    // Try to parse as date
    try {
      const date = new Date(time);
      if (!isNaN(date.getTime())) {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      // If parsing fails, return as is
    }
    
    return time;
  };

  // Test function to add a sample notification
  const addTestNotification = () => {
    addNotification({
      type: 'info',
      title: 'System Notification',
      message: 'This is a test notification to demonstrate real-time updates',
      time: 'Just now',
      action: {
        label: 'Go to Dashboard',
        route: '/(tabs)'
      }
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primary50 }]}>
        <Ionicons name="notifications-off-outline" size={48} color={colors.primary500} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
      </Text>
      <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        {filter === 'unread' 
          ? 'You\'ve read all your notifications!' 
          : 'Notifications will appear here for important updates'}
      </Text>
      {filter !== 'all' && (
        <TouchableOpacity 
          style={[styles.viewAllButton, { backgroundColor: colors.primary500 }]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.viewAllButtonText, { color: 'white' }]}>View All Notifications</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
            <View style={styles.headerStats}>
              {unreadCount > 0 && (
                <Text style={[styles.unreadCount, { color: colors.primary500 }]}>
                  {unreadCount} unread
                </Text>
              )}
              {highPriorityCount > 0 && (
                <Text style={[styles.priorityCount, { color: colors.error }]}>
                  {highPriorityCount} urgent
                </Text>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity 
              onPress={handleMarkAllAsRead} 
              style={[styles.headerActionButton, { backgroundColor: colors.primary100 }]}
            >
              <Ionicons name="checkmark-done-outline" size={20} color={colors.primary500} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity 
              onPress={handleClearAll} 
              style={[styles.headerActionButton, { backgroundColor: colors.error + '20' }]}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.filterTab, 
            filter === 'all' && [styles.activeFilterTab, { borderBottomColor: colors.primary500 }]
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterText, 
            { color: filter === 'all' ? colors.primary500 : colors.textSecondary }
          ]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterTab, 
            filter === 'unread' && [styles.activeFilterTab, { borderBottomColor: colors.primary500 }]
          ]}
          onPress={() => setFilter('unread')}
        >
          <View style={styles.filterBadge}>
            <Text style={[
              styles.filterText, 
              { color: filter === 'unread' ? colors.primary500 : colors.textSecondary }
            ]}>
              Unread
            </Text>
            {unreadCount > 0 && (
              <View style={[styles.filterCountBadge, { backgroundColor: colors.primary500 }]}>
                <Text style={styles.filterCountText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterTab, 
            filter === 'priority' && [styles.activeFilterTab, { borderBottomColor: colors.error }]
          ]}
          onPress={() => setFilter('priority')}
        >
          <View style={styles.filterBadge}>
            <Text style={[
              styles.filterText, 
              { color: filter === 'priority' ? colors.error : colors.textSecondary }
            ]}>
              Priority
            </Text>
            {highPriorityCount > 0 && (
              <View style={[styles.filterCountBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.filterCountText}>{highPriorityCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {filteredNotifications.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary500}
              colors={[colors.primary500]}
            />
          }
        >
          {filteredNotifications.map((notification) => {
            const icon = getNotificationIcon(notification.type);
            const priorityColor = getPriorityBadgeColor(notification.priority);
            
            return (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: notification.read ? 0.9 : 1,
                    borderLeftWidth: notification.priority === 'high' ? 4 : 0,
                    borderLeftColor: notification.priority === 'high' ? colors.error : 'transparent',
                  }
                ]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                {/* Unread indicator */}
                {!notification.read && (
                  <View style={[styles.unreadIndicator, { backgroundColor: colors.primary500 }]} />
                )}

                {/* Icon */}
                <View style={[styles.notificationIcon, { backgroundColor: icon.color + '20' }]}>
                  <Ionicons name={icon.name as any} size={20} color={icon.color} />
                </View>

                {/* Content */}
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <View style={styles.titleContainer}>
                      <Text style={[styles.notificationTitle, { color: colors.text }]}>
                        {notification.title}
                      </Text>
                      {notification.priority && notification.priority !== 'low' && (
                        <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                          <Text style={[styles.priorityText, { color: priorityColor }]}>
                            {notification.priority === 'high' ? 'Urgent' : 'Important'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>
                      {formatTimeDisplay(notification.time)}
                    </Text>
                  </View>
                  
                  <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
                    {notification.message}
                  </Text>

                  {notification.action && (
                    <TouchableOpacity 
                      style={[styles.actionButton, { borderColor: colors.primary100 }]}
                      onPress={() => {
                        if (!notification.read) {
                          markNotificationAsRead(notification.id);
                        }
                        router.push(notification.action!.route as any);
                      }}
                    >
                      <Text style={[styles.actionText, { color: colors.primary500 }]}>
                        {notification.action.label}
                      </Text>
                      <Ionicons name="arrow-forward" size={14} color={colors.primary500} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Read status toggle */}
                <TouchableOpacity 
                  style={styles.readToggle}
                  onPress={() => markNotificationAsRead(notification.id)}
                >
                  <Ionicons 
                    name={notification.read ? "radio-button-off" : "radio-button-on"} 
                    size={20} 
                    color={notification.read ? colors.textTertiary : colors.primary500} 
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </Text>
            <TouchableOpacity 
              style={[styles.refreshButton, { backgroundColor: colors.primary100 }]}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <Ionicons 
                name="refresh" 
                size={16} 
                color={refreshing ? colors.textTertiary : colors.primary500} 
              />
              <Text style={[styles.refreshButtonText, { color: colors.primary500 }]}>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  unreadCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  priorityCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterTab: {
    borderBottomWidth: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  viewAllButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    left: -8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
    gap: 6,
    marginRight: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 0,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    marginTop: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  readToggle: {
    padding: 4,
    marginLeft: 4,
    flexShrink: 0,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
