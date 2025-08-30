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

const StatCard = ({ title, value, color, onPress }: any) => (
  <TouchableOpacity
    style={[styles.statCard, { borderLeftColor: color }]}
    onPress={onPress}
  >
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </TouchableOpacity>
);

const QuickAction = ({ title, description, onPress }: any) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress}>
    <Text style={styles.actionTitle}>{title}</Text>
    <Text style={styles.actionDescription}>{description}</Text>
  </TouchableOpacity>
);

const DashboardScreen = ({ navigation }: any) => {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  });
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const inventoryResult = await getCollection('inventory');
      if (inventoryResult.success && inventoryResult.data) {
        const items = inventoryResult.data;
        const totalItems = items.length;
        const lowStock = items.filter(
          (item: any) => item.quantity <= item.minStockLevel,
        ).length;
        const outOfStock = items.filter(
          (item: any) => item.quantity === 0,
        ).length;
        const totalValue = items.reduce(
          (sum: number, item: any) => sum + item.quantity * item.unitPrice,
          0,
        );

        setStats({
          totalItems,
          lowStock,
          outOfStock,
          totalValue,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
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
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.username}>{user?.displayName || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Items"
          value={stats.totalItems}
          color="#2563EB"
          onPress={() => navigation.navigate('Inventory')}
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStock}
          color="#D97706"
          onPress={() =>
            navigation.navigate('Inventory', { filter: 'lowStock' })
          }
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStock}
          color="#DC2626"
          onPress={() =>
            navigation.navigate('Inventory', { filter: 'outOfStock' })
          }
        />
        <StatCard
          title="Total Value"
          value={`$${stats.totalValue.toFixed(2)}`}
          color="#059669"
        />
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <QuickAction
        title="Add New Item"
        description="Add a new product to your inventory"
        onPress={() => navigation.navigate('Inventory', { screen: 'AddItem' })}
      />
      <QuickAction
        title="View Inventory"
        description="Browse and manage your inventory items"
        onPress={() => navigation.navigate('Inventory')}
      />
      <QuickAction
        title="Settings"
        description="Manage your account and app preferences"
        onPress={() => navigation.navigate('Settings')}
      />
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
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
    shadowColor: '#DC2626',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    letterSpacing: -0.3,
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  actionCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  actionDescription: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default DashboardScreen;
