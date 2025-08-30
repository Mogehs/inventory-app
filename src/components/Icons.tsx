import React from 'react';
import { View, StyleSheet } from 'react-native';

interface IconProps {
  focused?: boolean;
  size?: number;
  color?: string;
}

export const DashboardIcon: React.FC<IconProps> = ({
  focused,
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
            {
              backgroundColor: color,
              opacity: gridOpacity,
            },
          ]}
        />
        <View
          style={[
            styles.dashboardGrid,
            {
              backgroundColor: color,
              opacity: gridOpacity,
            },
          ]}
        />
        <View style={[styles.dashboardGrid, { backgroundColor: color }]} />
      </View>
    </View>
  );
};

export const InventoryIcon: React.FC<IconProps> = ({
  focused,
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
          {
            borderColor: color,
            backgroundColor: boxBackground,
          },
        ]}
      >
        <View
          style={[
            styles.inventoryHandle,
            {
              backgroundColor: handleBackground,
            },
          ]}
        />
      </View>
    </View>
  );
};

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
});
