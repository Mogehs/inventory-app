// Cloudinary configuration and upload utilities
export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
}

// Default configuration - Replace with your Cloudinary settings
// TODO: See CLOUDINARY_SETUP.md for detailed setup instructions
export const cloudinaryConfig: CloudinaryConfig = {
  cloudName: 'dhqioo6t0', // Replace with your Cloudinary cloud name
  uploadPreset: 'inventory_images', // Replace with your upload preset name
};

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

/**
 * Upload image to Cloudinary
 * @param imageUri - Local image URI from image picker
 * @param options - Additional upload options
 * @returns Promise with upload result
 */
export const uploadImageToCloudinary = async (
  imageUri: string,
  options: {
    folder?: string;
    transformation?: string;
    quality?: 'auto' | number;
  } = {},
): Promise<UploadResult> => {
  try {
    const formData = new FormData();

    // Create file object for upload
    const file = {
      uri: imageUri,
      type: 'image/jpeg',
      name: `inventory-${Date.now()}.jpg`,
    } as any;

    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);

    if (options.folder) {
      formData.append('folder', options.folder);
    }

    if (options.quality) {
      formData.append('quality', options.quality.toString());
    }

    // Add automatic transformations for inventory images
    const transformations = [
      'c_fill',
      'h_800',
      'w_800',
      'q_auto',
      'f_auto',
      options.transformation,
    ]
      .filter(Boolean)
      .join(',');

    // if (transformations) {
    //   formData.append('transformation', transformations);
    // }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    const result = await response.json();

    if (response.ok && result.secure_url) {
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      };
    } else {
      return {
        success: false,
        error: result.error?.message || 'Upload failed',
      };
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: 'Network error occurred',
    };
  }
};

/**
 * Generate optimized image URL with transformations
 * @param publicId - Cloudinary public ID
 * @param transformations - Transformation string
 * @returns Optimized image URL
 */
export const getOptimizedImageUrl = (
  publicId: string,
  transformations = 'c_fill,h_400,w_400,q_auto,f_auto',
): string => {
  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${transformations}/${publicId}`;
};

/**
 * Delete image from Cloudinary
 * @param publicId - Public ID of the image to delete
 * @returns Promise with deletion result
 */
export const deleteImageFromCloudinary = async (
  publicId: string,
): Promise<boolean> => {
  try {
    // Note: Deletion requires authentication, usually done from backend
    // This is a placeholder for the deletion logic
    console.log('Delete image:', publicId);
    return true;
  } catch (error) {
    console.error('Delete image error:', error);
    return false;
  }
};
