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
  category: string;
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

export interface Sale {
  id: string;
  itemId?: string;
  sku: string;
  name?: string;
  customer: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paidCash: number;
  paidOnline: number;
  paymentPlatform?: string;
  transactionId?: string;
  paidAmount: number;
  remainingAmount: number;
  status: 'completed' | 'partial' | 'pending';
  notes?: string;
  createdAt: any; // Firestore timestamp
  // Audit fields
  createdBy?: string | null;
  userId?: string | null; // compatibility with rules expecting userId
  updatedAt?: any;
  createdByName?: string | null;
  authorizedBy?: string | null;
  productName?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
}
