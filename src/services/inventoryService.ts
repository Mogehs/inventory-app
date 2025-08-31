import firestore, { collection } from '@react-native-firebase/firestore';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice?: number;
  description?: string;
  category?: string;
  createdAt?: any;
  updatedAt?: any;
}

class InventoryService {
  private inventoryCollection = collection(firestore(), 'inventory');

  /**
   * Find inventory item by SKU
   */
  async findBySku(sku: string): Promise<InventoryItem | null> {
    try {
      const querySnapshot = await this.inventoryCollection
        .where('sku', '==', sku.trim())
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...(doc.data() as Omit<InventoryItem, 'id'>),
      };
    } catch (error) {
      console.error('Error finding inventory by SKU:', error);
      throw new Error('Failed to search inventory');
    }
  }

  /**
   * Check if there's enough stock for a given quantity
   */
  async checkStock(itemId: string, requiredQuantity: number): Promise<boolean> {
    try {
      const doc = await this.inventoryCollection.doc(itemId).get();

      if (!doc.exists) {
        return false;
      }

      const data = doc.data();
      const currentQuantity = Number(data?.quantity || 0);

      return currentQuantity >= requiredQuantity;
    } catch (error) {
      console.error('Error checking stock:', error);
      throw new Error('Failed to check stock availability');
    }
  }

  /**
   * Get inventory item by ID
   */
  async getById(itemId: string): Promise<InventoryItem | null> {
    try {
      const doc = await this.inventoryCollection.doc(itemId).get();

      const docExists =
        typeof doc.exists === 'function' ? doc.exists() : !!doc.exists;
      if (!docExists) {
        return null;
      }

      return {
        id: doc.id,
        ...(doc.data() as Omit<InventoryItem, 'id'>),
      };
    } catch (error) {
      console.error('Error getting inventory by ID:', error);
      throw new Error('Failed to get inventory item');
    }
  }

  /**
   * Update inventory quantity (with transaction for consistency)
   */
  async updateQuantity(itemId: string, quantityChange: number): Promise<void> {
    try {
      const itemRef = this.inventoryCollection.doc(itemId);

      await firestore().runTransaction(async transaction => {
        const doc = await transaction.get(itemRef);

        const docExists =
          typeof doc.exists === 'function' ? doc.exists() : !!doc.exists;
        if (!docExists) {
          throw new Error('Inventory item not found');
        }

        const currentData = doc.data() as InventoryItem;
        const currentQuantity = currentData.quantity || 0;
        const newQuantity = Math.max(0, currentQuantity + quantityChange);

        transaction.update(itemRef, {
          quantity: newQuantity,
          updatedAt: firestore.Timestamp.now(),
        });
      });
    } catch (error) {
      console.error('Error updating inventory quantity:', error);
      throw new Error('Failed to update inventory quantity');
    }
  }

  /**
   * Decrease inventory quantity (for sales)
   */
  async decreaseQuantity(itemId: string, quantity: number): Promise<void> {
    return this.updateQuantity(itemId, -quantity);
  }

  /**
   * Increase inventory quantity (for returns/restocking)
   */
  async increaseQuantity(itemId: string, quantity: number): Promise<void> {
    return this.updateQuantity(itemId, quantity);
  }

  /**
   * Check if enough stock is available
   */
  async hasEnoughStock(
    itemId: string,
    requiredQuantity: number,
  ): Promise<boolean> {
    try {
      const item = await this.getById(itemId);
      if (!item) {
        return false;
      }
      return item.quantity >= requiredQuantity;
    } catch (error) {
      console.error('Error checking stock:', error);
      return false;
    }
  }

  /**
   * Get low stock items (quantity below threshold)
   */
  async getLowStockItems(threshold: number = 10): Promise<InventoryItem[]> {
    try {
      const querySnapshot = await this.inventoryCollection
        .where('quantity', '<=', threshold)
        .orderBy('quantity', 'asc')
        .get();

      return querySnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...(doc.data() as Omit<InventoryItem, 'id'>),
      }));
    } catch (error) {
      console.error('Error getting low stock items:', error);
      throw new Error('Failed to get low stock items');
    }
  }

  /**
   * Search inventory items by name or SKU
   */
  async searchItems(searchTerm: string): Promise<InventoryItem[]> {
    try {
      const term = searchTerm.toLowerCase().trim();

      // Search by name (contains)
      const nameQuery = await this.inventoryCollection
        .where('name', '>=', term)
        .where('name', '<=', term + '\uf8ff')
        .get();

      // Search by SKU (exact match)
      const skuQuery = await this.inventoryCollection
        .where('sku', '==', term)
        .get();

      const nameResults = nameQuery.docs.map((doc: any) => ({
        id: doc.id,
        ...(doc.data() as Omit<InventoryItem, 'id'>),
      }));

      const skuResults = skuQuery.docs.map((doc: any) => ({
        id: doc.id,
        ...(doc.data() as Omit<InventoryItem, 'id'>),
      }));

      // Combine and deduplicate results
      const allResults = [...nameResults, ...skuResults];
      const uniqueResults = allResults.filter(
        (item, index, self) => index === self.findIndex(t => t.id === item.id),
      );

      return uniqueResults;
    } catch (error) {
      console.error('Error searching inventory:', error);
      throw new Error('Failed to search inventory');
    }
  }
}

export const inventoryService = new InventoryService();
