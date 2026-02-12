import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { useData } from '@/context/DataContext';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallScreen = height <= 667;

export default function ManageCategoriesScreen() {
  const { colors, isDark } = useTheme();
  const {
    inventory,
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshData,
    loading,
  } = useData();
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editText, setEditText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const categoriesWithCounts = useMemo(() => {
    const categoryTotals = new Map<string, { id?: string; name: string; count: number; value: number; editable: boolean }>();

    categories.forEach((category) => {
      categoryTotals.set(category.id, {
        id: category.id,
        name: category.name,
        count: 0,
        value: 0,
        editable: true,
      });
    });

    inventory.forEach((item) => {
      const match = categories.find(
        (category) => category.id === item.categoryId || category.name === item.category
      );
      const key = match?.id || item.category || 'uncategorized';
      const name = match?.name || item.category || 'Uncategorized';

      if (!categoryTotals.has(key)) {
        categoryTotals.set(key, {
          id: match?.id,
          name,
          count: 0,
          value: 0,
          editable: Boolean(match?.id),
        });
      }

      const current = categoryTotals.get(key);
      current.count += 1;
      current.value += item.price * item.quantity;
    });

    return Array.from(categoryTotals.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, inventory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (categories.find((c) => c.name.toLowerCase() === newCategory.trim().toLowerCase())) {
      Alert.alert('Error', 'Category already exists');
      return;
    }

    try {
      await createCategory(newCategory.trim());
      Alert.alert('Success', 'Category added successfully');
      setNewCategory('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save category');
    }
  };

  const handleEditCategory = async (category) => {
    if (!editText.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (!category?.id) {
      Alert.alert('Not Supported', 'This category comes from product data. Edit the products instead.');
      return;
    }

    if (
      categories.find(
        (c) => c.name.toLowerCase() === editText.trim().toLowerCase() && c.id !== category.id
      )
    ) {
      Alert.alert('Error', 'Category already exists');
      return;
    }

    try {
      await updateCategory(category.id, { name: editText.trim() });
      setEditingCategory(null);
      setEditText('');
      Alert.alert('Success', 'Category updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update category');
    }
  };

  const handleDeleteCategory = (category) => {
    if (!category?.id) {
      Alert.alert('Not Supported', 'This category comes from product data. Edit the products instead.');
      return;
    }

    const productsInCategory = inventory.filter(
      (item) => item.categoryId === category.id || item.category === category.name
    );
    
    if (productsInCategory.length > 0) {
      Alert.alert(
        'Cannot Delete Category',
        `This category contains ${productsInCategory.length} product(s). Please reassign or delete these products first.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (category.id && typeof category.id === 'string' && category.id.length > 0) {
                await deleteCategory(category.id);
              }
              Alert.alert('Success', 'Category deleted successfully');
            } catch (error) {
              console.error('Failed to delete category:', error);
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const handleViewProducts = (category) => {
    router.push({
      pathname: '/(modals)/category-products',
      params: { category: category.name }
    });
  };

  const getCategoryColor = (index) => {
    const colorsList = [
      colors.primary500,
      colors.success,
      colors.warning,
      colors.error,
      colors.info,
      colors.primary600,
      colors.success + '80',
      colors.warning + '80',
    ];
    return colorsList[index % colorsList.length];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
            tintColor={colors.primary500}
            colors={[colors.primary500]}
            progressBackgroundColor={isDark ? colors.surface : colors.background}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: width * 0.05 }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={isSmallScreen ? 22 : 24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Manage Categories</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Add New Category */}
        <View style={[styles.section, { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
          marginHorizontal: width * 0.05,
          shadowColor: colors.shadow
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Add New Category</Text>
          <View style={styles.addCategoryContainer}>
            <TextInput
              style={[styles.addCategoryInput, { 
                backgroundColor: colors.background, 
                borderColor: colors.border, 
                color: colors.text,
                fontSize: isSmallScreen ? 14 : 16
              }]}
              placeholder="Enter category name"
              placeholderTextColor={colors.textTertiary}
              value={newCategory}
              onChangeText={setNewCategory}
            />
            <TouchableOpacity 
              style={[styles.addCategoryButton, { backgroundColor: colors.primary500 }]}
              onPress={handleAddCategory}
            >
              <Ionicons name="add" size={isSmallScreen ? 18 : 20} color="white" />
              <Text style={[styles.addCategoryButtonText, { fontSize: isSmallScreen ? 14 : 16 }]}>
                Add
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories List */}
        <View style={[styles.section, { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
          marginHorizontal: width * 0.05,
          shadowColor: colors.shadow
        }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>All Categories</Text>
            <Text style={[styles.categoryCount, { color: colors.textTertiary }]}>
              {categoriesWithCounts.length} categories
            </Text>
          </View>

          {categoriesWithCounts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="grid-outline" size={isSmallScreen ? 48 : 60} color={colors.textTertiary} />
              <Text style={[styles.emptyStateText, { color: colors.text }]}>No categories yet</Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textTertiary }]}>
                Add your first category above
              </Text>
            </View>
          ) : (
            <View style={styles.categoriesGrid}>
              {categoriesWithCounts.map((category, index) => (
                <View key={category.name} style={[
                  styles.categoryCard,
                  { 
                    backgroundColor: isDark ? colors.background : '#f8fafc',
                    shadowColor: colors.shadow,
                    width: isTablet ? '23%' : isSmallScreen ? '100%' : '48%'
                  }
                ]}>
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryIcon, { 
                      backgroundColor: `${getCategoryColor(index)}${isDark ? '20' : '20'}` 
                    }]}>
                      <Text style={[styles.categoryIconText, { 
                        color: getCategoryColor(index),
                        fontSize: isSmallScreen ? 16 : 18
                      }]}>
                        {category.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.categoryActions}>
                      <TouchableOpacity 
                        onPress={() => {
                          if (!category?.id) {
                            Alert.alert('Not Supported', 'This category comes from product data. Edit the products instead.');
                            return;
                          }
                          setEditingCategory(category.name);
                          setEditText(category.name);
                        }}
                        style={styles.actionButton}
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                      >
                        <Ionicons name="create-outline" size={isSmallScreen ? 16 : 18} color={colors.primary500} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleDeleteCategory(category)}
                        style={styles.actionButton}
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                      >
                        <Ionicons name="trash-outline" size={isSmallScreen ? 16 : 18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {editingCategory === category.name ? (
                    <View style={styles.editContainer}>
                      <TextInput
                        style={[styles.editInput, { 
                          backgroundColor: isDark ? colors.surface : colors.background, 
                          borderColor: colors.border, 
                          color: colors.text,
                          fontSize: isSmallScreen ? 13 : 14
                        }]}
                        value={editText}
                        onChangeText={setEditText}
                        autoFocus
                      />
                      <View style={styles.editButtons}>
                        <TouchableOpacity 
                          onPress={() => handleEditCategory(category)}
                          style={[styles.saveEditButton, { backgroundColor: colors.primary500 }]}
                        >
                          <Text style={[styles.saveEditText, { fontSize: isSmallScreen ? 12 : 14 }]}>
                            Save
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => {
                            setEditingCategory(null);
                            setEditText('');
                          }}
                          style={[styles.cancelEditButton, { borderColor: colors.border }]}
                        >
                          <Text style={[styles.cancelEditText, { 
                            color: colors.text,
                            fontSize: isSmallScreen ? 12 : 14 
                          }]}>
                            Cancel
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <>
                      <Text style={[styles.categoryName, { 
                        color: colors.text,
                        fontSize: isSmallScreen ? 14 : 16
                      }]} numberOfLines={2}>
                        {category.name}
                      </Text>
                      <View style={styles.categoryStats}>
                        <View style={styles.statItem}>
                          <Text style={[styles.statValue, { 
                            color: colors.text,
                            fontSize: isSmallScreen ? 16 : 18
                          }]}>
                            {category.count}
                          </Text>
                          <Text style={[styles.statLabel, { 
                            color: colors.textTertiary,
                            fontSize: isSmallScreen ? 10 : 11
                          }]}>
                            Products
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={[styles.statValue, { 
                            color: colors.text,
                            fontSize: isSmallScreen ? 14 : 18
                          }]}>
                            ${category.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </Text>
                          <Text style={[styles.statLabel, { 
                            color: colors.textTertiary,
                            fontSize: isSmallScreen ? 10 : 11
                          }]}>
                            Total Value
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={[styles.viewProductsButton, { 
                          backgroundColor: `${colors.primary500}${isDark ? '20' : '10'}` 
                        }]}
                        onPress={() => handleViewProducts(category)}
                      >
                        <Text style={[styles.viewProductsText, { 
                          color: colors.primary500,
                          fontSize: isSmallScreen ? 11 : 12
                        }]}>
                          View Products ->
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Category Tips */}
        <View style={[styles.section, { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
          marginHorizontal: width * 0.05,
          shadowColor: colors.shadow
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tips for Categories</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={isSmallScreen ? 18 : 20} color={colors.success} />
              <Text style={[styles.tipText, { 
                color: colors.text,
                fontSize: isSmallScreen ? 13 : 14
              }]}>
                Create broad categories for better organization
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={isSmallScreen ? 18 : 20} color={colors.success} />
              <Text style={[styles.tipText, { 
                color: colors.text,
                fontSize: isSmallScreen ? 13 : 14
              }]}>
                Use tags for more specific product attributes
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={isSmallScreen ? 18 : 20} color={colors.success} />
              <Text style={[styles.tipText, { 
                color: colors.text,
                fontSize: isSmallScreen ? 13 : 14
              }]}>
                You can edit or delete empty categories anytime
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={isSmallScreen ? 18 : 20} color={colors.success} />
              <Text style={[styles.tipText, { 
                color: colors.text,
                fontSize: isSmallScreen ? 13 : 14
              }]}>
                Categories help in filtering and reporting
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />
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
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: isSmallScreen ? 12 : 16,
    paddingBottom: isSmallScreen ? 16 : 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: isTablet ? 28 : isSmallScreen ? 20 : 24,
    fontWeight: '700',
  },
  headerRight: {
    width: 40,
  },
  section: {
    marginBottom: isSmallScreen ? 12 : 16,
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 24 : isSmallScreen ? 16 : 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 16 : 20,
  },
  sectionTitle: {
    fontSize: isTablet ? 22 : isSmallScreen ? 16 : 18,
    fontWeight: '700',
  },
  categoryCount: {
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '500',
  },
  addCategoryContainer: {
    flexDirection: 'row',
    gap: isSmallScreen ? 8 : 12,
  },
  addCategoryInput: {
    flex: 1,
    borderRadius: isSmallScreen ? 10 : 12,
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 12 : 14,
    fontSize: isSmallScreen ? 14 : 16,
    borderWidth: 1,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: isSmallScreen ? 12 : 14,
    borderRadius: isSmallScreen ? 10 : 12,
    gap: isSmallScreen ? 6 : 8,
  },
  addCategoryButtonText: {
    fontWeight: '600',
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: isSmallScreen ? 30 : 40,
  },
  emptyStateText: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: isSmallScreen ? 13 : 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isSmallScreen ? 8 : 12,
    justifyContent: 'space-between',
  },
  categoryCard: {
    borderRadius: isSmallScreen ? 12 : 16,
    padding: isSmallScreen ? 12 : 16,
    marginBottom: isSmallScreen ? 8 : 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 8 : 12,
  },
  categoryIcon: {
    width: isSmallScreen ? 36 : 40,
    height: isSmallScreen ? 36 : 40,
    borderRadius: isSmallScreen ? 18 : 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconText: {
    fontWeight: '700',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: isSmallScreen ? 6 : 8,
  },
  actionButton: {
    padding: 4,
  },
  categoryName: {
    fontWeight: '700',
    marginBottom: isSmallScreen ? 8 : 12,
    minHeight: isSmallScreen ? 40 : 44,
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: isSmallScreen ? 8 : 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontWeight: '500',
  },
  viewProductsButton: {
    paddingVertical: isSmallScreen ? 6 : 8,
    paddingHorizontal: isSmallScreen ? 10 : 12,
    borderRadius: isSmallScreen ? 6 : 8,
    alignItems: 'center',
  },
  viewProductsText: {
    fontWeight: '600',
  },
  editContainer: {
    marginTop: 8,
  },
  editInput: {
    borderRadius: isSmallScreen ? 6 : 8,
    paddingHorizontal: isSmallScreen ? 10 : 12,
    paddingVertical: isSmallScreen ? 8 : 10,
    fontSize: isSmallScreen ? 13 : 14,
    borderWidth: 1,
    marginBottom: isSmallScreen ? 6 : 8,
  },
  editButtons: {
    flexDirection: 'row',
    gap: isSmallScreen ? 6 : 8,
  },
  saveEditButton: {
    flex: 1,
    paddingVertical: isSmallScreen ? 6 : 8,
    borderRadius: isSmallScreen ? 6 : 8,
    alignItems: 'center',
  },
  saveEditText: {
    fontWeight: '600',
    color: 'white',
  },
  cancelEditButton: {
    flex: 1,
    paddingVertical: isSmallScreen ? 6 : 8,
    borderRadius: isSmallScreen ? 6 : 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelEditText: {
    fontWeight: '600',
  },
  tipsList: {
    gap: isSmallScreen ? 10 : 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: isSmallScreen ? 8 : 12,
  },
  tipText: {
    flex: 1,
    lineHeight: isSmallScreen ? 18 : 20,
  },
  spacer: {
    height: isSmallScreen ? 20 : 40,
  },
});
