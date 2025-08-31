import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import firestore, { collection } from '@react-native-firebase/firestore';
import { useToast } from '../../components/ToastProvider';
import { Sale, ValidationError } from '../../types';

// Enhanced constants and utilities
// Compact design: removed explicit payment method selector to keep UI tiny and focused

// Enhanced utility functions
const todayStart = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const parseNumber = (v: any): number => {
  const cleaned = String(v).replace(/[^0-9.-]+/g, '');
  const n = Number(cleaned);
  return isNaN(n) ? 0 : Math.max(0, n);
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'pkr',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const validateSaleForm = (data: {
  customer: string;
  sku: string;
  quantity: string;
  unitPrice: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.customer.trim()) {
    errors.push({ field: 'customer', message: 'Customer name is required' });
  }

  if (!data.sku.trim()) {
    errors.push({ field: 'sku', message: 'SKU is required' });
  }

  const quantity = parseNumber(data.quantity);
  if (quantity <= 0) {
    errors.push({
      field: 'quantity',
      message: 'Quantity must be greater than 0',
    });
  }

  const unitPrice = parseNumber(data.unitPrice);
  if (unitPrice <= 0) {
    errors.push({
      field: 'unitPrice',
      message: 'Unit price must be greater than 0',
    });
  }

  return errors;
};

const getSaleStatus = (
  totalPrice: number,
  paidAmount: number,
): 'completed' | 'partial' | 'pending' => {
  if (paidAmount >= totalPrice) return 'completed';
  if (paidAmount > 0) return 'partial';
  return 'pending';
};

// Enhanced styles with modern design system
const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header styles
  pageHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  // Stats header
  statsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },

  // Form styles
  form: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  formHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  formHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },

  // Input styles
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRequired: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  inputFocused: {
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputFlex: {
    flex: 1,
  },
  inputHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  inputSuccess: {
    color: '#10B981',
  },

  // SKU lookup indicator
  skuIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  skuIndicatorSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  skuIndicatorText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '600',
    marginLeft: 6,
  },
  skuIndicatorTextSuccess: {
    color: '#15803D',
  },

  // Payment method selector
  paymentSection: {
    marginTop: 20,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    minWidth: 100,
  },
  paymentMethodSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  paymentMethodIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  paymentMethodTextSelected: {
    color: '#3B82F6',
  },

  // Summary card
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  summaryRemaining: {
    color: '#EF4444',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },

  // Action buttons
  actionButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Sales list
  contentContainer: {
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // Sale item
  saleItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  saleInfo: {
    flex: 1,
    marginRight: 8,
  },
  saleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  saleCustomer: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  saleSku: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
  saleAmount: {
    alignItems: 'flex-end',
  },
  saleTotalPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  saleTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Sale details
  saleDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  saleDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  saleDetailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  saleDetailValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },

  // Status indicator
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusCompleted: {
    backgroundColor: '#DCFCE7',
  },
  statusCompletedText: {
    color: '#15803D',
  },
  statusPartial: {
    backgroundColor: '#FEF3C7',
  },
  statusPartialText: {
    color: '#D97706',
  },
  statusPending: {
    backgroundColor: '#FEE2E2',
  },
  statusPendingText: {
    color: '#DC2626',
  },

  // Payment breakdown
  paymentBreakdown: {
    marginTop: 12,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  paymentIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentLabel: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  paymentValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },

  // Empty states
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Loading states
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  // Error states
  errorContainer: {
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Success states
  successContainer: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successText: {
    fontSize: 14,
    color: '#15803D',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Inline style overrides
  formHeaderIconText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  errorHint: {
    color: '#EF4444',
  },
  skuIconText: {
    fontSize: 12,
  },
  summaryTotalLabel: {
    fontSize: 16,
  },
  summaryPositive: {
    color: '#10B981',
  },
  loadingTitle: {
    marginTop: 16,
  },
  detailValueError: {
    color: '#EF4444',
  },
  paymentIconCash: {
    backgroundColor: '#10B981',
  },
  paymentIconOnline: {
    backgroundColor: '#3B82F6',
  },
  paymentIconText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  paymentBreakdownText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  paymentItemMargin: {
    marginTop: 8,
  },
});

