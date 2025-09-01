import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCollection } from '../../config/firebase';
import { InventoryItem } from '../../types';
import { LoadingSpinner } from '../../components';

const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 10; // Increased due to space-efficient single-line details

// Currency formatter for PKR
const formatPKR = (amount: number | undefined) => {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
  }).format(val);
};

// Categories for filtering (matching AddItemScreen)
const CATEGORIES = [
  { label: 'All Categories', value: 'all', icon: '📋' },
  { label: 'Electronics', value: 'electronics', icon: '📱' },
  { label: 'Clothing & Apparel', value: 'clothing', icon: '👕' },
  { label: 'Food & Beverages', value: 'food', icon: '🍎' },
  { label: 'Home & Garden', value: 'home_garden', icon: '🏠' },
  { label: 'Sports & Outdoors', value: 'sports', icon: '⚽' },
  { label: 'Books & Media', value: 'books_media', icon: '📚' },
  { label: 'Health & Beauty', value: 'health_beauty', icon: '💄' },
  { label: 'Automotive', value: 'automotive', icon: '🚗' },
  { label: 'Tools & Hardware', value: 'tools', icon: '🔧' },
  { label: 'Office Supplies', value: 'office', icon: '📎' },
  { label: 'Other', value: 'other', icon: '📦' },
];

// Stock status filters
const STOCK_FILTERS = [
  { label: 'All Stock', value: 'all', color: '#6B7280' },
  { label: 'In Stock', value: 'inStock', color: '#10B981' },
  { label: 'Low Stock', value: 'lowStock', color: '#F59E0B' },
  { label: 'Out of Stock', value: 'outOfStock', color: '#EF4444' },
];

// Sort options
const SORT_OPTIONS = [
  { label: 'Name A-Z', value: 'name_asc' },
  { label: 'Name Z-A', value: 'name_desc' },
  { label: 'Price Low-High', value: 'price_asc' },
  { label: 'Price High-Low', value: 'price_desc' },
  { label: 'Stock Low-High', value: 'stock_asc' },
  { label: 'Stock High-Low', value: 'stock_desc' },
  { label: 'Recently Added', value: 'recent' },
];

