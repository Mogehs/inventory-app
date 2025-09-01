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
  StatusBar,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { getCollection, updateDocument } from '../../config/firebase';
import { useToast } from '../../components/ToastProvider';

// Compact Metric Card Component
const MetricCard = ({ title, value, subtitle, color, onPress, icon }: any) => (
  <TouchableOpacity
    style={[styles.metricCard, { borderTopColor: color }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.metricHeader}>
      <Text style={styles.metricIcon}>{icon}</Text>
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricTitle}>{title}</Text>
    {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
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
  const [processingPayment, setProcessingPayment] = useState(false);

  // Load dashboard data
  const loadDashboardData = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);

        // Inventory aggregations
        const inventoryResult = await getCollection('inventory', {
          ownerOnly: true,
        });
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

        // Supplier aggregation
        const supplierTotals: Record<
          string,
          { totalCost: number; paid: number; due: number }
        > = {};
        inventory.forEach((item: any) => {
          const supplier = item.supplier ? String(item.supplier) : 'Unknown';
          const paid = Number(item.supplierPaid || 0);
          const totalCost = Number(
            item.supplierTotalCost ||
              Number(item.unitCost || 0) * Number(item.quantity || 0),
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
        const salesResult = await getCollection('sales', { ownerOnly: true });
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

        // Customer outstanding aggregation
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
          Object.entries(supplierTotals)
            .map(([name, v]) => ({
              name,
              totalCost: v.totalCost || 0,
              paid: v.paid || 0,
              due: v.due || 0,
            }))
            .filter(supplier => supplier.due > 0),
        );
        setCustomerList(
          Object.entries(customerTotals).map(([name, amount]) => ({
            name,
            amount,
          })),
        );
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.showToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData]),
  );

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(0);
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
      toast.showToast('Logged out successfully', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      toast.showToast('Failed to logout', 'error');
    }
  };

  const openPaymentModal = (type: 'supplier' | 'customer', item: any) => {
    setPaymentModalType(type);
    setPaymentModalName(item.name);
    setPaymentModalDue(type === 'supplier' ? item.due : item.amount);
    setPaymentAmountInput('');
    setPaymentModalVisible(true);
  };

  const processPayment = async () => {
    const amount = Number(paymentAmountInput.replace(/[^0-9.]/g, ''));
    if (amount <= 0) {
      toast.showToast('Enter a valid amount', 'warning');
      return;
    }

    if (!user) {
      toast.showToast('Please sign in to record payments', 'error');
      return;
    }

    setProcessingPayment(true);
    try {
      if (paymentModalType === 'supplier') {
        await processSupplierPayment(amount);
      } else {
        await processCustomerPayment(amount);
      }
      setPaymentModalVisible(false);
      await loadDashboardData();
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.showToast('Failed to process payment', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  const processSupplierPayment = async (amount: number) => {
    const inventoryResult = await getCollection('inventory', {
      ownerOnly: true,
    });
    const items =
      inventoryResult.success && inventoryResult.data
        ? (inventoryResult.data as any[])
        : [];
    const supplierItems = items.filter(
      (it: any) => (it.supplier || 'Unknown') === paymentModalName,
    );

    let remaining = amount;
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
      const res = await updateDocument('inventory', item.id, {
        supplierPaid: newPaid,
      });
      if (!res.success) {
        toast.showToast('Failed to update inventory item', 'error');
        break;
      }
      remaining -= apply;
    }

    toast.showToast(
      `Recorded payment of ${formatPKR(
        amount - remaining,
      )} to ${paymentModalName}`,
      'success',
    );
  };

  const processCustomerPayment = async (amount: number) => {
    const salesResult = await getCollection('sales', { ownerOnly: true });
    const sales =
      salesResult.success && salesResult.data
        ? (salesResult.data as any[])
        : [];
    let custSales = sales.filter(
      (s: any) => (s.customer || 'Unknown') === paymentModalName,
    );

    custSales = custSales
      .map((s: any) => ({
        ...s,
        remaining: Math.max(
          0,
          Number(
            s.remainingAmount ??
              Number(s.totalPrice || 0) - Number(s.paidAmount || 0),
          ),
        ),
      }))
      .filter((s: any) => s.remaining > 0);

    custSales.sort((a: any, b: any) => {
      const ta = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
      const tb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
      return ta - tb;
    });

    let remaining = amount;
    for (const sale of custSales) {
      if (remaining <= 0) break;
      if (sale.createdBy && sale.createdBy !== user?.uid) continue;
      const rem = sale.remaining;
      const apply = Math.min(rem, remaining);
      const newPaid = Number(sale.paidAmount || 0) + apply;
      const newRemaining = Math.max(0, Number(sale.totalPrice || 0) - newPaid);
      const newStatus =
        newRemaining <= 0 ? 'completed' : newPaid > 0 ? 'partial' : 'pending';
      const res = await updateDocument('sales', sale.id, {
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        status: newStatus,
        updatedAt: new Date(),
      });
      if (!res.success) {
        toast.showToast('Failed to update sale', 'error');
        break;
      }
      remaining -= apply;
    }

    toast.showToast(
      `Recorded ${formatPKR(amount - remaining)} from ${paymentModalName}`,
      'success',
    );
  };

  const filteredSuppliers = supplierList.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredCustomers = customerList.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
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
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {(user?.displayName || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.greeting}>
                Good{' '}
                {new Date().getHours() < 12
                  ? 'Morning'
                  : new Date().getHours() < 18
                  ? 'Afternoon'
                  : 'Evening'}
              </Text>
              <Text style={styles.username}>{user?.displayName || 'User'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Exit</Text>
          </TouchableOpacity>
        </View>

        {/* Compact Metrics Grid */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Items"
              value={formatCurrency(stats.totalItems)}
              icon="📦"
              color="#3B82F6"
              onPress={() => navigation.navigate('Inventory')}
            />
            <MetricCard
              title="Value"
              value={`₨${formatCurrency(stats.totalValue)}`}
              icon="💰"
              color="#10B981"
            />
            <MetricCard
              title="Low Stock"
              value={formatCurrency(stats.lowStock)}
              icon="⚠️"
              color="#F59E0B"
              onPress={() =>
                navigation.navigate('Inventory', { filter: 'lowStock' })
              }
            />
            <MetricCard
              title="Out Stock"
              value={formatCurrency(stats.outOfStock)}
              icon="🚫"
              color="#EF4444"
              onPress={() =>
                navigation.navigate('Inventory', { filter: 'outOfStock' })
              }
            />
            <MetricCard
              title="Sales"
              value={formatCurrency(stats.totalSales)}
              icon="📊"
              color="#8B5CF6"
              onPress={() => navigation.navigate('Sales')}
            />
            <MetricCard
              title="Revenue"
              value={`₨${formatCurrency(stats.totalRevenue)}`}
              icon="💵"
              color="#06B6D4"
            />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
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
              Suppliers ({supplierList.length})
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
              Customers ({customerList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Lists */}
        <View style={styles.listContainer}>
          {activeTab === 'suppliers' && (
            <>
              {filteredSuppliers.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyText}>No suppliers found</Text>
                </View>
              ) : (
                filteredSuppliers.map((supplier, index) => (
                  <TouchableOpacity
                    key={supplier.name}
                    style={[
                      styles.listItem,
                      index === filteredSuppliers.length - 1 && styles.lastItem,
                    ]}
                    onPress={() => openPaymentModal('supplier', supplier)}
                  >
                    <View style={styles.listItemLeft}>
                      <Text style={styles.listItemTitle}>{supplier.name}</Text>
                      <Text style={styles.listItemSubtitle}>
                        Total: {formatPKR(supplier.totalCost)} • Paid:{' '}
                        {formatPKR(supplier.paid)}
                      </Text>
                    </View>
                    <View style={styles.listItemRight}>
                      <Text style={styles.listItemLabel}>Due</Text>
                      <Text
                        style={[
                          styles.listItemAmount,
                          supplier.due > 0
                            ? styles.dueAmount
                            : styles.paidAmount,
                        ]}
                      >
                        {formatPKR(supplier.due)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {activeTab === 'customers' && (
            <>
              {filteredCustomers.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>👥</Text>
                  <Text style={styles.emptyText}>No outstanding customers</Text>
                </View>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <TouchableOpacity
                    key={customer.name}
                    style={[
                      styles.listItem,
                      index === filteredCustomers.length - 1 && styles.lastItem,
                    ]}
                    onPress={() => openPaymentModal('customer', customer)}
                  >
                    <View style={styles.listItemLeft}>
                      <Text style={styles.listItemTitle}>{customer.name}</Text>
                      <Text style={styles.listItemSubtitle}>
                        Outstanding amount
                      </Text>
                    </View>
                    <View style={styles.listItemRight}>
                      <Text style={styles.listItemLabel}>Owed</Text>
                      <Text style={[styles.listItemAmount, styles.owedAmount]}>
                        {formatPKR(customer.amount)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
        </View>

        {/* Payment Modal */}
        <Modal visible={paymentModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Record{' '}
                  {paymentModalType === 'supplier' ? 'Supplier' : 'Customer'}{' '}
                  Payment
                </Text>
                <TouchableOpacity
                  onPress={() => setPaymentModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                <Text style={styles.modalSubtitle}>{paymentModalName}</Text>
                <Text style={styles.modalAmount}>
                  {paymentModalType === 'supplier'
                    ? 'Amount Due'
                    : 'Amount Owed'}
                  : {formatPKR(paymentModalDue)}
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Payment Amount</Text>
                  <TextInput
                    style={styles.paymentInput}
                    placeholder="0"
                    value={paymentAmountInput}
                    onChangeText={setPaymentAmountInput}
                    keyboardType="numeric"
                    autoFocus
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setPaymentModalVisible(false)}
                  disabled={processingPayment}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={processPayment}
                  disabled={processingPayment}
                >
                  <Text style={styles.confirmButtonText}>
                    {processingPayment ? 'Processing...' : 'Record Payment'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1F2937',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Metrics Styles
  metricsContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    minHeight: 80,
    flex: 1,
    minWidth: '30%',
    maxWidth: '32%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderTopWidth: 3,
    marginBottom: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  metricTitle: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // Tabs Styles
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#1E293B',
  },

  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    fontSize: 16,
    color: '#9CA3AF',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  clearButton: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '600',
    paddingHorizontal: 8,
  },

  // List Styles
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    elevation: 1,
  },
  lastItem: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  listItemLeft: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listItemLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  listItemAmount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dueAmount: {
    color: '#EF4444',
  },
  owedAmount: {
    color: '#10B981',
  },
  paidAmount: {
    color: '#6B7280',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 1,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalAmount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  paymentInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DashboardScreen;
