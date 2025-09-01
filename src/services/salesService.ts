import { db, authService } from '../config/firebase';

export interface SaleData {
  itemId?: string | null;
  sku: string;
  name?: string | null;
  customer: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paidCash: number;
  paidOnline: number;
  paymentPlatform?: string | null;
  transactionId?: string | null;
  paidAmount: number;
  remainingAmount: number;
  createdAt: any;
  // Audit / ownership fields
  createdBy?: string | null;
  userId?: string | null; // duplicate/compat field for rules that expect `userId`
  createdByName?: string | null;
  authorizedBy?: string | null;
  updatedAt?: any;
  status?: string;
}

export interface Sale extends SaleData {
  id: string;
  productName?: string;
}

export interface EnrichedSale extends SaleData {
  id: string;
  productName: string;
}

class SalesService {
  private salesCollection = db.collection('sales');
  private inventoryCollection = db.collection('inventory');

  /**
   * Get the start of today for date filtering
   */
  private getTodayStart(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Create a new sale record
   */
  async createSale(saleData: Omit<SaleData, 'createdAt'>): Promise<string> {
    try {
      const now = new Date();
      const currentUser = authService ? authService.currentUser : null;

      const saleWithTimestamp: SaleData = {
        ...saleData,
        createdAt: now,
        updatedAt: now,
        // Audit fields injected server-side by the service
        createdBy: currentUser ? currentUser.uid : null,
        userId: currentUser ? currentUser.uid : null,
        createdByName: currentUser
          ? currentUser.displayName || currentUser.email || null
          : null,
        authorizedBy: currentUser ? currentUser.uid : null,
      };

      // Remove undefined values to prevent Firestore errors
      const cleanedSaleData: Record<string, any> = {};
      Object.entries(saleWithTimestamp).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedSaleData[key] = value;
        }
      });

