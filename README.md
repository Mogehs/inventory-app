# Inventory Management App

A comprehensive React Native mobile application for inventory management with Firebase backend integration.

## Features

- **User Authentication**: Secure login/register with Firebase Auth
- **Inventory Management**: Add, edit, delete, and track inventory items
- **Real-time Database**: Firestore integration for real-time data sync
- **Stock Monitoring**: Low stock alerts and stock level tracking
- **Barcode Scanner**: Quick item lookup and management (placeholder)
- **Reports & Analytics**: Inventory reports and performance insights
- **Multi-platform**: Runs on both Android and iOS devices

## Tech Stack

- **Frontend**: React Native with TypeScript
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Navigation**: React Navigation 6
- **State Management**: React Context API
- **UI Components**: Custom components with React Native
- **Icons**: React Native Vector Icons

## Prerequisites

Before running this application, make sure you have:

- Node.js (v16 or higher)
- npm or yarn
- React Native development environment set up
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Firebase project configured

## Installation

1. **Clone the repository** (if from git):

   ```bash
   git clone <your-repo-url>
   cd inventory-app
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure Firebase**:

   - Follow the instructions in `FIREBASE_SETUP.md`
   - Add your `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

4. **Configure Cloudinary** (for image upload):

   - Follow the instructions in `CLOUDINARY_SETUP.md`
   - Update your Cloudinary credentials in `src/utils/cloudinary.ts`

5. **Install iOS dependencies** (iOS only):
   ```bash
   cd ios && pod install
   ```

## Running the App

1. **Start Metro bundler**:

   ```bash
   npm start
   ```

2. **Run on Android**:

   ```bash
   npm run android
   # or
   npx react-native run-android
   ```

3. **Run on iOS** (macOS only):
   ```bash
   npm run ios
   # or
   npx react-native run-ios
   ```

## Project Structure

```
src/
├── config/
│   └── firebase.ts          # Firebase configuration and helpers
├── contexts/
│   └── AuthContext.tsx      # Authentication context
├── navigation/
│   └── AppNavigator.tsx     # App navigation setup
├── screens/
│   ├── auth/               # Login/Register screens
│   ├── dashboard/          # Dashboard screen
│   ├── inventory/          # Inventory management screens
│   ├── scanner/            # Barcode scanner screen
│   ├── reports/            # Reports and analytics
│   └── settings/           # App settings
├── types/
│   └── index.ts            # TypeScript type definitions
└── App.tsx                 # Main app component
```

## Key Features Implemented

- ✅ User Authentication (Login/Register)
- ✅ Dashboard with inventory overview
- ✅ Professional Add Item screen with image upload
- ✅ Camera and gallery image selection
- ✅ Cloudinary image optimization and storage
- ✅ Comprehensive form validation with error handling
- ✅ Real-time data synchronization
- ✅ Stock level monitoring
- ✅ Professional navigation with custom icons
- ✅ Settings and configuration screens
- ✅ Reports and analytics screens
- ✅ TypeScript implementation
- ✅ Firebase integration ready

## Latest Updates

### Enhanced Add Item Screen

- 📸 **Image Upload**: Take photos or select from gallery
- ☁️ **Cloudinary Integration**: Automatic image optimization and cloud storage
- ✅ **Advanced Validation**: Comprehensive form validation with user-friendly error messages
- 🎨 **Professional Design**: Elegant UI matching the app's theme
- 🔧 **Smart Features**: Auto-generated SKU, price calculations, and stock tracking

### Professional UI Components

- 🎯 **Custom Icons**: Professional React Native component-based icons
- 📱 **Responsive Design**: Works perfectly on all screen sizes
- 🎨 **Consistent Theme**: Unified color scheme and typography
- ⚡ **Performance Optimized**: Lightweight and fast loading

## Firebase Configuration

The app requires a Firebase project with the following services enabled:

1. **Authentication**: Email/Password provider
2. **Firestore Database**: For storing inventory data
3. **Storage**: For item images (optional)

See `FIREBASE_SETUP.md` for detailed setup instructions.

## Database Schema

### Collections

- `users`: User profiles and settings
- `inventory`: Inventory items with all details
- `categories`: Product categories
- `suppliers`: Supplier information
- `transactions`: Stock movement history

## Development

### Available Scripts

- `npm start`: Start Metro bundler
- `npm run android`: Run on Android device/emulator
- `npm run ios`: Run on iOS device/simulator
- `npm run lint`: Run ESLint
- `npm test`: Run tests

### Code Style

The project uses:

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

1. **Metro bundler not starting**:

   - Clear cache: `npx react-native start --reset-cache`

2. **Android build issues**:

   - Clean build: `cd android && ./gradlew clean`

3. **iOS build issues**:

   - Clean build: `cd ios && xcodebuild clean`

4. **Firebase connection issues**:
   - Verify configuration files are in correct locations
   - Check Firebase project settings

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please create an issue in the project repository.
