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
    await db.collection(collection).doc(id).update(data);
    return { success: true };
  } catch (error) {
    console.error('Error updating document:', error);
    return { success: false, error };
  }
};

export const deleteDocument = async (collection: string, id: string) => {
  try {
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
