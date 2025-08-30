import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface IconProps {
  focused?: boolean;
  size?: number;
  color?: string;
}

export const DashboardIcon: React.FC<IconProps> = ({
  focused,
  size = 24,
  color = '#000',
}) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <Text style={[styles.iconText, { fontSize: size * 0.7, color }]}>📊</Text>
  </View>
);

export const InventoryIcon: React.FC<IconProps> = ({
  focused,
  size = 24,
  color = '#000',
}) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <Text style={[styles.iconText, { fontSize: size * 0.7, color }]}>📦</Text>
  </View>
);

export const SettingsIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <Text style={[styles.iconText, { fontSize: size * 0.7, color }]}>⚙️</Text>
  </View>
);

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    textAlign: 'center',
  },
});
