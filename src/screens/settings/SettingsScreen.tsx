import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ToastProvider';

const SettingItem = ({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
  </TouchableOpacity>
);

const SettingsScreen = () => {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error('Logout error:', error);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Manage your account and app preferences
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingItem
          title="Profile"
          subtitle={user?.email || 'Manage your profile information'}
        />
        <SettingItem
          title="Change Password"
          subtitle="Update your account password"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inventory</Text>
        <SettingItem title="Categories" subtitle="Manage product categories" />
        <SettingItem title="Suppliers" subtitle="Manage supplier information" />
        <SettingItem title="Locations" subtitle="Configure storage locations" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingItem
          title="Stock Alerts"
          subtitle="Configure low stock notifications"
        />
        <SettingItem
          title="Email Notifications"
          subtitle="Manage email preferences"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <SettingItem
          title="Export Data"
          subtitle="Export your inventory data"
        />
        <SettingItem
          title="Import Data"
          subtitle="Import inventory from file"
        />
        <SettingItem
          title="Backup & Sync"
          subtitle="Manage data backup settings"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <SettingItem title="About" subtitle="App version and information" />
        <SettingItem
          title="Help & Support"
          subtitle="Get help and contact support"
        />
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginTop: 20,
    backgroundColor: 'white',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