      const docRef = await this.salesCollection.add(cleanedSaleData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw new Error('Failed to create sale record');
    }
  }

  /**
   * Get today's sales with product name enrichment
   */
  async getTodaySales(): Promise<EnrichedSale[]> {
    try {
      const currentUser = authService ? authService.currentUser : null;
      let query: any = this.salesCollection;
      if (currentUser) query = query.where('createdBy', '==', currentUser.uid);
      query = query
        .where('createdAt', '>=', this.getTodayStart())
        .orderBy('createdAt', 'desc');
      const snapshot = await query.get();

      const rawSales = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...(doc.data() as SaleData),
      }));

      return await this.enrichSalesWithProductNames(rawSales);
    } catch (error: any) {
      // Detect the Firestore composite index error and give a clear, actionable message
      const message = String(error?.message || error);
      if (
        error?.code === 'failed-precondition' ||
        /requires an index/i.test(message)
      ) {
        console.error(
          'Firestore composite index required for sales queries:',
          message,
        );
        throw new Error(
          'Firestore requires a composite index for this query (sales: createdBy + createdAt).\n' +
            "Add a composite index for collection 'sales' with fields: createdBy (ASCENDING), createdAt (DESCENDING).\n" +
            'You can add it in the Firebase Console (Firestore > Indexes) or via firebase.json.\n' +
            'Example firebase.json snippet:\n' +
            JSON.stringify(
              {
                firestore: {
                  indexes: [
                    {
                      collectionGroup: 'sales',
                      queryScope: 'COLLECTION',
                      fields: [
                        { fieldPath: 'createdBy', order: 'ASCENDING' },
                        { fieldPath: 'createdAt', order: 'DESCENDING' },
                      ],
                    },
                  ],
                },
              },
              null,
              2,
            ),
        );
      }

      console.error("Error fetching today's sales:", error);
      throw new Error('Failed to fetch sales data');
    }
  }

  /**
   * Enrich sales with product names from inventory
   */
  private async enrichSalesWithProductNames(
    sales: (SaleData & { id: string })[],
  ): Promise<EnrichedSale[]> {
    try {
      // Get unique item IDs and SKUs
      const itemIds = Array.from(
        new Set(sales.map(s => s.itemId).filter(Boolean)),
      ) as string[];
      const skus = Array.from(new Set(sales.map(s => s.sku).filter(Boolean)));

      // Fetch inventory data by IDs
      const inventoryById: Record<string, any> = {};
      if (itemIds.length > 0) {
        const itemDocs = await Promise.all(
          itemIds.map(id => this.inventoryCollection.doc(id).get()),
        );

        const currentUser = authService ? authService.currentUser : null;
        itemDocs.forEach((doc: any) => {
          if (doc.exists()) {
            const data = doc.data();
            // Skip inventory items owned by other users
            if (
              data?.createdBy &&
              currentUser &&
              data.createdBy !== currentUser.uid
            )
              return;
            inventoryById[doc.id] = data;
          }
        });
      }

      // Fetch inventory data by SKUs
      const inventoryBySku: Record<string, any> = {};
      if (skus.length > 0) {
        const currentUser = authService ? authService.currentUser : null;
        const skuQueries = await Promise.all(
          skus.map(sku => {
            let q: any = this.inventoryCollection
              .where('sku', '==', sku)
              .limit(1);
            if (currentUser) q = q.where('createdBy', '==', currentUser.uid);
            return q.get();
          }),
        );

        skuQueries.forEach((querySnapshot: any) => {
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            if (data?.sku) {
              inventoryBySku[data.sku] = data;
            }
          }
        });
      }

      // Enrich sales with product names
      return sales.map(sale => ({
        ...sale,
        productName: this.getProductName(sale, inventoryById, inventoryBySku),
      }));
    } catch (error) {
      console.error('Error enriching sales:', error);
      // Return sales without enrichment if enrichment fails
      return sales.map(sale => ({
        ...sale,
        productName: sale.name || sale.sku || sale.id,
      }));
    }
  }

  /**
   * Determine the best product name for a sale
   */
  private getProductName(
    sale: SaleData & { id: string },
    inventoryById: Record<string, any>,
    inventoryBySku: Record<string, any>,
  ): string {
    // Priority: inventory name by itemId > inventory name by SKU > sale name > SKU > ID
    return (
      (sale.itemId ? inventoryById[sale.itemId]?.name : undefined) ||
      (sale.sku ? inventoryBySku[sale.sku]?.name : undefined) ||
      sale.name ||
      sale.sku ||
      sale.id
    );
  }

  /**
   * Get sales by date range
   */
  async getSalesByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<EnrichedSale[]> {
    try {
      const currentUser = authService ? authService.currentUser : null;
      let query: any = this.salesCollection;
      if (currentUser) query = query.where('createdBy', '==', currentUser.uid);
      query = query
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .orderBy('createdAt', 'desc');
      const snapshot = await query.get();

      const rawSales = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...(doc.data() as SaleData),
      }));

      return await this.enrichSalesWithProductNames(rawSales);
    } catch (error: any) {
      const message = String(error?.message || error);
      if (
        error?.code === 'failed-precondition' ||
        /requires an index/i.test(message)
      ) {
        console.error(
          'Firestore composite index required for sales date-range queries:',
          message,
        );
        throw new Error(
          'Firestore requires a composite index for this query (sales: createdBy + createdAt).\n' +
            "Add a composite index for collection 'sales' with fields: createdBy (ASCENDING), createdAt (DESCENDING).\n" +
            'You can add it in the Firebase Console (Firestore > Indexes) or via firebase.json.',
        );
      }

      console.error('Error fetching sales by date range:', error);
      throw new Error('Failed to fetch sales data');
    }
  }

  /**
   * Update a sale record
   */
  async updateSale(saleId: string, updates: Partial<SaleData>): Promise<void> {
    try {
      const doc = await this.salesCollection.doc(saleId).get();
      const owner = doc.exists() ? (doc.data() as any)?.createdBy : null;
      const currentUser = authService ? authService.currentUser : null;
      if (owner && owner !== currentUser?.uid) {
        throw new Error('permission-denied');
      }
      await this.salesCollection.doc(saleId).update(updates);
    } catch (error) {
      console.error('Error updating sale:', error);
      throw new Error('Failed to update sale record');
    }
  }

  /**
   * Delete a sale record
   */
  async deleteSale(saleId: string): Promise<void> {
    try {
      const doc = await this.salesCollection.doc(saleId).get();
      const owner = doc.exists() ? (doc.data() as any)?.createdBy : null;
      const currentUser = authService ? authService.currentUser : null;
      if (owner && owner !== currentUser?.uid) {
        throw new Error('permission-denied');
      }
      await this.salesCollection.doc(saleId).delete();
    } catch (error) {
      console.error('Error deleting sale:', error);
      throw new Error('Failed to delete sale record');
    }
  }
}

export const salesService = new SalesService();
