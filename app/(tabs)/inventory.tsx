import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '../../context/ThemeContext';
import { router } from 'expo-router';
import { useData } from '../../context/DataContext';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallScreen = height <= 667;

type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1512499617640-c2f999098a00?auto=format&fit=crop&w=500&q=80';

export default function InventoryScreen() {
  const { colors, isDark } = useTheme();
  const { inventory, categories, dashboardStats, refreshData, loading, deleteProduct } = useData();
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Status');
  const [refreshing, setRefreshing] = useState(false);

  // Header height based on platform (CustomHeader + status bar)
  const headerHeight = Platform.OS === 'ios' ? 88 : 64;
  const contentPaddingTop = Platform.OS === 'ios' ? headerHeight + 20 : headerHeight + 10;

  // Calculate responsive values
  const responsivePadding = width * 0.05;
  const statCardWidth = (width - responsivePadding * 2 - 12) / 2; // Subtract padding and gap

  const getStatusColor = (status: StockStatus) => {
    switch (status) {
      case 'in-stock': return colors.success;
      case 'low-stock': return colors.warning;
      case 'out-of-stock': return colors.error;
      default: return colors.textTertiary;
    }
  };

  const getStatusText = (status: StockStatus) => {
    switch (status) {
      case 'in-stock': return 'In Stock';
      case 'low-stock': return 'Low Stock';
      case 'out-of-stock': return 'Out of Stock';
      default: return status;
    }
  };

  const categoryOptions = useMemo(
    () => ['All Categories', ...categories.map((category) => category.name)],
    [categories]
  );

  const filteredItems = inventory.filter(item => {
    const categoryMatch = selectedCategory === 'All Categories' || item.category === selectedCategory;
    const statusMatch = selectedStatus === 'All Status' || item.status === selectedStatus.toLowerCase().replace(' ', '-');
    return categoryMatch && statusMatch;
  });

  const totalValue = inventory.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const lowStockItems = inventory.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  // Responsive font sizes
  const getResponsiveFontSize = (baseSize: number) => {
    if (isSmallScreen) return baseSize * 0.9;
    if (isTablet) return baseSize * 1.1;
    return baseSize;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.contentContainer, { 
          paddingTop: contentPaddingTop,
          minHeight: height,
        }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
            tintColor={colors.primary500}
            progressViewOffset={headerHeight}
            colors={[colors.primary500]}
            progressBackgroundColor={isDark ? colors.surface : colors.background}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
          <View style={styles.headerTextContainer}>
            <Text style={[
              styles.title, 
              { 
                color: colors.text,
                fontSize: getResponsiveFontSize(isTablet ? 32 : 28)
              }
            ]}>
              Inventory
            </Text>
            <Text style={[
              styles.subtitle, 
              { 
                color: colors.textTertiary,
                fontSize: getResponsiveFontSize(16)
              }
            ]}>
              Track and manage your products
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.categoryButton, { 
                backgroundColor: colors.surface, 
                borderColor: colors.border 
              }]}
              onPress={() => router.push('/(modals)/manage-categories')}
              activeOpacity={0.7}
            >
              <Ionicons name="list-outline" size={getResponsiveFontSize(20)} color={colors.primary500} />
              <Text style={[styles.categoryButtonText, { 
                color: colors.primary500,
                fontSize: getResponsiveFontSize(14)
              }]}>
                Categories
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.addButton, 
                { 
                  backgroundColor: colors.primary500,
                  width: isSmallScreen ? 40 : 44,
                  height: isSmallScreen ? 40 : 44,
                  borderRadius: isSmallScreen ? 20 : 22,
                }
              ]}
              onPress={() => router.push('/(modals)/add-product')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={getResponsiveFontSize(20)} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview - FIXED: Using horizontal ScrollView instead of flexWrap */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={[styles.statsScrollContainer, { marginHorizontal: responsivePadding }]}
          contentContainerStyle={styles.statsScrollContent}
        >
          <View style={[
            styles.statCard, 
            { 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              shadowColor: colors.shadow,
              width: Math.min(statCardWidth, 200), // Limit max width
              marginRight: 12,
            }
          ]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="cube-outline" size={24} color={colors.primary500} />
            </View>
            <Text style={[
              styles.statTitle, 
              { 
                color: colors.textTertiary,
                fontSize: getResponsiveFontSize(14)
              }
            ]}>
              Total Products
            </Text>
            <Text style={[
              styles.statValue, 
              { 
                color: colors.text,
                fontSize: getResponsiveFontSize(isTablet ? 32 : 28)
              }
            ]}>
              {inventory.length}
            </Text>
            <Text style={[
              styles.statSubtitle, 
              { 
                color: colors.textTertiary,
                fontSize: getResponsiveFontSize(13)
              }
            ]}>
              Items in stock
            </Text>
          </View>
          
          <View style={[
            styles.statCard, 
            { 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              shadowColor: colors.shadow,
              width: Math.min(statCardWidth, 200),
              marginRight: 12,
            }
          ]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="cash-outline" size={24} color={colors.success} />
            </View>
            <Text style={[
              styles.statTitle, 
              { 
                color: colors.textTertiary,
                fontSize: getResponsiveFontSize(14)
              }
            ]}>
              Total Value
            </Text>
            <Text style={[
              styles.statValue, 
              { 
                color: colors.text,
                fontSize: getResponsiveFontSize(isTablet ? 32 : 28)
              }
            ]}>
              ${totalValue.toLocaleString()}
            </Text>
            <Text style={[
              styles.statSubtitle, 
              { 
                color: colors.textTertiary,
                fontSize: getResponsiveFontSize(13)
              }
            ]}>
              Inventory value
            </Text>
          </View>
          
          <View style={[
            styles.statCard, 
            styles.alertCard, 
            { 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              shadowColor: colors.shadow,
              width: Math.min(statCardWidth, 200),
              borderLeftWidth: 4,
              borderLeftColor: colors.error,
            }
          ]}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.error + '20' }]}>
              <Ionicons name="alert-circle" size={24} color={colors.error} />
            </View>
            <Text style={[
              styles.statTitle, 
              { 
                color: colors.textTertiary,
                fontSize: getResponsiveFontSize(14)
              }
            ]}>
              Low Stock Alert
            </Text>
            <Text style={[
              styles.statValue, 
              { 
                color: colors.text,
                fontSize: getResponsiveFontSize(isTablet ? 32 : 28)
              }
            ]}>
              {lowStockItems.length} items
            </Text>
            <Text style={[
              styles.statSubtitle, 
              { 
                color: colors.textTertiary,
                fontSize: getResponsiveFontSize(13)
              }
            ]}>
              Need restocking
            </Text>
          </View>
        </ScrollView>

        {/* Filters */}
        <View style={[styles.filtersContainer, { paddingHorizontal: responsivePadding }]}>
          {/* Status Filter */}
          <View style={styles.filterSection}>
            <Text style={[
              styles.filterLabel, 
              { 
                color: colors.text,
                fontSize: getResponsiveFontSize(16)
              }
            ]}>
              Status
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.filterScroll}
              contentContainerStyle={styles.filterScrollContent}
            >
              {['All Status', 'In Stock', 'Low Stock', 'Out of Stock'].map((status) => {
                const count = status === 'All Status' 
                  ? inventory.length 
                  : inventory.filter(item => item.status === status.toLowerCase().replace(' ', '-')).length;
                
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      { 
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                      },
                      selectedStatus === status && [
                        styles.filterChipActive,
                        { 
                          backgroundColor: colors.primary500,
                          borderColor: colors.primary500
                        }
                      ]
                    ]}
                    onPress={() => setSelectedStatus(status)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { 
                        color: colors.text,
                        fontSize: getResponsiveFontSize(14)
                      },
                      selectedStatus === status && styles.filterChipTextActive
                    ]}>
                      {status}
                      {count > 0 && (
                        <Text style={[
                          styles.filterCount,
                          { 
                            color: selectedStatus === status ? 'white' : colors.textTertiary,
                            fontSize: getResponsiveFontSize(13)
                          }
                        ]}>
                          {' '}({count})
                        </Text>
                      )}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={[
              styles.filterLabel, 
              { 
                color: colors.text,
                fontSize: getResponsiveFontSize(16)
              }
            ]}>
              Categories
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.filterScroll}
              contentContainerStyle={styles.filterScrollContent}
            >
              {categoryOptions.map((category) => {
                const count = category === 'All Categories' 
                  ? inventory.length 
                  : inventory.filter(item => item.category === category).length;
                
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterChip,
                      { 
                        backgroundColor: colors.surface,
                        borderColor: colors.border
                      },
                      selectedCategory === category && [
                        styles.filterChipActive,
                        { 
                          backgroundColor: colors.primary500,
                          borderColor: colors.primary500
                        }
                      ]
                    ]}
                    onPress={() => setSelectedCategory(category)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { 
                        color: colors.text,
                        fontSize: getResponsiveFontSize(14)
                      },
                      selectedCategory === category && styles.filterChipTextActive
                    ]}>
                      {category}
                      {count > 0 && (
                        <Text style={[
                          styles.filterCount,
                          { 
                            color: selectedCategory === category ? 'white' : colors.textTertiary,
                            fontSize: getResponsiveFontSize(13)
                          }
                        ]}>
                          {' '}({count})
                        </Text>
                      )}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Product Count */}
        <View style={[styles.productCountContainer, { paddingHorizontal: responsivePadding }]}>
          <Text style={[
            styles.productCount, 
            { 
              color: colors.textTertiary,
              fontSize: getResponsiveFontSize(14)
            }
          ]}>
            {filteredItems.length} product{filteredItems.length !== 1 ? 's' : ''}
          </Text>
          {filteredItems.length === 0 && selectedCategory !== 'All Categories' && (
            <TouchableOpacity onPress={() => setSelectedCategory('All Categories')}>
              <Text style={[
                styles.clearFilterLink, 
                { 
                  color: colors.primary500,
                  fontSize: getResponsiveFontSize(14)
                }
              ]}>
                Clear filter
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Inventory List */}
        <View style={[styles.inventoryList, { paddingHorizontal: responsivePadding }]}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.inventoryCard, 
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    shadowColor: colors.shadow
                  }
                ]}
                onPress={() => router.push(`/(modals)/product-detail?id=${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.itemHeader}>
                  <View style={[styles.productImageWrapper, { borderColor: colors.border, backgroundColor: colors.primary50 }]}>
                    <Image
                      source={{ uri: item.image || FALLBACK_PRODUCT_IMAGE }}
                      style={styles.productImage}
                      contentFit="cover"
                    />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[
                      styles.itemName, 
                      { 
                        color: colors.text,
                        fontSize: getResponsiveFontSize(18)
                      }
                    ]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.itemDetails}>
                      <Text style={[
                        styles.itemSku, 
                        { 
                          color: colors.textTertiary,
                          backgroundColor: colors.background,
                          fontSize: getResponsiveFontSize(12)
                        }
                      ]}>
                        {item.sku}
                      </Text>
                      <Text style={[
                        styles.itemCategory, 
                        { 
                          color: colors.textTertiary,
                          fontSize: getResponsiveFontSize(14)
                        }
                      ]}>
                        {item.category}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.itemActions}>
                    <Text style={[
                      styles.itemPrice, 
                      { 
                        color: colors.text,
                        fontSize: getResponsiveFontSize(18)
                      }
                    ]}>
                      ${item.price.toFixed(2)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.itemDetailsRow}>
                  <View style={styles.quantityContainer}>
                    <Ionicons name="cube" size={14} color={colors.textTertiary} />
                    <Text style={[
                      styles.quantityText, 
                      { 
                        color: colors.text,
                        fontSize: getResponsiveFontSize(13)
                      }
                    ]}>
                      Remaining: {item.quantity} units
                    </Text>
                    <Text style={[
                      styles.quantityValue, 
                      { 
                        color: colors.textTertiary,
                        fontSize: getResponsiveFontSize(13)
                      }
                    ]}>
                      ${(item.price * item.quantity).toLocaleString()}
                    </Text>
                  </View>
                  
                  <View style={styles.itemActionsRow}>
                    <View style={[
                      styles.statusBadge, 
                      { 
                        backgroundColor: `${getStatusColor(item.status)}${isDark ? '30' : '15'}` 
                      }
                    ]}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                      <Text style={[
                        styles.statusText, 
                        { 
                          color: getStatusColor(item.status),
                          fontSize: getResponsiveFontSize(12)
                        }
                      ]}>
                        {getStatusText(item.status)}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteProduct(item.id);
                      }}
                      style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={getResponsiveFontSize(16)} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Ionicons 
                name="cube-outline" 
                size={getResponsiveFontSize(60)} 
                color={colors.textTertiary} 
              />
              <Text style={[
                styles.emptyStateText, 
                { 
                  color: colors.text,
                  fontSize: getResponsiveFontSize(22)
                }
              ]}>
                No products found
              </Text>
              <Text style={[
                styles.emptyStateSubtext, 
                { 
                  color: colors.textTertiary,
                  fontSize: getResponsiveFontSize(16)
                }
              ]}>
                {selectedCategory !== 'All Categories' || selectedStatus !== 'All Status' 
                  ? 'Try changing your filters' 
                  : 'Add your first product to get started'}
              </Text>
              <TouchableOpacity 
                style={[styles.addProductButton, { backgroundColor: colors.primary500 }]}
                onPress={() => router.push('/(modals)/add-product')}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={[
                  styles.addProductButtonText,
                  { fontSize: getResponsiveFontSize(16) }
                ]}>
                  Add New Product
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.spacer, { height: isSmallScreen ? 20 : 40 }]} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 54,
    paddingBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    letterSpacing: 0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontWeight: '600',
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  // FIXED: Horizontal scroll for stats
  statsScrollContainer: {
    marginBottom: 20,
  },
  statsScrollContent: {
    paddingRight: 20, // Add padding to ensure last card is visible
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertCard: {},
  statTitle: {
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  statValue: {
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statSubtitle: {
    fontWeight: '500',
    opacity: 0.8,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterScrollContent: {
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  filterChipActive: {},
  filterChipText: {
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: 'white',
  },
  filterCount: {
    fontWeight: '500',
    opacity: 0.9,
  },
  productCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productCount: {
    fontWeight: '500',
  },
  clearFilterLink: {
    fontWeight: '600',
  },
  inventoryList: {
    paddingBottom: 30,
  },
  inventoryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  itemSku: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '500',
  },
  itemCategory: {
    fontWeight: '500',
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  productImageWrapper: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  itemPrice: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  itemDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityText: {
    fontWeight: '600',
  },
  quantityValue: {
    fontWeight: '500',
    marginLeft: 8,
  },
  itemActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
  },
  emptyState: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    width: '100%',
  },
  emptyStateText: {
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  addProductButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  spacer: {
    height: 40,
  },
});
