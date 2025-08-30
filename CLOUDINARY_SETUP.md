# Cloudinary Setup Guide

This guide will help you set up Cloudinary for image upload functionality in the Inventory Management App.

## 1. Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account
2. After registration, you'll be taken to your dashboard
3. Note down your **Cloud Name** from the dashboard

## 2. Create an Upload Preset

1. In your Cloudinary dashboard, go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Configure the preset:
   - **Preset name**: `inventory_images` (or any name you prefer)
   - **Signing Mode**: Select **Unsigned** (for easier setup)
   - **Folder**: `inventory` (optional, to organize your images)
   - **Resource Type**: `Image`
   - **Delivery Type**: `Upload`
   - **Access Mode**: `Public`
5. In the **Upload Manipulations** section, you can add transformations:
   - **Transformation**: Add `c_fill,h_800,w_800,q_auto,f_auto` for automatic optimization
6. Click **Save**

## 3. Configure the App

1. Open `src/utils/cloudinary.ts`
2. Replace the placeholder values:
   ```typescript
   const CLOUDINARY_CLOUD_NAME = 'your-cloud-name-here';
   const CLOUDINARY_UPLOAD_PRESET = 'your-upload-preset-name';
   ```

### Example Configuration:

```typescript
// src/utils/cloudinary.ts
const CLOUDINARY_CLOUD_NAME = 'my-inventory-app';
const CLOUDINARY_UPLOAD_PRESET = 'inventory_images';
```

## 4. Environment Variables (Recommended)

For better security, you can use environment variables:

1. Create a `.env` file in the root of your project:

   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name-here
   CLOUDINARY_UPLOAD_PRESET=your-upload-preset-name
   ```

2. Install react-native-config:

   ```bash
   npm install react-native-config
   ```

3. Update `src/utils/cloudinary.ts` to use environment variables:

   ```typescript
   import Config from 'react-native-config';

   const CLOUDINARY_CLOUD_NAME =
     Config.CLOUDINARY_CLOUD_NAME || 'your-fallback-cloud-name';
   const CLOUDINARY_UPLOAD_PRESET =
     Config.CLOUDINARY_UPLOAD_PRESET || 'your-fallback-preset';
   ```

## 5. Test the Configuration

1. Build and run your app
2. Navigate to the Add Item screen
3. Try uploading an image
4. Check your Cloudinary dashboard to see if the image was uploaded successfully

## Security Considerations

- **Unsigned Upload Presets** are easier to set up but less secure
- For production apps, consider using **Signed Upload Presets** with server-side signing
- Always validate file types and sizes on both client and server side
- Consider implementing rate limiting to prevent abuse

## Troubleshooting

### Common Issues:

1. **Upload fails with "Invalid preset"**

   - Check that your upload preset name is correct
   - Ensure the preset is set to "Unsigned" mode

2. **Upload fails with "Invalid cloud name"**

   - Verify your cloud name is correct (no spaces, special characters)

3. **Images not displaying**

   - Check the Cloudinary URL format
   - Ensure the images are set to "Public" access mode

4. **Large file upload fails**
   - Check your upload preset file size limits
   - Consider implementing client-side image compression

### Need Help?

- Check the [Cloudinary Documentation](https://cloudinary.com/documentation)
- Visit the [React Native Image Upload Guide](https://cloudinary.com/documentation/react_native_image_manipulation)

## Current Implementation Features

✅ **Automatic Image Optimization**: Images are automatically compressed and optimized
✅ **Multiple Format Support**: Supports JPEG, PNG, WebP, and other formats
✅ **Progress Tracking**: Shows upload progress to users
✅ **Error Handling**: Comprehensive error handling with user-friendly messages
✅ **Image Transformations**: Automatic resizing and quality optimization
✅ **Secure URLs**: Generated URLs are optimized for fast delivery

Once configured, your inventory app will be able to:

- Take photos with the device camera
- Select images from the gallery
- Upload images to Cloudinary with automatic optimization
- Store optimized image URLs in Firestore
- Display images throughout the app with fast loading
