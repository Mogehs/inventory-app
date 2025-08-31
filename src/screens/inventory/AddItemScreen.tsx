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
import { createDocument, updateDocument } from '../../config/firebase';
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
  category: string;
  quantity: string;
  minStockLevel: string;
  maxStockLevel: string;
  unitPrice: string;
  costPrice: string;
  supplier: string;
  supplierPaid: string;
  imageUrl: string;
}

// Predefined categories
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

const AddItemScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const editItem = route?.params?.item;
  const isEditMode = route?.params?.isEdit && editItem;

  const [formData, setFormData] = useState<FormData>({
    name: isEditMode ? editItem.name : '',
    description: isEditMode ? editItem.description : '',
    sku: isEditMode ? editItem.sku : '',
    category: isEditMode ? editItem.category : '',
    quantity: isEditMode ? editItem.quantity.toString() : '',
    minStockLevel: isEditMode ? editItem.minStockLevel.toString() : '10',
    maxStockLevel: isEditMode ? editItem.maxStockLevel.toString() : '100',
    unitPrice: isEditMode ? editItem.unitPrice.toString() : '',
    costPrice: isEditMode ? editItem.costPrice.toString() : '',
    supplier: isEditMode ? editItem.supplier || '' : '',
    supplierPaid:
      isEditMode && editItem.supplierPaid != null
        ? String(editItem.supplierPaid)
        : '',
    imageUrl: isEditMode ? editItem.imageUrl || '' : '',
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const requiredFields = {
      name: 'Item name is required',
      sku: 'SKU is required',
      category: 'Category is required',
      quantity: 'Quantity is required',
      unitPrice: 'Unit price is required',
      supplier: 'Supplier is required',
    };
    Object.entries(requiredFields).forEach(([field, message]) => {
      if (!formData[field as keyof FormData].trim()) {
        newErrors[field] = message;
      }
    });
    if (formData.quantity && Number(formData.quantity) < 0) {
      newErrors.quantity = 'Quantity must be positive';
    }
    if (formData.unitPrice && Number(formData.unitPrice) <= 0) {
      newErrors.unitPrice = 'Unit price must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-5);
    const namePrefix = formData.name.slice(0, 3).toUpperCase() || 'ITM';
    const categoryPrefix = formData.category.slice(0, 2).toUpperCase() || 'CT';
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
      const qty = Number(formData.quantity) || 0;
      const unitCost =
        Number(formData.costPrice) || Number(formData.unitPrice) || 0;
      const supplierTotalCost = unitCost * qty;
      const supplierPaid = Number(formData.supplierPaid) || 0;
      const rawDue = supplierTotalCost - supplierPaid;
      const supplierDue = rawDue > 0 ? rawDue : 0;
      const supplierOverpaid = rawDue < 0 ? Math.abs(rawDue) : 0;

      const itemData = {
        ...formData,
        sku: formData.sku.toUpperCase(),
        quantity: qty,
        minStockLevel: Number(formData.minStockLevel),
        maxStockLevel: Number(formData.maxStockLevel),
        unitPrice: Number(formData.unitPrice),
        costPrice: unitCost,
        // supplier payment tracking
        supplierTotalCost,
        supplierPaid,
        supplierDue,
        ...(supplierOverpaid > 0 ? { supplierOverpaid } : {}),
        totalValue: qty * Number(formData.unitPrice),
        profit:
          (Number(formData.unitPrice) -
            (Number(formData.costPrice) || Number(formData.unitPrice))) *
          qty,
        status: 'active',
        updatedAt: new Date(),
        ...(isEditMode
          ? {}
          : { createdAt: new Date(), createdBy: user?.uid || 'unknown' }),
      };

      let result;
      if (isEditMode) {
        result = await updateDocument('inventory', editItem.id, itemData);
      } else {
        result = await createDocument('inventory', itemData);
      }

      if (result.success) {
        showToast(
          `✅ Item ${isEditMode ? 'updated' : 'added'} successfully!`,
          'success',
        );
        navigation.goBack();
      } else {
        showToast('Operation failed. Try again.', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Error occurred while saving item.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelected = (imageUrl: string) => {
    handleInputChange('imageUrl', imageUrl);
    if (imageUrl) showToast('Image uploaded successfully!', 'success');
  };

  if (loading) {
    return (
      <LoadingSpinner
        visible={true}
        text={isEditMode ? 'Updating item...' : 'Adding item...'}
      />
    );
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
          <Text style={styles.title}>
            {isEditMode ? 'Edit Item' : 'Add New Item'}
          </Text>

          {/* Image */}
          <ImagePickerComponent
            onImageSelected={handleImageSelected}
            currentImage={formData.imageUrl}
            placeholder="Add Item Photo"
          />

          {/* Inputs */}
          <CustomInput
            label="Item Name"
            value={formData.name}
            onChangeText={v => handleInputChange('name', v)}
            placeholder="Enter item name"
            error={errors.name}
          />

          <CustomInput
            label="Description"
            value={formData.description}
            onChangeText={v => handleInputChange('description', v)}
            placeholder="Optional description"
            multiline
            numberOfLines={3}
          />

          <View style={styles.row}>
            <View style={styles.flex}>
              <CustomInput
                label="SKU"
                value={formData.sku}
                onChangeText={v => handleInputChange('sku', v.toUpperCase())}
                placeholder="Enter SKU"
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
            onChangeText={v => handleInputChange('supplier', v)}
            placeholder="Supplier name"
            error={errors.supplier}
          />

          <View style={styles.row}>
            <View style={styles.flex}>
              <CustomInput
                label="Quantity"
                value={formData.quantity}
                onChangeText={v => handleInputChange('quantity', v)}
                placeholder="0"
                keyboardType="numeric"
                error={errors.quantity}
              />
            </View>
            <View style={styles.flex}>
              <CustomInput
                label="Min Stock"
                value={formData.minStockLevel}
                onChangeText={v => handleInputChange('minStockLevel', v)}
                placeholder="10"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.flex}>
              <CustomInput
                label="Max Stock"
                value={formData.maxStockLevel}
                onChangeText={v => handleInputChange('maxStockLevel', v)}
                placeholder="100"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.flex}>
              <CustomInput
                label="Unit Price"
                value={formData.unitPrice}
                onChangeText={v => handleInputChange('unitPrice', v)}
                placeholder="0.00"
                keyboardType="numeric"
                error={errors.unitPrice}
              />
            </View>
            <View style={styles.flex}>
              <CustomInput
                label="Cost Price"
                value={formData.costPrice}
                onChangeText={v => handleInputChange('costPrice', v)}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
          </View>

          <CustomInput
            label="Paid to Supplier"
            value={formData.supplierPaid}
            onChangeText={v => handleInputChange('supplierPaid', v)}
            placeholder="0.00"
            keyboardType="numeric"
          />

          {/* Supplier summary */}
          {formData.quantity && (formData.unitPrice || formData.costPrice) && (
            <View style={styles.supplierBox}>
              <Text style={styles.supplierLine}>
                Supplier Total: $
                {(
                  (Number(formData.costPrice) ||
                    Number(formData.unitPrice) ||
                    0) * Number(formData.quantity)
                ).toFixed(2)}
              </Text>
              <Text style={styles.supplierLine}>
                Paid: ${Number(formData.supplierPaid || 0).toFixed(2)}
              </Text>
              <Text style={styles.supplierDueLine}>
                Remaining Due: $
                {(
                  (Number(formData.costPrice) ||
                    Number(formData.unitPrice) ||
                    0) *
                    Number(formData.quantity) -
                  (Number(formData.supplierPaid) || 0)
                ).toFixed(2)}
              </Text>
            </View>
          )}

          {/* Calculations */}
          {formData.quantity && formData.unitPrice && (
            <View style={styles.calculationBox}>
              <Text style={styles.calcText}>
                Total: {Number(formData.unitPrice) * Number(formData.quantity)}
              </Text>
              {formData.costPrice && (
                <Text style={styles.calcText}>
                  Profit:{' '}
                  {(Number(formData.unitPrice) - Number(formData.costPrice)) *
                    Number(formData.quantity)}
                </Text>
              )}
            </View>
          )}

          {/* Submit */}
          <CustomButton
            title={isEditMode ? 'Update Item' : 'Add Item'}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  generateButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 0,
    minWidth: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButtonText: { color: '#fff', fontWeight: '600' },
  calculationBox: {
    marginTop: 12,
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 8,
  },
  calcText: { fontSize: 14, fontWeight: '600', color: '#0C4A6E' },
  submitButton: { marginTop: 20, paddingVertical: 16, borderRadius: 12 },
  supplierBox: {
    marginTop: 10,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  supplierLine: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  supplierDueLine: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C2D12',
  },
});

export default AddItemScreen;