// Enhanced form component with better UX
interface SalesFormProps {
  customer: string;
  setCustomer: (v: string) => void;
  sku: string;
  setSku: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  quantity: string;
  setQuantity: (v: string) => void;
  unitPrice: string;
  setUnitPrice: (v: string) => void;
  paidCash: string;
  setPaidCash: (v: string) => void;
  paidOnline: string;
  setPaidOnline: (v: string) => void;
  // paymentPlatform removed for compact UX
  transactionId: string;
  setTransactionId: (v: string) => void;
  saving: boolean;
  onSave: () => void;
  totalPrice: () => number;
  paidTotal: () => number;
  matchedSkuName?: string | null;
  isLookingUpSku: boolean;
  errors: ValidationError[];
  itemId?: string;
}

const SalesForm: React.FC<SalesFormProps> = props => {
  const {
    customer,
    setCustomer,
    sku,
    setSku,
    name,
    setName,
    quantity,
    setQuantity,
    unitPrice,
    setUnitPrice,
    paidCash,
    setPaidCash,
    paidOnline,
    setPaidOnline,
    transactionId,
    setTransactionId,
    saving,
    onSave,
    totalPrice,
    paidTotal,
    matchedSkuName,
    isLookingUpSku,
    errors,
    itemId,
  } = props;

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const total = totalPrice();
  const paid = paidTotal();
  const remaining = Math.max(0, total - paid);
  const saleStatus = getSaleStatus(total, paid);

  const paymentsEditable = !!matchedSkuName || !!itemId;

  const getFieldError = (fieldName: string): string | undefined => {
    return errors.find(e => e.field === fieldName)?.message;
  };

  const hasError = (fieldName: string): boolean => {
    return errors.some(e => e.field === fieldName);
  };

  return (
    <View style={styles.form}>
      {/* Form Header */}
      <View style={styles.formHeader}>
        <View style={styles.formHeaderIcon}>
          <Text style={styles.formHeaderIconText}>💳</Text>
        </View>
        <Text style={styles.formHeaderText}>Record New Sale</Text>
      </View>

      {/* Customer Information */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, styles.inputRequired]}>
          Customer Name *
        </Text>
        <TextInput
          placeholder="Enter customer's full name"
          placeholderTextColor="#9CA3AF"
          style={[
            styles.input,
            focusedField === 'customer' && styles.inputFocused,
            hasError('customer') && styles.inputError,
          ]}
          value={customer}
          onChangeText={setCustomer}
          onFocus={() => setFocusedField('customer')}
          onBlur={() => setFocusedField(null)}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {getFieldError('customer') && (
          <Text style={[styles.inputHint, styles.errorHint]}>
            {getFieldError('customer')}
          </Text>
        )}
      </View>

      {/* Product Information */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, styles.inputRequired]}>
          Product SKU *
        </Text>
        <TextInput
          placeholder="Enter or scan product SKU"
          placeholderTextColor="#9CA3AF"
          style={[
            styles.input,
            focusedField === 'sku' && styles.inputFocused,
            hasError('sku') && styles.inputError,
          ]}
          value={sku}
          onChangeText={setSku}
          onFocus={() => setFocusedField('sku')}
          onBlur={() => setFocusedField(null)}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {getFieldError('sku') && (
          <Text style={[styles.inputHint, styles.errorHint]}>
            {getFieldError('sku')}
          </Text>
        )}

        {/* SKU Lookup Indicator */}
        {sku.trim() && (
          <View
            style={[
              styles.skuIndicator,
              matchedSkuName && styles.skuIndicatorSuccess,
            ]}
          >
            <Text style={styles.skuIconText}>
              {isLookingUpSku ? '🔍' : matchedSkuName ? '✅' : '❌'}
            </Text>
            <Text
              style={[
                styles.skuIndicatorText,
                matchedSkuName && styles.skuIndicatorTextSuccess,
              ]}
            >
              {isLookingUpSku
                ? 'Looking up SKU...'
                : matchedSkuName
                ? `Found: ${matchedSkuName}`
                : 'SKU not found in inventory'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Product Name</Text>
        <TextInput
          placeholder="Product name (auto-filled from SKU)"
          placeholderTextColor="#9CA3AF"
          style={[styles.input, focusedField === 'name' && styles.inputFocused]}
          value={name}
          onChangeText={setName}
          onFocus={() => setFocusedField('name')}
          onBlur={() => setFocusedField(null)}
          autoCapitalize="words"
        />
      </View>

      {/* Quantity and Price */}
      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, styles.inputFlex]}>
          <Text style={[styles.inputLabel, styles.inputRequired]}>
            Quantity *
          </Text>
          <TextInput
            placeholder="Qty"
            placeholderTextColor="#9CA3AF"
            style={[
              styles.input,
              focusedField === 'quantity' && styles.inputFocused,
              hasError('quantity') && styles.inputError,
            ]}
            value={quantity}
            onChangeText={setQuantity}
            onFocus={() => setFocusedField('quantity')}
            onBlur={() => setFocusedField(null)}
            keyboardType="numeric"
          />
          {getFieldError('quantity') && (
            <Text style={[styles.inputHint, styles.errorHint]}>
              {getFieldError('quantity')}
            </Text>
          )}
        </View>

        <View style={[styles.inputGroup, styles.inputFlex]}>
          <Text style={[styles.inputLabel, styles.inputRequired]}>
            Unit Price *
          </Text>
          <TextInput
            placeholder="$0.00"
            placeholderTextColor="#9CA3AF"
            style={[
              styles.input,
              focusedField === 'unitPrice' && styles.inputFocused,
              hasError('unitPrice') && styles.inputError,
            ]}
            value={unitPrice}
            onChangeText={setUnitPrice}
            onFocus={() => setFocusedField('unitPrice')}
            onBlur={() => setFocusedField(null)}
            keyboardType="decimal-pad"
          />
          {getFieldError('unitPrice') && (
            <Text style={[styles.inputHint, styles.errorHint]}>
              {getFieldError('unitPrice')}
            </Text>
          )}
        </View>
      </View>

      {/* Simple payment inputs (cash and online). Online payment allowed only when SKU matches inventory */}

      {/* Payment Breakdown */}
      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, styles.inputFlex]}>
          <Text style={styles.inputLabel}>Cash Payment</Text>
          <TextInput
            placeholder="$0.00"
            placeholderTextColor="#9CA3AF"
            style={[
              styles.input,
              focusedField === 'paidCash' && styles.inputFocused,
            ]}
            value={paidCash}
            onChangeText={setPaidCash}
            onFocus={() => setFocusedField('paidCash')}
            onBlur={() => setFocusedField(null)}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={[styles.inputGroup, styles.inputFlex]}>
          <Text style={styles.inputLabel}>Online Payment</Text>
          <TextInput
            placeholder="$0.00"
            placeholderTextColor="#9CA3AF"
            style={[
              styles.input,
              focusedField === 'paidOnline' && styles.inputFocused,
            ]}
            value={paidOnline}
            onChangeText={setPaidOnline}
            onFocus={() => setFocusedField('paidOnline')}
            onBlur={() => setFocusedField(null)}
            keyboardType="decimal-pad"
            editable={paymentsEditable}
          />
          {/* online hint handled by paymentsEditable above */}
        </View>
      </View>

      {/* Transaction ID only shown if user enters an online payment amount */}
      {parseNumber(paidOnline) > 0 && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Transaction ID (optional)</Text>
          <TextInput
            placeholder="Enter transaction/reference ID"
            placeholderTextColor="#9CA3AF"
            style={[
              styles.input,
              focusedField === 'transactionId' && styles.inputFocused,
            ]}
            value={transactionId}
            onChangeText={setTransactionId}
            onFocus={() => setFocusedField('transactionId')}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="characters"
          />
        </View>
      )}

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={styles.summaryValue}>{formatCurrency(paid)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, styles.summaryTotalLabel]}>
            Remaining
          </Text>
          <Text
            style={[
              styles.summaryTotal,
              remaining > 0 ? styles.summaryRemaining : styles.summaryPositive,
            ]}
          >
            {formatCurrency(remaining)}
          </Text>
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            saleStatus === 'completed' && styles.statusCompleted,
            saleStatus === 'partial' && styles.statusPartial,
            saleStatus === 'pending' && styles.statusPending,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              saleStatus === 'completed' && styles.statusCompletedText,
              saleStatus === 'partial' && styles.statusPartialText,
              saleStatus === 'pending' && styles.statusPendingText,
            ]}
          >
            {saleStatus}
          </Text>
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          (saving ||
            errors.length > 0 ||
            (parseNumber(paidTotal()) > 0 && !paymentsEditable)) &&
            styles.actionButtonDisabled,
        ]}
        onPress={onSave}
        disabled={
          saving ||
          errors.length > 0 ||
          (parseNumber(paidTotal()) > 0 && !paymentsEditable)
        }
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.actionButtonText}>Record Sale</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Enhanced component definitions
const StatsHeader: React.FC<{ sales: Sale[] }> = ({ sales }) => {
  const todayRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const todayTransactions = sales.length;
  const completedSales = sales.filter(
    sale => getSaleStatus(sale.totalPrice, sale.paidAmount) === 'completed',
  ).length;
  const avgSaleValue =
    todayTransactions > 0 ? todayRevenue / todayTransactions : 0;

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(todayRevenue)}</Text>
          <Text style={styles.statLabel}>Today's Revenue</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{todayTransactions}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completedSales}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(avgSaleValue)}</Text>
          <Text style={styles.statLabel}>Avg Sale</Text>
        </View>
      </View>
    </View>
  );
};

