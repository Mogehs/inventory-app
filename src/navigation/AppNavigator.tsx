import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import {
  DashboardIcon,
  InventoryIcon,
  SettingsIcon,
  SalesIcon,
  AddIcon,
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
import SalesPlaceholder from '../screens/sales/SalesPlaceholder';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Wrapper components for icons
const DashboardTabIcon = ({ color, focused }: any) => (
  <DashboardIcon size={focused ? 26 : 24} color={color} focused={focused} />
);

const InventoryTabIcon = ({ color, focused }: any) => (
  <InventoryIcon size={focused ? 26 : 24} color={color} focused={focused} />
);

const SettingsTabIcon = ({ color, focused }: any) => (
  <SettingsIcon size={focused ? 26 : 24} color={color} focused={focused} />
);

const SalesTabIcon = ({ color, focused }: any) => (
  <SalesIcon size={focused ? 26 : 24} color={color} focused={focused} />
);

const AddTabIcon = ({ color, focused }: any) => (
  <AddIcon size={focused ? 28 : 26} color={color} focused={focused} />
);

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
      tabBarActiveTintColor: '#2563EB',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 0,
        height: 64,
        paddingBottom: 6,
        paddingTop: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 6,
      },
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 2,
        letterSpacing: 0.2,
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
        tabBarIcon: InventoryTabIcon,
      }}
    />
    <Tab.Screen
      name="AddItem"
      component={AddItemScreen}
      options={{
        tabBarLabel: 'Add',
        tabBarIcon: AddTabIcon,
      }}
    />
    <Tab.Screen
      name="Sales"
      component={SalesPlaceholder}
      options={{
        tabBarLabel: 'Sales',
        tabBarIcon: SalesTabIcon,
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
        shadowOffset: { width: 0, height: 2 },
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
      component={ItemDetailsWrapper}
      options={{
        title: 'Product Details',
        headerBackTitle: 'Back',
      }}
    />
  </Stack.Navigator>
);

// Wrapper to pass props properly
const ItemDetailsWrapper = (props: any) => {
  return <ItemDetailsScreen {...props} />;
};

const SettingsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
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
    return null; // could show a splash loader
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
