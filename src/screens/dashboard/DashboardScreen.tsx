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
          color="#007AFF"
          onPress={() => navigation.navigate('Inventory')}
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStock}
          color="#FF9500"
          onPress={() =>
            navigation.navigate('Inventory', { filter: 'lowStock' })
          }
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStock}
          color="#FF3B30"
          onPress={() =>
            navigation.navigate('Inventory', { filter: 'outOfStock' })
          }
        />
        <StatCard
          title="Total Value"
          value={`$${stats.totalValue.toFixed(2)}`}
          color="#34C759"
          onPress={() => navigation.navigate('Reports')}
        />
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <QuickAction
        title="Add New Item"
        description="Add a new product to your inventory"
        onPress={() => navigation.navigate('Inventory', { screen: 'AddItem' })}
      />
      <QuickAction
        title="Scan Barcode"
        description="Quickly scan items for check-in/out"
        onPress={() => navigation.navigate('Scanner')}
      />
      <QuickAction
        title="View Reports"
        description="Analyze your inventory performance"
        onPress={() => navigation.navigate('Reports')}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 16,
    color: '#1a1a1a',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  actionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default DashboardScreen;
