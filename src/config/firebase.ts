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
export const createDocument = async (
  collection: string,
  data: any,
  options?: { ownerOnly?: boolean },
) => {
  try {
    // Ensure user is authenticated before attempting writes when ownership is required
    if (options?.ownerOnly && !authService.currentUser) {
      console.error('createDocument: unauthenticated request');
      return { success: false, error: 'unauthenticated' };
    }

    const payload = { ...data };
    if (options?.ownerOnly)
      payload.createdBy = authService.currentUser?.uid ?? null;

    const docRef = await db.collection(collection).add(payload);
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
  options?: { ownerOnly?: boolean },
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
    if (options?.ownerOnly && !authService.currentUser) {
      console.error('updateDocument: unauthenticated request');
      return { success: false, error: 'unauthenticated' };
    }

    // If ownerOnly, ensure the current user is owner before updating
    if (options?.ownerOnly) {
      const doc = await db.collection(collection).doc(id).get();
      const owner = doc.exists() ? (doc.data() as any)?.createdBy : null;
      if (owner && owner !== authService.currentUser?.uid) {
        console.error('updateDocument: permission denied, not owner');
        return { success: false, error: 'permission-denied' };
      }
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

    // Ensure only owner can delete sensitive docs
    const doc = await db.collection(collection).doc(id).get();
    const owner = doc.exists() ? (doc.data() as any)?.createdBy : null;
    if (owner && owner !== authService.currentUser?.uid) {
      console.error('deleteDocument: permission denied, not owner');
      return { success: false, error: 'permission-denied' };
    }

    await db.collection(collection).doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { success: false, error };
  }
};

export const getDocument = async (
  collection: string,
  id: string,
  options?: { ownerOnly?: boolean },
) => {
  try {
    const doc = await db.collection(collection).doc(id).get();
    if (!doc.exists) return { success: false, error: 'Document not found' };
    const data = { id: doc.id, ...doc.data() } as any;
    if (
      options?.ownerOnly &&
      data.createdBy &&
      data.createdBy !== authService.currentUser?.uid
    ) {
      return { success: false, error: 'permission-denied' };
    }
    return { success: true, data };
  } catch (error) {
    console.error('Error getting document:', error);
    return { success: false, error };
  }
};

export const getCollection = async (
  collection: string,
  options?: { ownerOnly?: boolean; where?: [string, any, any][] },
) => {
  try {
    let ref: any = db.collection(collection);
    // If ownerOnly, filter by createdBy
    if (options?.ownerOnly) {
      const uid = authService.currentUser?.uid ?? null;
      if (!uid) return { success: false, error: 'unauthenticated' };
      ref = ref.where('createdBy', '==', uid);
    }

    if (options?.where) {
      for (const clause of options.where) {
        ref = ref.where(clause[0], clause[1], clause[2]);
      }
    }

    const snapshot = await ref.get();
    const data = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return { success: true, data };
  } catch (error) {
    console.error('Error getting collection:', error);
    return { success: false, error };
  }
};
