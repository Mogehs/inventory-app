import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { getCollection } from '../../config/firebase';

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

  const [supplierList, setSupplierList] = useState<
    { name: string; amount: number }[]
  >([]);
  const [customerList, setCustomerList] = useState<
    { name: string; amount: number }[]
  >([]);
  const [activeTab, setActiveTab] = useState<'suppliers' | 'customers'>(
    'suppliers',
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Inventory aggregations
      const inventoryResult = await getCollection('inventory');
      const inventory =
        inventoryResult.success && inventoryResult.data
          ? inventoryResult.data
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

      // Supplier dues aggregation
      const supplierTotals: Record<string, number> = {};
      inventory.forEach((item: any) => {
        const supplier = item.supplier ? String(item.supplier) : 'Unknown';
        const supplierPaid = Number(item.supplierPaid || 0);
        const supplierTotalCost = Number(
          item.supplierTotalCost ||
            Number(item.unitCost || 0) * Number(item.quantity || 0),
        );
        const rawDue = supplierTotalCost - supplierPaid;
        const due = rawDue > 0 ? rawDue : 0;
        if (due > 0) {
          supplierTotals[supplier] = (supplierTotals[supplier] || 0) + due;
        }
      });

      // Sales aggregations
      const salesResult = await getCollection('sales');
      const sales =
        salesResult.success && salesResult.data ? salesResult.data : [];
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
        Object.entries(supplierTotals).map(([name, amount]) => ({
          name,
          amount,
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
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.username}>{user?.displayName || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Overview</Text>
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

      {/* Balances */}
      <View style={styles.listWrapper}>
        {activeTab === 'suppliers' && supplierList.length > 0 && (
          <View style={styles.listBox}>
            {supplierList.map(s => (
              <View key={s.name} style={styles.listRow}>
                <View>
                  <Text style={styles.listRowTitle}>{s.name}</Text>
                  <Text style={styles.listRowLabel}>Due</Text>
                </View>
                <Text
                  style={[
                    styles.listRowAmount,
                    s.amount > 0 ? styles.dueColor : styles.settledColor,
                  ]}
                >
                  {formatPKR(s.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'customers' && customerList.length > 0 && (
          <View style={styles.listBox}>
            {customerList.map(c => (
              <View key={c.name} style={styles.listRow}>
                <View>
                  <Text style={styles.listRowTitle}>{c.name}</Text>
                  <Text style={styles.listRowLabel}>Owed</Text>
                </View>
                <Text
                  style={[
                    styles.listRowAmount,
                    c.amount > 0 ? styles.owedColor : styles.settledColor,
                  ]}
                >
                  {formatPKR(c.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
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
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
    elevation: 4,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  username: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 3,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginHorizontal: 24,
    marginBottom: 20,
    color: '#1F2937',
  },
  statsGrid: {
    paddingHorizontal: 24,
    marginBottom: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '600',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 4,
    flex: 1,
    minWidth: '45%',
  },
  statTitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 8,
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
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  listBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  listRowTitle: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  listRowAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  listRowLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
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
});

export default DashboardScreen;
