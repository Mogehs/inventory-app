export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  sku: string;
  categoryId: string;
  supplierId: string;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  unitPrice: number;
  costPrice: number;
  barcode?: string;
  imageUrl?: string;
  location: string;
  status: 'active' | 'inactive' | 'discontinued';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  type: 'in' | 'out' | 'adjustment';
  itemId: string;
  quantity: number;
  unitPrice?: number;
  totalValue: number;
  reason: string;
  referenceNumber?: string;
  supplierId?: string;
  userId: string;
  notes?: string;
  createdAt: Date;
}

export interface StockAlert {
  id: string;
  itemId: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock';
  message: string;
  isRead: boolean;
  createdAt: Date;
}
