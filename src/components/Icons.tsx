import React from 'react';
import { View, StyleSheet } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
}

export const EyeIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#6B7280',
}) => (
  <View style={[styles.icon, { width: size, height: size }]}>
    <View style={[styles.eyeOuter, { borderColor: color }]}>
      <View style={[styles.eyeInner, { backgroundColor: color }]} />
    </View>
  </View>
);

export const EyeOffIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#6B7280',
}) => (
  <View style={[styles.icon, { width: size, height: size }]}>
    <View style={[styles.eyeOuter, { borderColor: color }]}>
      <View style={[styles.eyeInner, { backgroundColor: color }]} />
    </View>
    <View style={[styles.eyeSlash, { backgroundColor: color }]} />
  </View>
);

export const InventoryIcon: React.FC<IconProps> = ({
  size = 40,
  color = '#3B82F6',
}) => (
  <View style={[styles.inventoryIcon, { width: size, height: size }]}>
    <View style={[styles.inventoryBox, { borderColor: color }]}>
      <View style={[styles.inventoryHandle, { backgroundColor: color }]} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeOuter: {
    width: '80%',
    height: '60%',
    borderWidth: 1.5,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeInner: {
    width: '40%',
    height: '60%',
    borderRadius: 10,
  },
  eyeSlash: {
    position: 'absolute',
    width: '120%',
    height: 1.5,
    transform: [{ rotate: '45deg' }],
  },
  inventoryIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inventoryBox: {
    width: '80%',
    height: '70%',
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: '10%',
  },
  inventoryHandle: {
    width: '60%',
    height: '15%',
    borderRadius: 2,
  },
});
