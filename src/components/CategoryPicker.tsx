import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';

export interface CategoryOption {
  label: string;
  value: string;
  icon?: string;
}

interface CategoryPickerProps {
  label: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  categories: CategoryOption[];
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  label,
  selectedValue,
  onValueChange,
  placeholder = 'Select category',
  error,
  categories,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const selectedCategory = categories.find(cat => cat.value === selectedValue);

  // Filter categories based on search text
  const filteredCategories = useMemo(() => {
    if (!searchText.trim()) return categories;
    return categories.filter(category =>
      category.label.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [categories, searchText]);

  const handleCategorySelect = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
    setSearchText(''); // Reset search when closing
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSearchText(''); // Reset search when closing
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[styles.picker, error && styles.pickerError]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.pickerContent}>
          {selectedCategory ? (
            <View style={styles.selectedItem}>
              {selectedCategory.icon && (
                <Text style={styles.categoryIcon}>{selectedCategory.icon}</Text>
              )}
              <Text style={styles.selectedText}>{selectedCategory.label}</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>{placeholder}</Text>
          )}
          <Text style={styles.dropdownIcon}>▼</Text>
        </View>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <Pressable style={styles.modalOverlay} onPress={handleModalClose}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity
                onPress={handleModalClose}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search categories..."
                placeholderTextColor="#9CA3AF"
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
              />
            </View>

            <ScrollView style={styles.optionsList}>
              {filteredCategories.length > 0 ? (
                filteredCategories.map(category => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.option,
                      selectedValue === category.value && styles.selectedOption,
                    ]}
                    onPress={() => handleCategorySelect(category.value)}
                  >
                    <View style={styles.optionContent}>
                      {category.icon && (
                        <Text style={styles.optionIcon}>{category.icon}</Text>
                      )}
                      <Text
                        style={[
                          styles.optionText,
                          selectedValue === category.value &&
                            styles.selectedOptionText,
                        ]}
                      >
                        {category.label}
                      </Text>
                    </View>
                    {selectedValue === category.value && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No categories found</Text>
                  <Text style={styles.noResultsSubtext}>
                    Try a different search term
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  picker: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pickerError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  selectedText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: '70%',
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedOption: {
    backgroundColor: '#EFF6FF',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  selectedOptionText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#111827',
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default CategoryPicker;
