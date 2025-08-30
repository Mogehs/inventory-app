import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import { InventoryItem } from '../../types';
import { Timestamp } from '@react-native-firebase/firestore';

interface ItemDetailsScreenProps {
  route: {
    params: {
      item: InventoryItem;
    };
  };
}

const formatDate = (date: any): string => {
  if (!date) return 'Not available';

  try {
    let dateObj: Date;

    if (date instanceof Timestamp) {
      dateObj = date.toDate();
    } else if (typeof date === 'string') {
      // Handle complex format: "August 31, 2025 at 2:45:25 AM UTC+5"
      if (date.includes(' at ')) {
        const [datePart, timePart] = date.split(' at ');
        const timeWithoutTimezone = timePart.split(' UTC')[0];
        const fullDateString = `${datePart} ${timeWithoutTimezone}`;
        dateObj = new Date(fullDateString);
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = new Date(date);
    }

    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'Invalid date';
  }
};

const ItemDetailsScreen: React.FC<ItemDetailsScreenProps> = ({ route }) => {
  const { item } = route.params;
  const navigation = useNavigation();
  const [saleModalVisible, setSaleModalVisible] = useState(false);
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [saleQuantity, setSaleQuantity] = useState('');
  const [restockQuantity, setRestockQuantity] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const totalValue = item.quantity * item.unitPrice;

  // Determine stock status
  const getStockStatus = () => {
    if (item.quantity <= 0) {
      return { text: 'Out of Stock', color: '#dc3545' };
    } else if (item.quantity <= item.minStockLevel) {
      return { text: 'Low Stock', color: '#fd7e14' };
    } else {
      return { text: 'In Stock', color: '#198754' };
    }
  };

  const { text: statusText, color: statusColor } = getStockStatus();

  const handleEdit = () => {
    // Navigate to AddItem screen with the current item for editing
    (navigation as any).navigate('AddItem', {
      item: item,
      isEdit: true,
    });
  };

  const handleSale = () => {
    setSaleModalVisible(true);
  };

  const handleRestock = () => {
    setRestockModalVisible(true);
  };

  const handleDelete = () => {
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete the item from Firestore
      await firestore().collection('inventory').doc(item.id).delete();

      setDeleteModalVisible(false);

      // Show success message and navigate back
      Alert.alert(
        '✅ Success',
        `"${item.name}" has been deleted successfully`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to inventory - the useFocusEffect will automatically refresh the list
              navigation.goBack();
            },
          },
        ],
      );
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert(
        '❌ Error',
        'Failed to delete item. Please check your connection and try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmSale = async () => {
    const quantity = parseInt(saleQuantity, 10);
    if (!quantity || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (quantity > item.quantity) {
      Alert.alert('Error', 'Cannot sell more than available stock');
      return;
    }

    try {
      const newQuantity = item.quantity - quantity;
      await firestore().collection('inventory').doc(item.id).update({
        quantity: newQuantity,
        updatedAt: firestore.Timestamp.now(),
      });

      Alert.alert('Success', `Sold ${quantity} units successfully`);
      setSaleModalVisible(false);
      setSaleQuantity('');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to record sale');
    }
  };

  const confirmRestock = async () => {
    const quantity = parseInt(restockQuantity, 10);
    if (!quantity || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      const newQuantity = item.quantity + quantity;
      await firestore().collection('inventory').doc(item.id).update({
        quantity: newQuantity,
        updatedAt: firestore.Timestamp.now(),
      });

      Alert.alert('Success', `Added ${quantity} units successfully`);
      setRestockModalVisible(false);
      setRestockQuantity('');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to restock item');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with Product Image and Name */}
        <View style={styles.heroSection}>
          <View style={styles.imageContainer}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <View style={styles.placeholderIcon}>
                  <Text style={styles.placeholderText}>📦</Text>
                </View>
                <Text style={styles.placeholderSubtext}>
                  No Image Available
                </Text>
              </View>
            )}

            {/* Status Badge Overlay */}
            <View style={styles.statusOverlay}>
              <View
                style={[styles.statusBadge, { backgroundColor: statusColor }]}
              >
                <Text style={styles.statusText}>{statusText}</Text>
              </View>
            </View>
          </View>

          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productSku}>SKU: {item.sku}</Text>
            {item.description && (
              <Text style={styles.description}>{item.description}</Text>
            )}
          </View>
        </View>

        {/* Key Metrics Dashboard */}
        <View style={styles.metricsSection}>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Stock</Text>
              <Text style={styles.metricNumber}>{item.quantity}</Text>
              <View style={[styles.metricIndicator, styles.stockIndicator]} />
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Price</Text>
              <Text style={styles.metricNumber}>
                ${item.unitPrice.toFixed(2)}
              </Text>
              <View style={[styles.metricIndicator, styles.priceIndicator]} />
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Value</Text>
              <Text style={styles.metricNumber}>${totalValue.toFixed(0)}</Text>
              <View style={[styles.metricIndicator, styles.valueIndicator]} />
            </View>
          </View>
        </View>

        {/* Product Specifications */}
        <View style={styles.specificationsSection}>
          <Text style={styles.sectionTitle}>Product Details</Text>

          <View style={styles.specCard}>
            <View style={styles.specGroup}>
              <Text style={styles.specGroupTitle}>Basic Information</Text>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Category</Text>
                <Text style={styles.specValue}>
                  {item.category || 'Uncategorized'}
                </Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Location</Text>
                <Text style={styles.specValue}>{item.location}</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Barcode</Text>
                <Text style={[styles.specValue, styles.monoFont]}>
                  {item.barcode || 'Not assigned'}
                </Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.specGroup}>
              <Text style={styles.specGroupTitle}>Pricing</Text>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Cost Price</Text>
                <Text style={styles.specValue}>
                  ${item.costPrice.toFixed(2)}
                </Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Selling Price</Text>
                <Text style={styles.specValue}>
                  ${item.unitPrice.toFixed(2)}
                </Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Profit Margin</Text>
                <Text style={[styles.specValue, styles.profitColor]}>
                  ${(item.unitPrice - item.costPrice).toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.specGroup}>
              <Text style={styles.specGroupTitle}>Stock Management</Text>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Current Stock</Text>
                <Text style={styles.specValue}>{item.quantity} units</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Minimum Level</Text>
                <Text style={styles.specValue}>{item.minStockLevel} units</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Maximum Level</Text>
                <Text style={styles.specValue}>{item.maxStockLevel} units</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Reorder Status</Text>
                <Text
                  style={[
                    styles.specValue,
                    item.quantity <= item.minStockLevel
                      ? styles.warningColor
                      : styles.successColor,
                  ]}
                >
                  {item.quantity <= item.minStockLevel
                    ? 'Reorder Required'
                    : 'Sufficient Stock'}
                </Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.specGroup}>
              <Text style={styles.specGroupTitle}>Record Information</Text>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Created</Text>
                <Text style={styles.specValue}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Last Updated</Text>
                <Text style={styles.specValue}>
                  {formatDate(item.updatedAt)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionCard, styles.editActionCard]}
              onPress={handleEdit}
              activeOpacity={0.7}
            >
              <View
                style={[styles.actionIndicator, { backgroundColor: '#3b82f6' }]}
              />
              <Text style={styles.actionIcon}>✏️</Text>
              <Text style={styles.actionLabel}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.saleActionCard]}
              onPress={handleSale}
              activeOpacity={0.7}
            >
              <View
                style={[styles.actionIndicator, { backgroundColor: '#10b981' }]}
              />
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionLabel}>Sale</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.restockActionCard]}
              onPress={handleRestock}
              activeOpacity={0.7}
            >
              <View
                style={[styles.actionIndicator, { backgroundColor: '#f59e0b' }]}
              />
              <Text style={styles.actionIcon}>📦</Text>
              <Text style={styles.actionLabel}>Restock</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                isDeleting && styles.actionCardDisabled,
              ]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              <View
                style={[styles.actionIndicator, { backgroundColor: '#ef4444' }]}
              />
              <Text style={styles.actionIcon}>{isDeleting ? '⏳' : '🗑️'}</Text>
              <Text style={styles.actionLabel}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Sale Modal */}
      <Modal visible={saleModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Sale</Text>
              <Text style={styles.modalSubtitle}>Enter quantity sold</Text>
            </View>

            <View style={styles.inputSection}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  value={saleQuantity}
                  onChangeText={setSaleQuantity}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                  autoFocus
                />
                <Text style={styles.inputUnit}>units</Text>
              </View>
              <Text style={styles.availableStock}>
                Available: {item.quantity}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSaleModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmSale}>
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Restock Modal */}
      <Modal visible={restockModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Restock Item</Text>
              <Text style={styles.modalSubtitle}>Enter quantity to add</Text>
            </View>

            <View style={styles.inputSection}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.modalInput}
                  value={restockQuantity}
                  onChangeText={setRestockQuantity}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                  autoFocus
                />
                <Text style={styles.inputUnit}>units</Text>
              </View>
              <Text style={styles.availableStock}>
                Current: {item.quantity}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRestockModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={confirmRestock}
              >
                <Text style={styles.confirmText}>Add Stock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.deleteModalContent]}>
            <View style={styles.modalHeader}>
              <View style={styles.deleteModalIcon}>
                <Text style={styles.deleteIconText}>🗑️</Text>
              </View>
              <Text style={styles.modalTitle}>Delete Item</Text>
              <Text style={styles.deleteModalSubtitle}>
                Are you sure you want to permanently delete "{item.name}"?
              </Text>
              <Text style={styles.deleteModalWarning}>
                This action cannot be undone and will remove all associated
                data.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDeleteModalVisible(false)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteBtn,
                  isDeleting && styles.deleteBtnDisabled,
                ]}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                <Text style={styles.deleteText}>
                  {isDeleting ? 'Deleting...' : 'Delete Forever'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },

  // Hero Section
  heroSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 20,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e1e8ed',
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 24,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  statusOverlay: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  productInfo: {
    alignItems: 'center',
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Metrics Section
  metricsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  metricLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metricNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  metricIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  stockIndicator: {
    backgroundColor: '#10b981',
  },
  priceIndicator: {
    backgroundColor: '#f59e0b',
  },
  valueIndicator: {
    backgroundColor: '#3b82f6',
  },

  // Specifications Section
  specificationsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  specCard: {
    backgroundColor: '#fff',
  },
  specGroup: {
    marginBottom: 8,
  },
  specGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  specLabel: {
    fontSize: 14,
    color: '#6c757d',
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  monoFont: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  profitColor: {
    color: '#198754',
  },
  warningColor: {
    color: '#dc3545',
  },
  successColor: {
    color: '#198754',
  },
  separator: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 16,
  },

  // Actions Section
  actionsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    transform: [{ scale: 1 }],
  },
  actionIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  actionIcon: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 2,
  },
  actionCardDisabled: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
  editActionCard: {
    backgroundColor: '#fafaff',
    borderColor: '#e0e7ff',
  },
  saleActionCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#dcfce7',
  },
  restockActionCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fed7aa',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '400',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  modalInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 16,
    textAlign: 'center',
  },
  inputUnit: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 8,
  },
  availableStock: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '400',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Delete Modal Styles
  deleteModalContent: {
    borderColor: '#fee2e2',
    borderWidth: 1,
  },
  deleteModalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  deleteIconText: {
    fontSize: 24,
  },
  deleteModalSubtitle: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalWarning: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '400',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    alignItems: 'center',
  },
  deleteBtnDisabled: {
    backgroundColor: '#fca5a5',
    opacity: 0.7,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ItemDetailsScreen;
