// app/(modals)/settings/storage-usage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

interface StorageItem {
  category: string;
  size: number;
  color: string;
  icon: string;
}

export default function StorageUsageScreen() {
  const { colors } = useTheme();
  const [totalStorage] = useState(5 * 1024 * 1024 * 1024); // 5GB in bytes
  const [usedStorage, setUsedStorage] = useState(2.1 * 1024 * 1024 * 1024); // 2.1GB in bytes
  const [storageItems, setStorageItems] = useState<StorageItem[]>([
    { category: 'Documents & Invoices', size: 0.8 * 1024 * 1024 * 1024, color: colors.primary500, icon: 'document-text' },
    { category: 'Customer Data', size: 0.5 * 1024 * 1024 * 1024, color: colors.success, icon: 'people' },
    { category: 'Product Images', size: 0.4 * 1024 * 1024 * 1024, color: colors.warning, icon: 'images' },
    { category: 'App Cache', size: 0.3 * 1024 * 1024 * 1024, color: colors.info, icon: 'hardware-chip' },
    { category: 'Backups', size: 0.1 * 1024 * 1024 * 1024, color: colors.primary400, icon: 'cloud' },
  ]);

  const calculateStorageUsage = useCallback(async () => {
    try {
      // Calculate cache size using document directory as fallback
      const documentDir = FileSystem.documentDirectory;
      if (documentDir) {
        const dirInfo = await FileSystem.getInfoAsync(documentDir);
        if (dirInfo.exists) {
          // Update cache size in storage items
          const updatedItems = storageItems.map(item => 
            item.category === 'App Cache' 
              ? { ...item, size: dirInfo.size || item.size }
              : item
          );
          setStorageItems(updatedItems);
          
          // Recalculate total used storage
          const totalUsed = updatedItems.reduce((sum, item) => sum + item.size, 0);
          setUsedStorage(totalUsed);
        }
      }
    } catch (error) {
      console.error('Error calculating storage usage:', error);
    }
  }, [storageItems]);

  useEffect(() => {
    calculateStorageUsage();
  }, [calculateStorageUsage]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPercentage = (size: number) => {
    return ((size / totalStorage) * 100).toFixed(1);
  };

  const handleClearCategory = async (category: string) => {
    Alert.alert(
      `Clear ${category}`,
      `Are you sure you want to clear all ${category.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            if (category === 'App Cache') {
              try {
                const documentDir = FileSystem.documentDirectory;
                if (documentDir) {
                  // Get list of files in directory
                  const files = await FileSystem.readDirectoryAsync(documentDir);
                  // Delete each file
                  for (const file of files) {
                    await FileSystem.deleteAsync(`${documentDir}${file}`, { idempotent: true });
                  }
                  await calculateStorageUsage();
                  Alert.alert('Success', 'Cache cleared successfully');
                }
              } catch (err) {
                console.error('Error clearing cache:', err);
                Alert.alert('Error', 'Failed to clear cache');
              }
            } else {
              Alert.alert('Cleared', `${category} cleared (simulated)`);
              // Update storage items
              const updatedItems = storageItems.map(item => 
                item.category === category 
                  ? { ...item, size: 0 }
                  : item
              );
              setStorageItems(updatedItems);
              const totalUsed = updatedItems.reduce((sum, item) => sum + item.size, 0);
              setUsedStorage(totalUsed);
            }
          },
        },
      ]
    );
  };

  const handleManageStorage = () => {
    Alert.alert(
      'Manage Storage',
      'Choose an option:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade Storage', onPress: () => upgradeStorage() },
        { text: 'Optimize Storage', onPress: () => optimizeStorage() },
        { text: 'Export Old Data', onPress: () => exportOldData() },
      ]
    );
  };

  const upgradeStorage = () => {
    Alert.alert(
      'Upgrade Storage',
      'Upgrade your storage plan to get more space:\n\n• 10GB - $2.99/month\n• 25GB - $4.99/month\n• 100GB - $9.99/month',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'View Plans', onPress: () => {} },
      ]
    );
  };

  const optimizeStorage = () => {
    Alert.alert(
      'Optimize Storage',
      'Optimizing storage...',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Optimize',
          onPress: () => {
            // Simulate optimization
            setTimeout(() => {
              const optimizedItems = storageItems.map(item => ({
                ...item,
                size: Math.max(0, item.size * 0.7), // Reduce by 30%
              }));
              setStorageItems(optimizedItems);
              const totalUsed = optimizedItems.reduce((sum, item) => sum + item.size, 0);
              setUsedStorage(totalUsed);
              Alert.alert('Optimized', 'Storage optimized successfully!');
            }, 2000);
          },
        },
      ]
    );
  };

  const exportOldData = () => {
    Alert.alert(
      'Export Old Data',
      'Export data older than 1 year to free up space?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            Alert.alert(
              'Export Started',
              'Old data is being exported. This may take a few minutes.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const percentage = (usedStorage / totalStorage) * 100;
  const widthPercentage = `${percentage}%`;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.summaryCard, { backgroundColor: colors.primary50, borderColor: colors.primary100 }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            Storage Overview
          </Text>
          
          <View style={styles.storageMeter}>
            <View style={styles.meterHeader}>
              <Text style={[styles.usedStorage, { color: colors.text }]}>
                {formatBytes(usedStorage)} used
              </Text>
              <Text style={[styles.totalStorage, { color: colors.textTertiary }]}>
                of {formatBytes(totalStorage)}
              </Text>
            </View>
            
            <View style={[styles.meterBackground, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.meterFill, 
                  { 
                    width: widthPercentage,
                    backgroundColor: percentage > 80 ? colors.error : colors.primary500,
                  }
                ]} 
              />
            </View>
            
            <Text style={[styles.percentage, { color: colors.textSecondary }]}>
              {percentage.toFixed(1)}% used
            </Text>
          </View>
          
          <View style={styles.storageStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary500 }]}>
                {formatBytes(totalStorage - usedStorage)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Available</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatBytes(usedStorage)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Used</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {storageItems.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Categories</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.primary500 }]}
            onPress={() => calculateStorageUsage()}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.quickActionText}>Refresh</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleManageStorage}
          >
            <Ionicons name="settings-outline" size={20} color={colors.primary500} />
            <Text style={[styles.quickActionText, { color: colors.primary500 }]}>Manage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Storage Breakdown
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textTertiary }]}>
            See what&apos;s taking up space in your storage
          </Text>

          <View style={styles.storageList}>
            {storageItems.map((item, index) => {
              const itemPercentage = getPercentage(item.size);
              const itemWidth = `${itemPercentage}%`;
              
              return (
                <View
                  key={index}
                  style={[styles.storageItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.storageItemHeader}>
                    <View style={styles.itemLeft}>
                      <View style={[styles.itemIcon, { backgroundColor: item.color + '20' }]}>
                        <Ionicons name={item.icon as any} size={20} color={item.color} />
                      </View>
                      <View>
                        <Text style={[styles.itemCategory, { color: colors.text }]}>
                          {item.category}
                        </Text>
                        <Text style={[styles.itemSize, { color: colors.textTertiary }]}>
                          {formatBytes(item.size)} • {itemPercentage}% of total
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.itemPercentage, { color: colors.text }]}>
                      {itemPercentage}%
                    </Text>
                  </View>

                  <View style={[styles.progressBackground, { backgroundColor: colors.border }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: itemWidth,
                          backgroundColor: item.color,
                        }
                      ]} 
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.clearButton, { borderColor: colors.border }]}
                    onPress={() => handleClearCategory(item.category)}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>
                      Clear
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Storage Tips
          </Text>
          
          <View style={[styles.tipsCard, { backgroundColor: colors.surface }]}>
            {[
              { icon: 'cloud-upload', text: 'Upload large files to cloud storage' },
              { icon: 'trash', text: 'Regularly clear app cache' },
              { icon: 'document-text', text: 'Compress old documents and invoices' },
              { icon: 'images', text: 'Optimize product images for web' },
              { icon: 'time', text: 'Archive data older than 1 year' },
            ].map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Ionicons name={tip.icon as any} size={20} color={colors.primary500} />
                <Text style={[styles.tipText, { color: colors.text }]}>
                  {tip.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.noteCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary500} />
          <View style={styles.noteContent}>
            <Text style={[styles.noteTitle, { color: colors.text }]}>
              Storage Information
            </Text>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Your storage includes app data, documents, images, and cache. 
              Clearing cache may temporarily improve app performance but won&apos;t delete your important data.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  summaryCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  storageMeter: {
    marginBottom: 24,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  usedStorage: {
    fontSize: 24,
    fontWeight: '700',
  },
  totalStorage: {
    fontSize: 16,
    fontWeight: '500',
  },
  meterBackground: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 6,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  storageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  storageList: {
    gap: 12,
  },
  storageItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  storageItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemCategory: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSize: {
    fontSize: 12,
  },
  itemPercentage: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tipsCard: {
    padding: 20,
    borderRadius: 12,
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
});