const EmptyStateComponent: React.FC = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>📊</Text>
    <Text style={styles.emptyTitle}>No Sales Today</Text>
    <Text style={styles.emptySubtitle}>
      Start by recording your first sale using the form above. Your sales will
      appear here with detailed information.
    </Text>
  </View>
);

const LoadingComponent: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3B82F6" />
    <Text style={[styles.emptyTitle, styles.loadingTitle]}>
      Loading Sales...
    </Text>
  </View>
);

const SaleItemComponent: React.FC<{ item: Sale }> = ({ item }) => {
  const timestamp = item.createdAt?.toDate
    ? item.createdAt.toDate()
    : new Date();
  const paidCash = Number(item.paidCash || 0);
  const paidOnline = Number(item.paidOnline || 0);
  const totalPaid = Number(item.paidAmount || paidCash + paidOnline || 0);
  const remaining = Number(
    item.remainingAmount || Math.max(0, item.totalPrice - totalPaid),
  );
  const saleStatus = getSaleStatus(item.totalPrice, totalPaid);

  return (
    <View style={styles.saleItem}>
      {/* Sale Header */}
      <View style={styles.saleHeader}>
        <View style={styles.saleInfo}>
          <Text style={styles.saleTitle}>
            {item.productName || item.name || item.sku}
          </Text>
          <Text style={styles.saleCustomer}>{item.customer}</Text>
          {item.sku && <Text style={styles.saleSku}>SKU: {item.sku}</Text>}
        </View>
        <View style={styles.saleAmount}>
          <Text style={styles.saleTotalPrice}>
            {formatCurrency(item.totalPrice)}
          </Text>
          <Text style={styles.saleTime}>{formatTime(timestamp)}</Text>
        </View>
      </View>

      {/* Sale Details */}
      <View style={styles.saleDetails}>
        <View style={styles.saleDetailRow}>
          <Text style={styles.saleDetailLabel}>Quantity × Unit Price</Text>
          <Text style={styles.saleDetailValue}>
            {item.quantity} × {formatCurrency(item.unitPrice)}
          </Text>
        </View>

        <View style={styles.saleDetailRow}>
          <Text style={styles.saleDetailLabel}>Total Paid</Text>
          <Text style={styles.saleDetailValue}>
            {formatCurrency(totalPaid)}
          </Text>
        </View>

        {remaining > 0 && (
          <View style={styles.saleDetailRow}>
            <Text style={styles.saleDetailLabel}>Remaining</Text>
            <Text style={[styles.saleDetailValue, styles.detailValueError]}>
              {formatCurrency(remaining)}
            </Text>
          </View>
        )}
      </View>

      {/* Payment Breakdown */}
      {(paidCash > 0 || paidOnline > 0) && (
        <View style={styles.paymentBreakdown}>
          {paidCash > 0 && (
            <View style={styles.paymentItem}>
              <View style={[styles.paymentIcon, styles.paymentIconCash]}>
                <Text style={styles.paymentIconText}>💵</Text>
              </View>
              <Text style={styles.paymentLabel}>Cash</Text>
              <Text style={styles.paymentValue}>
                {formatCurrency(paidCash)}
              </Text>
            </View>
          )}

          {paidOnline > 0 && (
            <View style={styles.paymentItem}>
              <View style={[styles.paymentIcon, styles.paymentIconOnline]}>
                <Text style={styles.paymentIconText}>💳</Text>
              </View>
              <Text style={styles.paymentLabel}>
                {item.paymentPlatform || 'Online'}
              </Text>
              <Text style={styles.paymentValue}>
                {formatCurrency(paidOnline)}
              </Text>
            </View>
          )}

          {item.transactionId && (
            <View style={[styles.paymentItem, styles.paymentItemMargin]}>
              <Text style={[styles.paymentLabel, styles.paymentBreakdownText]}>
                Transaction ID: {item.transactionId}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Status Badge */}
      <View
        style={[
          styles.statusBadge,
          saleStatus === 'completed' && styles.statusCompleted,
          saleStatus === 'partial' && styles.statusPartial,
          saleStatus === 'pending' && styles.statusPending,
        ]}
      >
        <Text
          style={[
            styles.statusBadgeText,
            saleStatus === 'completed' && styles.statusCompletedText,
            saleStatus === 'partial' && styles.statusPartialText,
            saleStatus === 'pending' && styles.statusPendingText,
          ]}
        >
          {saleStatus === 'completed'
            ? '✅ Paid in Full'
            : saleStatus === 'partial'
            ? '⚠️ Partially Paid'
            : '❌ Pending Payment'}
        </Text>
      </View>
    </View>
  );
};

// Enhanced main SalesScreen component
const SalesScreen: React.FC = () => {
  const route = useRoute<any>();
  const toast = useToast();
  // Accept either a nested `salePrefill` or flat params
  const rawParams = route.params || {};
  const prefill = rawParams.salePrefill || rawParams || {};

  // Form state
  const [customer, setCustomer] = useState(prefill.customer || '');
  const [itemId, setItemId] = useState(prefill.itemId || '');
  const [sku, setSku] = useState(prefill.sku || '');
  const [name, setName] = useState(prefill.name || '');
  const [unitPrice, setUnitPrice] = useState(
    prefill.unitPrice ? String(prefill.unitPrice) : '',
  );
  const [quantity, setQuantity] = useState('1');
  const [paidCash, setPaidCash] = useState('');
  const [paidOnline, setPaidOnline] = useState('');
  // paymentPlatform removed: we only optionally store transactionId when online paid
  const [transactionId, setTransactionId] = useState('');

  // UI state
  const [matchedSkuName, setMatchedSkuName] = useState<string | null>(null);
  const [isLookingUpSku, setIsLookingUpSku] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formErrors, setFormErrors] = useState<ValidationError[]>([]);

  // Memoized calculations
  const totalPrice = useCallback(
    () => parseNumber(quantity) * parseNumber(unitPrice),
    [quantity, unitPrice],
  );

  const paidTotal = useCallback(
    () => parseNumber(paidCash) + parseNumber(paidOnline),
    [paidCash, paidOnline],
  );

  // Form validation
  const validateForm = useCallback(() => {
    const errors = validateSaleForm({
      customer,
      sku,
      quantity,
      unitPrice,
    });
    setFormErrors(errors);
    return errors.length === 0;
  }, [customer, sku, quantity, unitPrice]);

  // Real-time validation
  useEffect(() => {
    if (customer || sku || quantity || unitPrice) {
      validateForm();
    }
  }, [customer, sku, quantity, unitPrice, validateForm]);

  // Handle route params changes
  useEffect(() => {
    const params = route.params || {};
    const p = params.salePrefill || params;
    if (p) {
      if (typeof p.customer !== 'undefined') setCustomer(p.customer || '');
      if (typeof p.itemId !== 'undefined') setItemId(p.itemId || '');
      if (typeof p.sku !== 'undefined') setSku(p.sku || '');
      if (typeof p.name !== 'undefined') setName(p.name || '');
      if (typeof p.unitPrice !== 'undefined')
        setUnitPrice(p.unitPrice ? String(p.unitPrice) : '');
    }
  }, [route.params]);

  // Enhanced SKU lookup with better loading states
  useEffect(() => {
    let cancelled = false;
    setMatchedSkuName(null);
    setIsLookingUpSku(false);

    const skuValue = (sku || '').trim();
    if (!skuValue) {
      setItemId('');
      return;
    }

    setIsLookingUpSku(true);
    const timeoutId = setTimeout(async () => {
      try {
        const querySnapshot = await collection(firestore(), 'inventory')
          .where('sku', '==', skuValue)
          .limit(2)
          .get();

        if (cancelled) return;

        if (querySnapshot.size === 1) {
          const doc = querySnapshot.docs[0];
          const data = doc.data() as any;

          setMatchedSkuName(data.name || null);
          setItemId(doc.id);

          if (data.name && !name) setName(data.name);
          if (
            typeof data.unitPrice !== 'undefined' &&
            data.unitPrice !== null &&
            !unitPrice
          ) {
            setUnitPrice(String(data.unitPrice));
          }
        } else {
          setMatchedSkuName(null);
          setItemId('');
        }
      } catch (error) {
        console.error('SKU lookup error:', error);
        setMatchedSkuName(null);
        setItemId('');
      } finally {
        setIsLookingUpSku(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [sku, name, unitPrice]);

  // Enhanced sales fetching with better error handling
  const fetchTodaySales = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const snapshot = await collection(firestore(), 'sales')
          .where('createdAt', '>=', firestore.Timestamp.fromDate(todayStart()))
          .orderBy('createdAt', 'desc')
          .get();

        const salesData = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...(doc.data() as any),
        })) as Sale[];

        // Enrich with inventory data
        const itemIds = Array.from(
          new Set(salesData.map(sale => sale.itemId).filter(Boolean)),
        );
        const skus = Array.from(
          new Set(salesData.map(sale => sale.sku).filter(Boolean)),
        );

        const inventoryById: Record<string, any> = {};
        const inventoryBySku: Record<string, any> = {};

        // Fetch inventory by IDs
        if (itemIds.length > 0) {
          const inventoryDocs = await Promise.all(
            itemIds.map(id =>
              collection(firestore(), 'inventory').doc(id).get(),
            ),
          );

          inventoryDocs.forEach((docSnap: any) => {
            if (docSnap.exists()) {
              inventoryById[docSnap.id] = docSnap.data();
            }
          });
        }

        // Fetch inventory by SKUs
        if (skus.length > 0) {
          const skuQueries = await Promise.all(
            skus.map(skuValue =>
              collection(firestore(), 'inventory')
                .where('sku', '==', skuValue)
                .limit(1)
                .get(),
            ),
          );

          skuQueries.forEach((querySnapshot: any) => {
            if (!querySnapshot.empty) {
              const doc = querySnapshot.docs[0];
              const data = doc.data();
              if (data?.sku) {
                inventoryBySku[data.sku] = data;
              }
            }
          });
        }

        // Enrich sales with product names
        const enrichedSales = salesData.map(sale => ({
          ...sale,
          productName:
            (sale.itemId ? inventoryById[sale.itemId]?.name : undefined) ||
            (sale.sku ? inventoryBySku[sale.sku]?.name : undefined) ||
            sale.name ||
            sale.sku ||
            'Unknown Product',
        }));

        setSales(enrichedSales);
      } catch (error) {
        console.error('Error fetching sales:', error);
        toast.showToast('Failed to load sales data', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast],
  );

  // Initial load and focus refresh
  useEffect(() => {
    fetchTodaySales();
  }, [fetchTodaySales]);

  useFocusEffect(
    useCallback(() => {
      // On focus: always refresh today's sales.
      // If navigation provided a salePrefill (from ItemDetails), keep SKU/item fields
      // but reset customer and payment inputs so user can enter a fresh customer each time.
      const params = (route as any).params || {};
      const p = params.salePrefill || null;

      if (p) {
        // Keep product prefill but clear transactional/customer fields
        setItemId(p.itemId || '');
        setSku(p.sku || '');
        setName(p.name || '');
        setUnitPrice(p.unitPrice ? String(p.unitPrice) : '');

        // Clear per-visit fields
        setCustomer('');
        setQuantity('1');
        setPaidCash('');
        setPaidOnline('');
        setTransactionId('');
        setMatchedSkuName(null); // allow SKU lookup to re-run
        setFormErrors([]);
      } else {
        // No prefill: fully reset form on focus
        setCustomer('');
        setItemId('');
        setSku('');
        setName('');
        setUnitPrice('');
        setQuantity('1');
        setPaidCash('');
        setPaidOnline('');
        setTransactionId('');
        setMatchedSkuName(null);
        setFormErrors([]);
      }

      // Always refresh sales data
      fetchTodaySales();

      return () => {};
    }, [fetchTodaySales, route]),
  );

  // Enhanced sale handling with better feedback
  const handleAddSale = async () => {
    if (!validateForm()) {
      toast.showToast('Please fix the form errors', 'error');
      return;
    }

    setSaving(true);
    try {
      const quantityNum = parseNumber(quantity);
      const unitPriceNum = parseNumber(unitPrice);
      const totalPriceNum = quantityNum * unitPriceNum;
      const paidTotalNum = paidTotal();

      // Block any payments if SKU/item isn't matched to inventory
      const paymentsEditable = !!matchedSkuName || !!itemId;
      if (paidTotalNum > 0 && !paymentsEditable) {
        toast.showToast(
          'Payments require a matched SKU. Please confirm SKU or record sale as pending (0 paid).',
          'error',
        );
        setSaving(false);
        return;
      }

      // Build typed object but avoid sending undefined fields to Firestore
      const typed: Partial<Sale> = {
        itemId: itemId || null,
        sku: sku.trim(),
        name: name || null,
        customer: customer.trim(),
        quantity: quantityNum,
        unitPrice: unitPriceNum,
        totalPrice: totalPriceNum,
        paidCash: parseNumber(paidCash),
        paidOnline: parseNumber(paidOnline),
        // paymentPlatform intentionally omitted to avoid nullable mismatch
        transactionId: transactionId ? transactionId : undefined,
        paidAmount: paidTotalNum,
        remainingAmount: Math.max(0, totalPriceNum - paidTotalNum),
        status: getSaleStatus(totalPriceNum, paidTotalNum),
        createdAt: firestore.Timestamp.now(),
      };

      const saleData: Record<string, any> = {};
      Object.entries(typed).forEach(([k, v]) => {
        // convert explicit nulls through (keep nulls, remove undefined)
        if (typeof v !== 'undefined') saleData[k] = v;
      });

      // Add sale to Firestore
      await collection(firestore(), 'sales').add(saleData);

      // Update inventory if itemId exists
      if (itemId) {
        const itemRef = collection(firestore(), 'inventory').doc(itemId);
        await firestore().runTransaction(async transaction => {
          const itemDoc = await transaction.get(itemRef);
          if (itemDoc.exists()) {
            const currentQuantity = itemDoc.data()?.quantity || 0;
            const newQuantity = Math.max(0, currentQuantity - quantityNum);
            transaction.update(itemRef, { quantity: newQuantity });
          }
        });
      }

      // Reset form
      setQuantity('1');
      setPaidCash('');
      setPaidOnline('');
      setTransactionId('');
      setFormErrors([]);

      // Dismiss keyboard and refresh data
      Keyboard.dismiss();
      await fetchTodaySales();

      toast.showToast('Sale recorded successfully!', 'success');
    } catch (error) {
      console.error('Error adding sale:', error);
      toast.showToast('Failed to record sale. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    fetchTodaySales(true);
  }, [fetchTodaySales]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Sales Management</Text>
        <Text style={styles.pageSubtitle}>
          Record transactions and track today's performance
        </Text>
      </View>

      <FlatList
        data={sales}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <SaleItemComponent item={item} />}
        ListHeaderComponent={
          <>
            <StatsHeader sales={sales} />
            <SalesForm
              customer={customer}
              setCustomer={setCustomer}
              sku={sku}
              setSku={setSku}
              name={name}
              setName={setName}
              quantity={quantity}
              setQuantity={setQuantity}
              unitPrice={unitPrice}
              setUnitPrice={setUnitPrice}
              paidCash={paidCash}
              setPaidCash={setPaidCash}
              paidOnline={paidOnline}
              setPaidOnline={setPaidOnline}
              // compact: no explicit payment method; only cash/online amounts
              transactionId={transactionId}
              setTransactionId={setTransactionId}
              saving={saving}
              onSave={handleAddSale}
              totalPrice={totalPrice}
              paidTotal={paidTotal}
              matchedSkuName={matchedSkuName}
              isLookingUpSku={isLookingUpSku}
              errors={formErrors}
              itemId={itemId}
            />
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Today's Sales</Text>
                <Text style={styles.sectionSubtitle}>
                  {sales.length} transaction{sales.length !== 1 ? 's' : ''}{' '}
                  recorded
                </Text>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={loading ? LoadingComponent : EmptyStateComponent}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default SalesScreen;
