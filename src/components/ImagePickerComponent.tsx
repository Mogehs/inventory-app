import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  MediaType,
} from 'react-native-image-picker';
import { uploadImageToCloudinary, UploadResult } from '../utils/cloudinary';

interface ImagePickerComponentProps {
  onImageSelected: (imageUrl: string) => void;
  currentImage?: string;
  placeholder?: string;
  style?: any;
}

const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
  onImageSelected,
  currentImage,
  placeholder = 'Add Photo',
  style,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  const imagePickerOptions = {
    mediaType: 'photo' as MediaType,
    includeBase64: false,
    maxHeight: 2000,
    maxWidth: 2000,
    quality: 0.8 as const,
  };

  const handleImagePicker = () => {
    setShowModal(true);
  };

  const selectFromLibrary = () => {
    setShowModal(false);
    launchImageLibrary(imagePickerOptions, handleImageResponse);
  };

  const selectFromCamera = () => {
    setShowModal(false);
    launchCamera(imagePickerOptions, handleImageResponse);
  };

  const handleImageResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }

    const asset = response.assets?.[0];
    if (!asset?.uri) {
      Alert.alert('Error', 'Failed to select image');
      return;
    }

    setLocalImageUri(asset.uri);
    setIsUploading(true);

    try {
      const uploadResult: UploadResult = await uploadImageToCloudinary(
        asset.uri,
        {
          folder: 'inventory-items',
          quality: 'auto',
        },
      );

      if (uploadResult.success && uploadResult.url) {
        onImageSelected(uploadResult.url);
      } else {
        Alert.alert(
          'Upload Failed',
          uploadResult.error || 'Failed to upload image',
        );
        setLocalImageUri(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
      setLocalImageUri(null);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    Alert.alert('Remove Image', 'Are you sure you want to remove this image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setLocalImageUri(null);
          onImageSelected('');
        },
      },
    ]);
  };

  const displayImage = localImageUri || currentImage;

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.imageContainer,
          displayImage && styles.imageContainerWithImage,
        ]}
        onPress={displayImage ? removeImage : handleImagePicker}
        disabled={isUploading}
      >
        {isUploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        ) : displayImage ? (
          <>
            <Image source={{ uri: displayImage }} style={styles.image} />
            <View style={styles.imageOverlay}>
              <Text style={styles.changeText}>Tap to change</Text>
            </View>
          </>
        ) : (
          <View style={styles.placeholderContainer}>
            <View style={styles.cameraIcon}>
              <Text style={styles.cameraIconText}>📷</Text>
            </View>
            <Text style={styles.placeholderText}>{placeholder}</Text>
            <Text style={styles.placeholderSubtext}>Tap to add photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Photo</Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={selectFromCamera}
            >
              <Text style={styles.modalOptionText}>📸 Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={selectFromLibrary}
            >
              <Text style={styles.modalOptionText}>🖼️ Choose from Library</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.cancelOption]}
              onPress={() => setShowModal(false)}
            >
              <Text style={[styles.modalOptionText, styles.cancelText]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageContainerWithImage: {
    borderStyle: 'solid',
    borderColor: '#CBD5E1',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  changeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  cameraIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cameraIconText: {
    fontSize: 24,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#64748B',
  },
  uploadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  uploadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1E40AF',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  cancelOption: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EF4444',
    marginTop: 8,
  },
  cancelText: {
    color: '#EF4444',
  },
});

export default ImagePickerComponent;
