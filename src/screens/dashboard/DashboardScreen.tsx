import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { getCollection, updateDocument } from '../../config/firebase';
import { useToast } from '../../components/ToastProvider';

const StatCard = ({ title, value, subtitle, color, onPress }: any) => (
  <TouchableOpacity
    style={[styles.statCard, { borderLeftColor: color }]}
    onPress={onPress}
  >
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value}</Text>
    {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
  </TouchableOpacity>
);

const DashboardScreen = ({ navigation }: any) => {
  const { user, signOut } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalUnpaid: 0,
  });
  const [_loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [supplierList, setSupplierList] = useState<
    { name: string; totalCost: number; paid: number; due: number }[]
  >([]);
  const [customerList, setCustomerList] = useState<
    { name: string; amount: number }[]
  >([]);
  const [activeTab, setActiveTab] = useState<'suppliers' | 'customers'>(
    'suppliers',
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentModalType, setPaymentModalType] = useState<
    'supplier' | 'customer' | null
  >(null);
  const [paymentModalName, setPaymentModalName] = useState<string>('');
  const [paymentModalDue, setPaymentModalDue] = useState<number>(0);
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');
  const [_processingPayment, setProcessingPayment] = useState(false);

  // Load dashboard data (hoisted function so effects can call it)
  async function loadDashboardData(showRefreshing = false) {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      // Inventory aggregations
      const inventoryResult = await getCollection('inventory');
      const inventory =
        inventoryResult.success && inventoryResult.data
          ? (inventoryResult.data as any[])
          : [];

      const totalItems = inventory.length;
      const lowStock = inventory.filter(
        (item: any) =>
          Number(item.quantity || 0) <= Number(item.minStockLevel || 0),
      ).length;
      const outOfStock = inventory.filter(
        (item: any) => Number(item.quantity || 0) === 0,
      ).length;
      const totalValue = inventory.reduce((sum: number, item: any) => {
        const q = Number(item.quantity || 0);
        const p = Number(item.unitPrice || 0);
        return sum + q * p;
      }, 0);

      // Supplier aggregation: total cost, total paid, due
      const supplierTotals: Record<
        string,
        { totalCost: number; paid: number; due: number }
      > = {};
      inventory.forEach((item: any) => {
        const supplier = item.supplier ? String(item.supplier) : 'Unknown';
        const paid = Number((item as any).supplierPaid || 0);
        const totalCost = Number(
          (item as any).supplierTotalCost ||
            Number((item as any).unitCost || 0) *
              Number((item as any).quantity || 0),
        );
        const rawDue = totalCost - paid;
        const due = rawDue > 0 ? rawDue : 0;
        if (!supplierTotals[supplier])
          supplierTotals[supplier] = { totalCost: 0, paid: 0, due: 0 };
        supplierTotals[supplier].totalCost += totalCost;
        supplierTotals[supplier].paid += paid;
        supplierTotals[supplier].due += due;
      });

      // Sales aggregations
      const salesResult = await getCollection('sales');
      const sales =
        salesResult.success && salesResult.data
          ? (salesResult.data as any[])
          : [];
      const totalSales = sales.length;
      const totalRevenue = sales.reduce(
        (sum: number, s: any) => sum + Number(s.totalPrice || 0),
        0,
      );
      const totalUnpaid = sales.reduce((sum: number, s: any) => {
        const paid = Number(
          s.paidAmount || Number(s.paidCash || 0) + Number(s.paidOnline || 0),
        );
        const remaining = Math.max(0, Number(s.totalPrice || 0) - paid);
        return sum + remaining;
      }, 0);

      // Per-customer outstanding aggregation
      const customerTotals: Record<string, number> = {};
      sales.forEach((s: any) => {
        const customer = s.customer ? String(s.customer) : 'Unknown';
        const paid = Number(
          s.paidAmount || Number(s.paidCash || 0) + Number(s.paidOnline || 0),
        );
        const remaining = Math.max(0, Number(s.totalPrice || 0) - paid);
        if (remaining > 0) {
          customerTotals[customer] =
            (customerTotals[customer] || 0) + remaining;
        }
      });

      setStats({
        totalItems,
        lowStock,
        outOfStock,
        totalValue,
        totalSales,
        totalRevenue,
        totalUnpaid,
      });

      setSupplierList(
        Object.entries(supplierTotals).map(([name, v]) => ({
          name,
          totalCost: v.totalCost || 0,
          paid: v.paid || 0,
          due: v.due || 0,
        })),
      );
      setCustomerList(
        Object.entries(customerTotals).map(([name, amount]) => ({
          name,
          amount,
        })),
      );
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Reload fresh data every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, []),
  );

  const openSupplierModal = (s: {
    name: string;
    totalCost: number;
    paid: number;
    due: number;
  }) => {
    setPaymentModalType('supplier');
    setPaymentModalName(s.name);
    setPaymentModalDue(Number(s.due || 0));
    setPaymentAmountInput('');
    setPaymentModalVisible(true);
  };

  const openCustomerModal = (c: { name: string; amount: number }) => {
    setPaymentModalType('customer');
    setPaymentModalName(c.name);
    setPaymentModalDue(Number(c.amount || 0));
    setPaymentAmountInput('');
    setPaymentModalVisible(true);
  };

  const parseAmount = (v: string) => {
    const cleaned = String(v).replace(/[^0-9.-]+/g, '');
    const n = Number(cleaned);
    return isNaN(n) ? 0 : n;
  };

  const formattedInput = (v: string) => {
    const n = parseAmount(v);
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
      }).format(n || 0);
    } catch (e) {
      return `PKR ${n}`;
    }
  };

  const processSupplierPayment = async () => {
    const amount = parseAmount(paymentAmountInput);
    if (amount <= 0) {
      toast.showToast('Enter a payment greater than 0', 'warning');
      return;
    }
    // Ensure user is authenticated
    if (!user) {
      toast.showToast('Please sign in to record payments.', 'error');
      return;
    }

    setProcessingPayment(true);
    try {
      // fetch all inventory for this supplier
      const inventoryResult = await getCollection('inventory');
      const items =
        inventoryResult.success && inventoryResult.data
          ? (inventoryResult.data as any[])
          : [];
      const supplierItems = items.filter(
        (it: any) => (it.supplier || 'Unknown') === paymentModalName,
      );

      let remaining = amount;
      // sort by createdAt if available (oldest first)
      supplierItems.sort((a: any, b: any) => {
        const ta = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
        const tb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
        return ta - tb;
      });

      for (const item of supplierItems) {
        if (remaining <= 0) break;
        const totalCost = Number(
          item.supplierTotalCost ||
            Number(item.unitCost || 0) * Number(item.quantity || 0),
        );
        const paid = Number(item.supplierPaid || 0);
        const due = Math.max(0, totalCost - paid);
        if (due <= 0) continue;
        const apply = Math.min(due, remaining);
        const newPaid = paid + apply;
        // update document
        const res = await updateDocument('inventory', item.id, {
          supplierPaid: newPaid,
        });
        if (!res.success) {
          // show error and stop further updates
          toast.showToast(
            'Failed to update inventory item. Check permissions.',
            'error',
          );
          break;
        }
        remaining -= apply;
      }

      setPaymentModalVisible(false);
      // refresh data to reflect changes
      await loadDashboardData();
      toast.showToast(
        `Recorded payment of ${formatPKR(
          amount - remaining,
        )} to ${paymentModalName}`,
        'success',
      );
    } catch (error) {
      console.error('Supplier payment error:', error);
      toast.showToast('Failed to process supplier payment', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  const processCustomerPayment = async () => {
    const amount = parseAmount(paymentAmountInput);
    if (amount <= 0) {
      toast.showToast('Enter a payment greater than 0', 'warning');
      return;
    }
    // Ensure user is authenticated
    if (!user) {
      toast.showToast('Please sign in to record payments.', 'error');
      return;
    }

    setProcessingPayment(true);
    try {
      // fetch sales for this customer
      const salesResult = await getCollection('sales');
      const sales =
        salesResult.success && salesResult.data
          ? (salesResult.data as any[])
          : [];
      let custSales = sales.filter(
        (s: any) => (s.customer || 'Unknown') === paymentModalName,
      );
      // compute remaining per sale
      custSales = custSales
        .map((s: any) => ({
          ...s,
          remaining: Math.max(
            0,
            Number(
              s.remainingAmount ??
                Number(s.totalPrice || 0) -
                  Number(
                    s.paidAmount ||
                      Number(s.paidCash || 0) + Number(s.paidOnline || 0),
                  ),
            ),
          ),
        }))
        .filter((s: any) => s.remaining > 0);

      // sort by createdAt asc
      custSales.sort((a: any, b: any) => {
        const ta = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
        const tb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
        return ta - tb;
      });

      let remaining = amount;
      let updated = 0;
      let skipped = 0;
      for (const sale of custSales) {
        if (remaining <= 0) break;
        // skip sales not owned by current user to avoid permission-denied
        // Sales documents store the creator in `createdBy` (see SalesScreen.handleAddSale)
        if (sale.createdBy && sale.createdBy !== user?.uid) {
          skipped++;
          continue;
        }
        const rem = (sale as any).remaining;
        const apply = Math.min(rem, remaining);
        const newPaid = Number((sale as any).paidAmount || 0) + apply;
        const newRemaining = Math.max(
          0,
          Number((sale as any).totalPrice || 0) - newPaid,
        );
        const newStatus =
          newRemaining <= 0 ? 'completed' : newPaid > 0 ? 'partial' : 'pending';
        const res = await updateDocument('sales', sale.id, {
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newStatus,
          updatedAt: firestore.Timestamp.now(),
        });
        if (!res.success) {
          toast.showToast(
            'Failed to update a sale. Check permissions.',
            'error',
          );
          break;
        }
        updated++;
        remaining -= apply;
      }

      setPaymentModalVisible(false);
      await loadDashboardData();
      if (updated > 0)
        toast.showToast(
          `Recorded ${formatPKR(amount - remaining)} from ${paymentModalName}`,
          'success',
        );
      if (skipped > 0)
        toast.showToast(
          `${skipped} sale(s) skipped (not owned by you)`,
          'info',
        );
    } catch (error) {
      console.error('Customer payment error:', error);
      toast.showToast('Failed to process customer payment', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatPKR = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
      }).format(amount || 0);
    } catch (e) {
      return `PKR ${amount}`;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadDashboardData(true)}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome,</Text>
          <Text style={styles.username}>{user?.displayName || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats (compact boxes only) */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Items"
          value={String(stats.totalItems)}
          subtitle={`${stats.totalSales} sales`}
          color="#2563EB"
          onPress={() => navigation.navigate('Inventory')}
        />
        <StatCard
          title="Stock Value"
          value={formatPKR(stats.totalValue)}
          subtitle={`Unpaid: ${formatPKR(stats.totalUnpaid)}`}
          color="#059669"
        />
        <StatCard
          title="Low Stock"
          value={String(stats.lowStock)}
          color="#D97706"
          onPress={() =>
            navigation.navigate('Inventory', { filter: 'lowStock' })
          }
        />
        <StatCard
          title="Out of Stock"
          value={String(stats.outOfStock)}
          color="#DC2626"
          onPress={() =>
            navigation.navigate('Inventory', { filter: 'outOfStock' })
          }
        />
        <StatCard
          title="Revenue"
          value={formatPKR(stats.totalRevenue)}
          subtitle={`${stats.totalSales} tx`}
          color="#0EA5A4"
        />
        <StatCard
          title="Outstanding"
          value={formatPKR(stats.totalUnpaid)}
          color="#EF4444"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'suppliers' && styles.activeTab]}
          onPress={() => setActiveTab('suppliers')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'suppliers' && styles.activeTabText,
            ]}
          >
            Suppliers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'customers' && styles.activeTab]}
          onPress={() => setActiveTab('customers')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'customers' && styles.activeTabText,
            ]}
          >
            Customers
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search bar for filtering suppliers/customers */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={'Search by name...'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery ? (
          <TouchableOpacity
            style={styles.searchClear}
            onPress={() => setSearchQuery('')}
            accessibilityLabel="Clear search"
          >
            <Text style={styles.searchClearText}>×</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Balances */}
      <View style={styles.listWrapper}>
        {activeTab === 'suppliers' && supplierList.length > 0 && (
          <View style={styles.listBoxCompact}>
            {supplierList
              .filter(s =>
                s.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
              )
              .map(s => (
                <TouchableOpacity
                  key={s.name}
                  style={styles.listRowCompact}
                  onPress={() => openSupplierModal(s)}
                >
                  <View style={styles.listRowContent}>
                    <Text style={styles.listRowTitleCompact}>{s.name}</Text>
                    <Text style={styles.smallRowMeta}>
                      Total {formatPKR(s.totalCost)} · Paid {formatPKR(s.paid)}
                    </Text>
                  </View>
                  <View style={styles.listRowRight}>
                    <Text style={styles.listRowLabelCompact}>Due</Text>
                    <Text
                      style={[
                        styles.listRowAmountCompact,
                        s.due > 0 ? styles.dueColor : styles.settledColor,
                      ]}
                    >
                      {formatPKR(s.due)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {activeTab === 'customers' && customerList.length > 0 && (
          <View style={styles.listBoxCompact}>
            {customerList
              .filter(c =>
                c.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
              )
              .map(c => (
                <TouchableOpacity
                  key={c.name}
                  style={styles.listRowCompact}
                  onPress={() => openCustomerModal(c)}
                >
                  <View style={styles.listRowContent}>
                    <Text style={styles.listRowTitleCompact}>{c.name}</Text>
                    <Text style={styles.smallRowMeta}>Outstanding</Text>
                  </View>
                  <View style={styles.listRowRight}>
                    <Text style={styles.listRowLabelCompact}>Owed</Text>
                    <Text
                      style={[
                        styles.listRowAmountCompact,
                        c.amount > 0 ? styles.owedColor : styles.settledColor,
                      ]}
                    >
                      {formatPKR(c.amount)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}
      </View>
      {/* Payment Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {paymentModalType === 'supplier'
                ? 'Record Supplier Payment'
                : 'Record Customer Payment'}
            </Text>
            <Text style={styles.modalSubtitle}>{paymentModalName}</Text>
            <Text style={styles.modalDue}>
              Remaining: {formatPKR(paymentModalDue)}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder={formattedInput(paymentAmountInput) || 'Amount'}
              value={paymentAmountInput}
              onChangeText={setPaymentAmountInput}
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  _processingPayment
                    ? styles.modalBtnDisabled
                    : styles.modalBtn,
                  styles.modalCancel,
                ]}
                onPress={() => setPaymentModalVisible(false)}
                disabled={_processingPayment}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  _processingPayment
                    ? styles.modalBtnDisabled
                    : styles.modalBtn,
                  styles.modalConfirm,
                ]}
                onPress={() =>
                  paymentModalType === 'supplier'
                    ? processSupplierPayment()
                    : processCustomerPayment()
                }
                disabled={_processingPayment}
              >
                <Text style={styles.modalBtnTextLight}>
                  {_processingPayment ? 'Processing...' : 'Apply'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    elevation: 2,
  },
  greeting: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    elevation: 2,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 12,
    marginBottom: 12,
    color: '#1F2937',
  },
  statsGrid: {
    paddingHorizontal: 8,
    marginBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '600',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    elevation: 2,
    flex: 1,
    minWidth: '30%',
    minHeight: 64,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  // ... compact stat card styles (no icon)
  statTitle: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
  },
  listWrapper: {
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  listBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    elevation: 1,
  },
  listBoxCompact: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 6,
    elevation: 1,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  listRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  listRowContent: {
    flex: 1,
  },
  listRowRight: {
    alignItems: 'flex-end',
  },
  listRowTitle: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  listRowAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  listRowTitleCompact: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },
  smallRowMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  listRowLabelCompact: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  listRowAmountCompact: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dueColor: {
    color: '#DC2626',
  },
  owedColor: {
    color: '#059669',
  },
  settledColor: {
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  modalDue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 12,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  modalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  modalBtnDisabled: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    opacity: 0.6,
  },
  modalCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalConfirm: {
    backgroundColor: '#059669',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  modalBtnTextLight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Search bar
  searchWrapper: {
    marginHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  searchClear: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  searchClearText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#6B7280',
  },
});

export default DashboardScreen;
