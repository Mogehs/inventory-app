import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';

// Firebase configuration
export const db = firestore();
export const authService = auth();
export const storageService = storage();

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  INVENTORY: 'inventory',
  CATEGORIES: 'categories',
  SUPPLIERS: 'suppliers',
  TRANSACTIONS: 'transactions',
};

// Firestore helpers
export const createDocument = async (collection: string, data: any) => {
  try {
    // Ensure user is authenticated before attempting writes
    if (!authService.currentUser) {
      console.error('createDocument: unauthenticated request');
      return { success: false, error: 'unauthenticated' };
    }
    const docRef = await db.collection(collection).add(data);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating document:', error);
    return { success: false, error };
  }
};

export const updateDocument = async (
  collection: string,
  id: string,
  data: any,
) => {
  try {
    // Debug: log current auth user to help diagnose permission issues
    try {
      const uid = authService.currentUser ? authService.currentUser.uid : null;
      console.debug(
        `updateDocument: collection=${collection} id=${id} authUid=${uid}`,
      );
    } catch (e) {
      console.debug(
        'updateDocument: unable to read authService.currentUser',
        e,
      );
    }
    if (!authService.currentUser) {
      console.error('updateDocument: unauthenticated request');
      return { success: false, error: 'unauthenticated' };
    }
    await db.collection(collection).doc(id).update(data);
    return { success: true };
  } catch (error) {
    // Provide more context for permission errors
    console.error('Error updating document:', {
      collection,
      id,
      data,
      error,
      authUid: authService.currentUser ? authService.currentUser.uid : null,
    });
    return { success: false, error };
  }
};

export const deleteDocument = async (collection: string, id: string) => {
  try {
    if (!authService.currentUser) {
      console.error('deleteDocument: unauthenticated request');
      return { success: false, error: 'unauthenticated' };
    }
    await db.collection(collection).doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, error };
  }
};

export const getDocument = async (collection: string, id: string) => {
  try {
    const doc = await db.collection(collection).doc(id).get();
    if (doc.exists()) {
      return { success: true, data: { id: doc.id, ...doc.data() } };
    } else {
      return { success: false, error: 'Document not found' };
    }
  } catch (error) {
    console.error('Error getting document:', error);
    return { success: false, error };
  }
};

export const getCollection = async (collection: string) => {
  try {
    const snapshot = await db.collection(collection).get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data };
  } catch (error) {
    console.error('Error getting collection:', error);
    return { success: false, error };
  }
};
