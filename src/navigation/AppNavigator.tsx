import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';

// Import screens (we'll create these next)
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import InventoryScreen from '../screens/inventory/InventoryScreen';
import AddItemScreen from '../screens/inventory/AddItemScreen';
import ScannerScreen from '../screens/scanner/ScannerScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: '#8E8E93',
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{
        tabBarLabel: 'Dashboard',
        // tabBarIcon: ({ color, size }) => (
        //   <Icon name="dashboard" size={size} color={color} />
        // ),
      }}
    />
    <Tab.Screen
      name="Inventory"
      component={InventoryStack}
      options={{
        tabBarLabel: 'Inventory',
        // tabBarIcon: ({ color, size }) => (
        //   <Icon name="inventory" size={size} color={color} />
        // ),
      }}
    />
    <Tab.Screen
      name="Scanner"
      component={ScannerScreen}
      options={{
        tabBarLabel: 'Scanner',
        // tabBarIcon: ({ color, size }) => (
        //   <Icon name="qr-code-scanner" size={size} color={color} />
        // ),
      }}
    />
    <Tab.Screen
      name="Reports"
      component={ReportsScreen}
      options={{
        tabBarLabel: 'Reports',
        // tabBarIcon: ({ color, size }) => (
        //   <Icon name="bar-chart" size={size} color={color} />
        // ),
      }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        tabBarLabel: 'Settings',
        // tabBarIcon: ({ color, size }) => (
        //   <Icon name="settings" size={size} color={color} />
        // ),
      }}
    />
  </Tab.Navigator>
);

const InventoryStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="InventoryList"
      component={InventoryScreen}
      options={{ title: 'Inventory' }}
    />
    <Stack.Screen
      name="AddItem"
      component={AddItemScreen}
      options={{ title: 'Add Item' }}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // or a loading screen
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
