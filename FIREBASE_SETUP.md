# Firebase Configuration Instructions

## Setup Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Add an Android app and/or iOS app to your project
4. Download the configuration files:
   - For Android: Download `google-services.json`
   - For iOS: Download `GoogleService-Info.plist`

## Android Setup

1. Place `google-services.json` in `android/app/` directory
2. Add the following to `android/build.gradle` (project level):

   ```gradle
   buildscript {
     dependencies {
       classpath 'com.google.gms:google-services:4.4.0'
     }
   }
   ```

3. Add to `android/app/build.gradle`:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

## iOS Setup

1. Place `GoogleService-Info.plist` in `ios/InventoryApp/` directory
2. Add the file to your Xcode project
3. Run `cd ios && pod install`

## Enable Firebase Services

In the Firebase Console, enable the following services:

### Authentication

1. Go to Authentication > Sign-in method
2. Enable Email/Password authentication
3. Optional: Enable other providers as needed

### Firestore Database

1. Go to Firestore Database
2. Create database in test mode (or production mode with rules)
3. Set up security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Inventory items - authenticated users can read/write
    match /inventory/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Categories - authenticated users can read/write
    match /categories/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Suppliers - authenticated users can read/write
    match /suppliers/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Transactions - authenticated users can read/write
    match /transactions/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage (Optional)

1. Go to Storage
2. Set up storage bucket for item images

## Environment Variables

Create a `.env` file in the root directory (optional):

```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
```

Note: The configuration is automatically loaded from the downloaded files, so environment variables are optional.
