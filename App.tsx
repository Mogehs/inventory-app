/**
 * Inventory Management App
 * React Native with Firebase Integration
 *
 * @format
 */

import React from 'react';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ToastProvider } from './src/components';

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppNavigator />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