const InventoryScreen = ({ navigation, route }: any) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState('all');
  const [sortOption, setSortOption] = useState('name_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Computed filtered and sorted items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items;

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        item =>
          item.category?.toLowerCase() === selectedCategory?.toLowerCase(),
      );
    }

    // Apply stock status filter
    if (selectedStockFilter !== 'all') {
      filtered = filtered.filter(item => {
        switch (selectedStockFilter) {
          case 'inStock':
            return item.quantity > item.minStockLevel;
          case 'lowStock':
            return item.quantity <= item.minStockLevel && item.quantity > 0;
          case 'outOfStock':
            return item.quantity === 0;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'price_asc':
          return a.unitPrice - b.unitPrice;
        case 'price_desc':
          return b.unitPrice - a.unitPrice;
        case 'stock_asc':
          return a.quantity - b.quantity;
        case 'stock_desc':
          return b.quantity - a.quantity;
        case 'recent':
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, selectedCategory, selectedStockFilter, searchQuery, sortOption]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedItems.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    );
  }, [filteredAndSortedItems, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedItems.length / ITEMS_PER_PAGE);

  useEffect(() => {
    loadInventory();
  }, []);

  // Add focus listener to refresh data when returning from other screens
  useFocusEffect(
    useCallback(() => {
      // Only reload if we're not already loading and have items
      // This prevents unnecessary reload on first mount
      if (!loading && items.length > 0) {
        loadInventory();
      }
    }, [loading, items.length]),
  );

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [selectedCategory, selectedStockFilter, searchQuery, sortOption]);

  useEffect(() => {
    // Apply initial filters from route params
    const { filter } = route.params || {};
    if (filter === 'lowStock') {
      setSelectedStockFilter('lowStock');
    } else if (filter === 'outOfStock') {
      setSelectedStockFilter('outOfStock');
    }
  }, [route.params]);

  const loadInventory = async () => {
    try {
      const result = await getCollection('inventory', { ownerOnly: true });
      if (result.success && result.data) {
        setItems(result.data as InventoryItem[]);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInventory();
  };

  // removed status badge helpers: compact layout doesn't show badge

  const getCategoryInfo = (category: string) => {
    // Simply return the category as the label since it's just a text field
    return { label: category || 'Uncategorized', icon: '' };
  };

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedStockFilter('all');
    setSortOption('name_asc');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Enhanced card rendering - Larger, Clearer Product Details
  const renderInventoryCard = ({ item }: { item: InventoryItem }) => {
    const categoryInfo = getCategoryInfo(item.category);
    const totalValue = item.quantity * item.unitPrice;

    // compute compact status
    let statusColor = '#10B981';
    let statusText = 'In Stock';
    if (item.quantity === 0) {
      statusColor = '#EF4444';
      statusText = 'Out';
    } else if (item.quantity <= item.minStockLevel) {
      statusColor = '#F59E0B';
      statusText = 'Low';
    }

    return (
      <TouchableOpacity
        style={styles.inventoryCardCompact}
        onPress={() => navigation.navigate('ItemDetails', { item })}
        activeOpacity={0.7}
      >
        <View style={styles.compactRow}>
          {/* Left: Image */}
          <View style={styles.compactImageWrap}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.compactImage}
              />
            ) : (
              <View style={styles.compactPlaceholder}>
                <Text style={styles.placeholderText}>No</Text>
              </View>
            )}
          </View>

          {/* Middle: Name, badge and SKU */}
          <View style={styles.compactMiddle}>
            <View style={styles.compactNameRow}>
              <Text style={styles.compactName} numberOfLines={1}>
                {item.name}
              </Text>
              <View
                style={[
                  styles.statusBadgeCompact,
                  { backgroundColor: statusColor + '20' },
                ]}
              >
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                  {statusText}
                </Text>
              </View>
            </View>
            <Text style={styles.compactSku}>SKU: {item.sku}</Text>
            <View style={styles.compactChips}>
              <Text style={styles.compactChip}>{categoryInfo.label}</Text>
              <Text style={styles.compactChip}>
                Min Stock: {item.minStockLevel}
              </Text>
            </View>
          </View>

          {/* Right: Metrics */}
          <View style={styles.compactMetrics}>
            <Text style={styles.compactStock}>{item.quantity}</Text>
            <Text style={styles.compactMetricLabel}>Stock</Text>
            <Text style={styles.compactPrice}>{formatPKR(item.unitPrice)}</Text>
            <Text style={styles.compactMetricLabel}>Unit Price</Text>
            <Text style={styles.compactTotal}>{formatPKR(totalValue)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Filter components
  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScrollView}
    >
      {CATEGORIES.map(category => (
        <TouchableOpacity
          key={category.value}
          style={[
            styles.filterChip,
            selectedCategory === category.value && styles.filterChipActive,
          ]}
          onPress={() => setSelectedCategory(category.value)}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedCategory === category.value &&
                styles.filterChipTextActive,
            ]}
          >
            {category.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderStockFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScrollView}
    >
      {STOCK_FILTERS.map(filter => (
        <TouchableOpacity
          key={filter.value}
          style={[
            styles.stockFilterChip,
            selectedStockFilter === filter.value &&
              styles.stockFilterChipActive,
            selectedStockFilter === filter.value && {
              borderColor: filter.color,
            },
          ]}
          onPress={() => setSelectedStockFilter(filter.value)}
        >
          <View
            style={[
              styles.stockFilterDot,
              { backgroundColor: filter.color },
              selectedStockFilter === filter.value &&
                styles.stockFilterDotActive,
            ]}
          />
          <Text
            style={[
              styles.stockFilterText,
              selectedStockFilter === filter.value && { color: filter.color },
            ]}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === 1 && styles.paginationButtonDisabled,
          ]}
          onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          <Text style={styles.paginationButtonText}>‹ Previous</Text>
        </TouchableOpacity>

        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Page {currentPage} of {totalPages}
          </Text>
          <Text style={styles.paginationSubtext}>
            {filteredAndSortedItems.length} items total
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === totalPages && styles.paginationButtonDisabled,
          ]}
          onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          <Text style={styles.paginationButtonText}>Next ›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSortModal(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowSortModal(false)}
      >
        <View style={styles.sortModalContent}>
          <View style={styles.sortModalHeader}>
            <Text style={styles.sortModalTitle}>Sort Options</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <Text style={styles.sortModalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.sortOptionsList}>
            {SORT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  sortOption === option.value && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortOption(option.value);
                  setShowSortModal(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortOption === option.value && styles.sortOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {sortOption === option.value && (
                  <Text style={styles.sortOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );

  if (loading) {
    return <LoadingSpinner visible={true} text="Loading inventory..." />;
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header with Search and Actions */}
      <View style={styles.enhancedHeader}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items, SKU, description..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setShowSortModal(true)}
            >
              <Text style={styles.sortButtonText}>Sort ↕</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterToggle}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Text style={styles.filterToggleText}>Filters</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetAllFilters}
          >
            <Text style={styles.resetButtonText}>Reset All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddItem')}
          >
            <Text style={styles.addButtonText}>+ Add Item</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Section */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Categories</Text>
            {renderCategoryFilter()}
          </View>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Stock Status</Text>
            {renderStockFilters()}
          </View>
        </View>
      )}

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{filteredAndSortedItems.length}</Text>
          <Text style={styles.statLabel}>Items Found</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {
              filteredAndSortedItems.filter(
                item => item.quantity <= item.minStockLevel,
              ).length
            }
          </Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {formatPKR(
              filteredAndSortedItems.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice,
                0,
              ),
            )}
          </Text>
          <Text style={styles.statLabel}>Total Value (PKR)</Text>
        </View>
      </View>

      {/* Inventory List */}
      <FlatList
        data={paginatedItems}
        renderItem={renderInventoryCard}
        keyExtractor={item => item.id}
        style={styles.inventoryList}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No Items Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ||
              selectedCategory !== 'all' ||
              selectedStockFilter !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Start building your inventory by adding your first item'}
            </Text>
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={() => navigation.navigate('AddItem')}
            >
              <Text style={styles.emptyActionButtonText}>
                {filteredAndSortedItems.length === 0
                  ? 'Add Your First Item'
                  : 'Add New Item'}
              </Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={renderPagination}
      />

      {/* Sort Modal */}
      {renderSortModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  // Base container
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Compact header styles
  enhancedHeader: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    height: 34,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    fontSize: 10,
    color: '#111827',
    marginRight: 8,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  filterToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  filterToggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resetButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Compact filter styles
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterSection: {
    marginBottom: 8,
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    marginHorizontal: 16,
  },
  filterScrollView: {
    paddingHorizontal: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  stockFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 2,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stockFilterChipActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  stockFilterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  stockFilterDotActive: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  stockFilterText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Compact stats container
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Inventory list
  inventoryList: {
    flex: 1,
  },
  listContainer: {
    paddingVertical: 4,
  },

  // Enhanced inventory card - Larger, Clearer Product Details
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginVertical: 6,
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  cardContent: {
    marginBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  imageContainer: {
    marginRight: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  productDetails: {
    flex: 1,
  },
  singleLineDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailChipLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    marginRight: 3,
  },
  detailChipValue: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  stockSection: {
    alignItems: 'center',
    flex: 1,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  stockLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  priceSection: {
    alignItems: 'center',
    flex: 1,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 2,
  },
  priceLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  totalSection: {
    alignItems: 'center',
    flex: 1,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 2,
  },
  totalLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    lineHeight: 20,
  },
  itemSku: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Compact pagination
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 1,
  },
  paginationSubtext: {
    fontSize: 9,
    color: '#6B7280',
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyActionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  emptyActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Sort modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: width * 0.8,
    maxHeight: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sortModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sortModalClose: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  sortOptionsList: {
    maxHeight: 240,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sortOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  sortOptionTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  sortOptionCheck: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  // Compact card styles
  inventoryCardCompact: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactImageWrap: {
    width: 56,
    height: 56,
    marginRight: 10,
  },
  compactImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  compactPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  compactMiddle: {
    flex: 1,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  compactSku: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  compactChips: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  compactChip: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 11,
    color: '#6B7280',
  },
  compactMetrics: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  compactStock: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  compactMetricLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  compactPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginTop: 4,
  },
  compactTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
    marginTop: 4,
  },
  compactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default InventoryScreen;
