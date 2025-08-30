import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import {
  DashboardIcon,
  InventoryIcon,
  SettingsIcon,
} from '../components/Icons';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import InventoryScreen from '../screens/inventory/InventoryScreen';
import AddItemScreen from '../screens/inventory/AddItemScreen';
import ItemDetailsScreen from '../screens/inventory/ItemDetailsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import HowItWorksScreen from '../screens/settings/HowItWorksScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Icon components for tab bar
const DashboardTabIcon = ({
  color,
  focused,
}: {
  color: string;
  focused: boolean;
}) => (
  <DashboardIcon size={focused ? 26 : 24} color={color} focused={focused} />
);

const InventoryTabIconComponent = ({
  color,
  focused,
}: {
  color: string;
  focused: boolean;
}) => (
  <InventoryIcon size={focused ? 26 : 24} color={color} focused={focused} />
);

const SettingsTabIcon = ({
  color,
  focused,
}: {
  color: string;
  focused: boolean;
}) => <SettingsIcon size={focused ? 26 : 24} color={color} />;

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
      tabBarActiveTintColor: '#1E40AF',
      tabBarInactiveTintColor: '#6B7280',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 0.5,
        borderTopColor: '#E5E7EB',
        height: 88,
        paddingBottom: 12,
        paddingTop: 12,
        shadowColor: '#000000',
        shadowOffset: {
          width: 0,
          height: -4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 16,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 6,
        letterSpacing: 0.2,
      },
      tabBarIconStyle: {
        marginTop: 6,
      },
      tabBarItemStyle: {
        paddingVertical: 4,
      },
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{
        tabBarLabel: 'Dashboard',
        tabBarIcon: DashboardTabIcon,
      }}
    />
    <Tab.Screen
      name="Inventory"
      component={InventoryStack}
      options={{
        tabBarLabel: 'Inventory',
        tabBarIcon: InventoryTabIconComponent,
      }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsStack}
      options={{
        tabBarLabel: 'Settings',
        tabBarIcon: SettingsTabIcon,
      }}
    />
  </Tab.Navigator>
);

const InventoryStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      },
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
      },
      headerTintColor: '#2563EB',
    }}
  >
    <Stack.Screen
      name="InventoryList"
      component={InventoryScreen}
      options={{ title: 'Inventory' }}
    />
    <Stack.Screen
      name="AddItem"
      component={AddItemScreen}
      options={{
        title: 'Add Item',
        headerBackTitle: 'Back',
      }}
    />
    <Stack.Screen
      name="ItemDetails"
      component={ItemDetailsScreen}
      options={{
        title: 'Product Details',
        headerBackTitle: 'Back',
        headerStyle: {
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '700',
          color: '#1F2937',
        },
        headerTintColor: '#2563EB',
      }}
    />
  </Stack.Navigator>
);

const SettingsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      },
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
      },
      headerTintColor: '#2563EB',
    }}
  >
    <Stack.Screen
      name="SettingsList"
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
    <Stack.Screen
      name="HowItWorks"
      component={HowItWorksScreen}
      options={{
        title: 'How It Works',
        headerBackTitle: 'Back',
      }}
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
