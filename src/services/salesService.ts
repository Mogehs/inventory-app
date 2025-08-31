import firestore, { collection } from '@react-native-firebase/firestore';

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
  private salesCollection = collection(firestore(), 'sales');
  private inventoryCollection = collection(firestore(), 'inventory');

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
      const saleWithTimestamp: SaleData = {
        ...saleData,
        createdAt: firestore.Timestamp.now(),
      };

      const docRef = await this.salesCollection.add(saleWithTimestamp);
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
      const snapshot = await this.salesCollection
        .where(
          'createdAt',
          '>=',
          firestore.Timestamp.fromDate(this.getTodayStart()),
        )
        .orderBy('createdAt', 'desc')
        .get();

      const rawSales = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...(doc.data() as SaleData),
      }));

      return await this.enrichSalesWithProductNames(rawSales);
    } catch (error) {
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

        itemDocs.forEach((doc: any) => {
          const docExists =
            typeof doc.exists === 'function' ? doc.exists() : !!doc.exists;
          if (docExists) {
            inventoryById[doc.id] = doc.data();
          }
        });
      }

      // Fetch inventory data by SKUs
      const inventoryBySku: Record<string, any> = {};
      if (skus.length > 0) {
        const skuQueries = await Promise.all(
          skus.map(sku =>
            this.inventoryCollection.where('sku', '==', sku).limit(1).get(),
          ),
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
      const snapshot = await this.salesCollection
        .where('createdAt', '>=', firestore.Timestamp.fromDate(startDate))
        .where('createdAt', '<=', firestore.Timestamp.fromDate(endDate))
        .orderBy('createdAt', 'desc')
        .get();

      const rawSales = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...(doc.data() as SaleData),
      }));

      return await this.enrichSalesWithProductNames(rawSales);
    } catch (error) {
      console.error('Error fetching sales by date range:', error);
      throw new Error('Failed to fetch sales data');
    }
  }

  /**
   * Update a sale record
   */
  async updateSale(saleId: string, updates: Partial<SaleData>): Promise<void> {
    try {
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
      await this.salesCollection.doc(saleId).delete();
    } catch (error) {
      console.error('Error deleting sale:', error);
      throw new Error('Failed to delete sale record');
    }
  }
}

export const salesService = new SalesService();
