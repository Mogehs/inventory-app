import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { createDocument } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

const AddItemScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    categoryId: '',
    supplierId: '',
    quantity: '',
    minStockLevel: '',
    maxStockLevel: '',
    unitPrice: '',
    costPrice: '',
    barcode: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const required = ['name', 'sku', 'quantity', 'unitPrice', 'location'];
    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        Alert.alert('Error', `${field} is required`);
        return false;
      }
    }

    if (isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0) {
      Alert.alert('Error', 'Quantity must be a valid number');
      return false;
    }

    if (isNaN(Number(formData.unitPrice)) || Number(formData.unitPrice) <= 0) {
      Alert.alert('Error', 'Unit price must be a valid number greater than 0');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const itemData = {
        ...formData,
        quantity: Number(formData.quantity),
        minStockLevel: Number(formData.minStockLevel) || 10,
        maxStockLevel: Number(formData.maxStockLevel) || 100,
        unitPrice: Number(formData.unitPrice),
        costPrice: Number(formData.costPrice) || Number(formData.unitPrice),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user?.uid || 'unknown',
      };

      const result = await createDocument('inventory', itemData);

      if (result.success) {
        Alert.alert('Success', 'Item added successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={value => handleInputChange('name', value)}
              placeholder="Enter item name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={value => handleInputChange('description', value)}
              placeholder="Enter item description"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>SKU *</Text>
            <TextInput
              style={styles.input}
              value={formData.sku}
              onChangeText={value => handleInputChange('sku', value)}
              placeholder="Enter SKU"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Barcode</Text>
            <TextInput
              style={styles.input}
              value={formData.barcode}
              onChangeText={value => handleInputChange('barcode', value)}
              placeholder="Enter barcode"
            />
          </View>

          <Text style={styles.sectionTitle}>Inventory Details</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                value={formData.quantity}
                onChangeText={value => handleInputChange('quantity', value)}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={value => handleInputChange('location', value)}
                placeholder="A-01-01"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Min Stock Level</Text>
              <TextInput
                style={styles.input}
                value={formData.minStockLevel}
                onChangeText={value =>
                  handleInputChange('minStockLevel', value)
                }
                placeholder="10"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Max Stock Level</Text>
              <TextInput
                style={styles.input}
                value={formData.maxStockLevel}
                onChangeText={value =>
                  handleInputChange('maxStockLevel', value)
                }
                placeholder="100"
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Pricing</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Unit Price *</Text>
              <TextInput
                style={styles.input}
                value={formData.unitPrice}
                onChangeText={value => handleInputChange('unitPrice', value)}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Cost Price</Text>
              <TextInput
                style={styles.input}
                value={formData.costPrice}
                onChangeText={value => handleInputChange('costPrice', value)}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding Item...' : 'Add Item'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddItemScreen;
