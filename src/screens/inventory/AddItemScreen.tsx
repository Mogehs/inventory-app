import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { createDocument } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ToastProvider';
import {
  CustomInput,
  CustomButton,
  LoadingSpinner,
  ImagePickerComponent,
  CategoryPicker,
} from '../../components';
import type { CategoryOption } from '../../components/CategoryPicker';

interface FormData {
  name: string;
  description: string;
  sku: string;
  barcode: string;
  category: string;
  quantity: string;
  minStockLevel: string;
  maxStockLevel: string;
  unitPrice: string;
  costPrice: string;
  location: string;
  supplier: string;
  imageUrl: string;
}

// Predefined categories for easy selection
const INVENTORY_CATEGORIES: CategoryOption[] = [
  { label: 'Electronics', value: 'electronics', icon: '📱' },
  { label: 'Clothing & Apparel', value: 'clothing', icon: '👕' },
  { label: 'Food & Beverages', value: 'food', icon: '🍎' },
  { label: 'Home & Garden', value: 'home_garden', icon: '🏠' },
  { label: 'Sports & Outdoors', value: 'sports', icon: '⚽' },
  { label: 'Books & Media', value: 'books_media', icon: '📚' },
  { label: 'Health & Beauty', value: 'health_beauty', icon: '💄' },
  { label: 'Automotive', value: 'automotive', icon: '🚗' },
  { label: 'Tools & Hardware', value: 'tools', icon: '🔧' },
  { label: 'Office Supplies', value: 'office', icon: '📎' },
  { label: 'Toys & Games', value: 'toys', icon: '🎮' },
  { label: 'Art & Crafts', value: 'arts_crafts', icon: '🎨' },
  { label: 'Pet Supplies', value: 'pet_supplies', icon: '🐕' },
  { label: 'Furniture', value: 'furniture', icon: '🪑' },
  { label: 'Jewelry & Accessories', value: 'jewelry', icon: '💍' },
  { label: 'Industrial & Scientific', value: 'industrial', icon: '⚙️' },
  { label: 'Musical Instruments', value: 'music', icon: '🎵' },
  { label: 'Baby & Kids', value: 'baby_kids', icon: '👶' },
  { label: 'Kitchen & Dining', value: 'kitchen', icon: '🍽️' },
  { label: 'Other', value: 'other', icon: '📦' },
];

interface FormErrors {
  [key: string]: string;
}

const AddItemScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    category: '',
    quantity: '',
    minStockLevel: '10',
    maxStockLevel: '100',
    unitPrice: '',
    costPrice: '',
    location: '',
    supplier: '',
    imageUrl: '',
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required field validation
    const requiredFields = {
      name: 'Item name is required',
      sku: 'SKU is required',
      category: 'Category is required',
      quantity: 'Quantity is required',
      unitPrice: 'Unit price is required',
      location: 'Storage location is required',
    };

    Object.entries(requiredFields).forEach(([field, message]) => {
      if (!formData[field as keyof FormData].trim()) {
        newErrors[field] = message;
      }
    });

    // SKU format validation
    if (formData.sku && !/^[A-Z0-9-]{3,20}$/.test(formData.sku)) {
      newErrors.sku = 'SKU must be 3-20 characters (A-Z, 0-9, -)';
    }

    // Quantity validation
    if (formData.quantity) {
      const qty = Number(formData.quantity);
      if (isNaN(qty) || qty < 0) {
        newErrors.quantity = 'Quantity must be a positive number';
      }
    }

    // Price validation
    if (formData.unitPrice) {
      const price = Number(formData.unitPrice);
      if (isNaN(price) || price <= 0) {
        newErrors.unitPrice = 'Unit price must be greater than 0';
      }
    }

    if (formData.costPrice) {
      const cost = Number(formData.costPrice);
      if (isNaN(cost) || cost < 0) {
        newErrors.costPrice = 'Cost price must be a positive number';
      }
    }

    // Stock level validation
    if (formData.minStockLevel && formData.maxStockLevel) {
      const min = Number(formData.minStockLevel);
      const max = Number(formData.maxStockLevel);
      if (!isNaN(min) && !isNaN(max) && min >= max) {
        newErrors.minStockLevel = 'Min stock must be less than max stock';
      }
    }

    // Name length validation
    if (formData.name && formData.name.length < 2) {
      newErrors.name = 'Item name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6);
    const namePrefix = formData.name
      .slice(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, 'X');
    const categoryPrefix = formData.category
      .slice(0, 2)
      .toUpperCase()
      .replace(/[^A-Z]/g, 'X');
    const generatedSKU = `${namePrefix}-${categoryPrefix}-${timestamp}`;
    handleInputChange('sku', generatedSKU);
    showToast('SKU generated successfully!', 'success');
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Please fix the errors before submitting', 'error');
      return;
    }

    setLoading(true);
    try {
      const itemData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        sku: formData.sku.toUpperCase(),
        barcode: formData.barcode.trim(),
        category: formData.category.trim(),
        quantity: Number(formData.quantity),
        minStockLevel: Number(formData.minStockLevel) || 10,
        maxStockLevel: Number(formData.maxStockLevel) || 100,
        unitPrice: Number(formData.unitPrice),
        costPrice: Number(formData.costPrice) || Number(formData.unitPrice),
        location: formData.location.trim(),
        supplier: formData.supplier.trim(),
        imageUrl: formData.imageUrl,
        status: 'active',
        totalValue: Number(formData.quantity) * Number(formData.unitPrice),
        profit: formData.costPrice
          ? (Number(formData.unitPrice) - Number(formData.costPrice)) *
            Number(formData.quantity)
          : 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user?.uid || 'unknown',
      };

      const result = await createDocument('inventory', itemData);

      if (result.success) {
        showToast('✅ Item added successfully!', 'success');
        navigation.goBack();
      } else {
        showToast('Failed to add item. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      showToast('An error occurred while adding the item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelected = (imageUrl: string) => {
    handleInputChange('imageUrl', imageUrl);
    if (imageUrl) {
      showToast('Image uploaded successfully!', 'success');
    }
  };

  if (loading) {
    return <LoadingSpinner visible={true} text="Adding item..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add New Item</Text>
            <Text style={styles.subtitle}>
              Fill in the details to add a new item to your inventory
            </Text>
          </View>

          {/* Image Upload Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 Item Photo</Text>
            <ImagePickerComponent
              onImageSelected={handleImageSelected}
              currentImage={formData.imageUrl}
              placeholder="Add Item Photo"
            />
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Basic Information</Text>

            <CustomInput
              label="Item Name"
              value={formData.name}
              onChangeText={value => handleInputChange('name', value)}
              placeholder="Enter item name"
              error={errors.name}
            />

            <CustomInput
              label="Description"
              value={formData.description}
              onChangeText={value => handleInputChange('description', value)}
              placeholder="Describe the item (optional)"
              multiline
              numberOfLines={3}
              error={errors.description}
            />

            <View style={styles.skuContainer}>
              <View style={styles.skuInputContainer}>
                <CustomInput
                  label="SKU (Stock Keeping Unit)"
                  value={formData.sku}
                  onChangeText={value =>
                    handleInputChange('sku', value.toUpperCase())
                  }
                  placeholder="Enter SKU"
                  autoCapitalize="characters"
                  error={errors.sku}
                />
              </View>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={generateSKU}
              >
                <Text style={styles.generateButtonText}>Generate</Text>
              </TouchableOpacity>
            </View>

            <CategoryPicker
              label="Category *"
              selectedValue={formData.category}
              onValueChange={value => handleInputChange('category', value)}
              placeholder="Select a category"
              error={errors.category}
              categories={INVENTORY_CATEGORIES}
            />

            <CustomInput
              label="Supplier"
              value={formData.supplier}
              onChangeText={value => handleInputChange('supplier', value)}
              placeholder="Supplier name (optional)"
              error={errors.supplier}
            />

            <CustomInput
              label="Barcode"
              value={formData.barcode}
              onChangeText={value => handleInputChange('barcode', value)}
              placeholder="Scan or enter barcode (optional)"
              error={errors.barcode}
            />
          </View>

          {/* Inventory Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📦 Inventory Details</Text>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <CustomInput
                  label="Quantity"
                  value={formData.quantity}
                  onChangeText={value => handleInputChange('quantity', value)}
                  placeholder="0"
                  keyboardType="numeric"
                  error={errors.quantity}
                />
              </View>
              <View style={styles.halfWidth}>
                <CustomInput
                  label="Storage Location"
                  value={formData.location}
                  onChangeText={value => handleInputChange('location', value)}
                  placeholder="e.g., A-01-01"
                  error={errors.location}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <CustomInput
                  label="Min Stock Level"
                  value={formData.minStockLevel}
                  onChangeText={value =>
                    handleInputChange('minStockLevel', value)
                  }
                  placeholder="10"
                  keyboardType="numeric"
                  error={errors.minStockLevel}
                />
              </View>
              <View style={styles.halfWidth}>
                <CustomInput
                  label="Max Stock Level"
                  value={formData.maxStockLevel}
                  onChangeText={value =>
                    handleInputChange('maxStockLevel', value)
                  }
                  placeholder="100"
                  keyboardType="numeric"
                  error={errors.maxStockLevel}
                />
              </View>
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Pricing</Text>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <CustomInput
                  label="Unit Price"
                  value={formData.unitPrice}
                  onChangeText={value => handleInputChange('unitPrice', value)}
                  placeholder="0.00"
                  keyboardType="numeric"
                  error={errors.unitPrice}
                />
              </View>
              <View style={styles.halfWidth}>
                <CustomInput
                  label="Cost Price"
                  value={formData.costPrice}
                  onChangeText={value => handleInputChange('costPrice', value)}
                  placeholder="0.00"
                  keyboardType="numeric"
                  error={errors.costPrice}
                />
              </View>
            </View>

            {formData.unitPrice && formData.quantity && (
              <View style={styles.calculationContainer}>
                <Text style={styles.calculationText}>
                  Total Value: $
                  {(
                    Number(formData.unitPrice) * Number(formData.quantity)
                  ).toFixed(2)}
                </Text>
                {formData.costPrice && (
                  <Text style={styles.calculationText}>
                    Profit: $
                    {(
                      (Number(formData.unitPrice) -
                        Number(formData.costPrice)) *
                      Number(formData.quantity)
                    ).toFixed(2)}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <CustomButton
              title="Add Item to Inventory"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  skuContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  skuInputContainer: {
    flex: 1,
  },
  generateButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  calculationContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  calculationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
  },
});

export default AddItemScreen;
