import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface IconProps {
  focused?: boolean;
  size?: number;
  color?: string;
}

/* Dashboard Icon */
export const DashboardIcon: React.FC<IconProps> = ({
  focused = false,
  size = 24,
  color = '#6B7280',
}) => {
  const gridOpacity = focused ? 1 : 0.6;

  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      <View style={[styles.dashboardIcon, { borderColor: color }]}>
        <View style={[styles.dashboardGrid, { backgroundColor: color }]} />
        <View
          style={[
            styles.dashboardGrid,
            { backgroundColor: color, opacity: gridOpacity },
          ]}
        />
        <View
          style={[
            styles.dashboardGrid,
            { backgroundColor: color, opacity: gridOpacity },
          ]}
        />
        <View style={[styles.dashboardGrid, { backgroundColor: color }]} />
      </View>
    </View>
  );
};

/* Inventory Icon */
export const InventoryIcon: React.FC<IconProps> = ({
  focused = false,
  size = 24,
  color = '#6B7280',
}) => {
  const boxBackground = focused ? color : 'transparent';
  const handleBackground = focused ? '#FFFFFF' : color;

  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      <View
        style={[
          styles.inventoryBox,
          { borderColor: color, backgroundColor: boxBackground },
        ]}
      >
        <View
          style={[
            styles.inventoryHandle,
            { backgroundColor: handleBackground },
          ]}
        />
      </View>
    </View>
  );
};

/* Settings Icon */
export const SettingsIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#6B7280',
}) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={[styles.settingsIcon, { borderColor: color }]}>
      <View style={[styles.settingsCenter, { backgroundColor: color }]} />
    </View>
  </View>
);

/* Sales Icon ($ symbol) */
export const SalesIcon: React.FC<IconProps> = ({
  focused = false,
  size = 24,
  color = '#6B7280',
}) => {
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      <View
        style={[
          styles.salesIcon,
          {
            borderColor: color,
            backgroundColor: focused ? color : 'transparent',
          },
        ]}
      >
        <Text
          style={[
            styles.iconText,
            { color: focused ? '#FFFFFF' : color, fontSize: size * 0.65 },
          ]}
        >
          $
        </Text>
      </View>
    </View>
  );
};

/* Add Icon (+ symbol) */
export const AddIcon: React.FC<IconProps> = ({
  focused = false,
  size = 28,
  color = '#6B7280',
}) => {
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      <View
        style={[
          styles.addIcon,
          {
            borderColor: color,
            backgroundColor: focused ? color : 'transparent',
          },
        ]}
      >
        <Text
          style={[
            styles.iconText,
            { color: focused ? '#FFFFFF' : color, fontSize: size * 0.75 },
          ]}
        >
          +
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashboardIcon: {
    width: '90%',
    height: '90%',
    borderWidth: 1.5,
    borderRadius: 3,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  dashboardGrid: {
    width: '45%',
    height: '45%',
    borderRadius: 1,
  },
  inventoryBox: {
    width: '85%',
    height: '70%',
    borderWidth: 1.5,
    borderRadius: 2,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: '10%',
  },
  inventoryHandle: {
    width: '40%',
    height: 2,
    borderRadius: 1,
  },
  settingsIcon: {
    width: '85%',
    height: '85%',
    borderWidth: 1.5,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  settingsCenter: {
    width: '35%',
    height: '35%',
    borderRadius: 50,
  },
  salesIcon: {
    width: '85%',
    height: '85%',
    borderWidth: 1.2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    width: '90%',
    height: '90%',
    borderWidth: 1.2,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontWeight: '700',
    includeFontPadding: false, // removes extra padding warnings
    textAlignVertical: 'center',
  },
});
