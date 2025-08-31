export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface SaleFormData {
  customer: string;
  sku: string;
  name: string;
  quantity: string;
  unitPrice: string;
  paidCash: string;
  paidOnline: string;
  paymentPlatform: string;
  transactionId: string;
}

class ValidationService {
  /**
   * Parse and validate numeric input
   */
  parseNumber(value: any): number {
    const cleanValue = String(value).replace(/[^0-9.-]+/g, '');
    const parsed = Number(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validate phone number format (basic)
   */
  validatePhone(phone: string): boolean {
    const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
    return phoneRegex.test(phone.trim());
  }

  /**
   * Validate SKU format (alphanumeric with hyphens/underscores)
   */
  validateSku(sku: string): boolean {
    const skuRegex = /^[A-Za-z0-9\-_]+$/;
    return skuRegex.test(sku.trim()) && sku.trim().length >= 2;
  }

  /**
   * Validate customer name
   */
  validateCustomerName(name: string): string | null {
    const trimmed = name.trim();

    if (!trimmed) {
      return 'Customer name is required';
    }

    if (trimmed.length < 2) {
      return 'Customer name must be at least 2 characters';
    }

    if (trimmed.length > 100) {
      return 'Customer name must be less than 100 characters';
    }

    // Basic name validation (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s\-'.]+$/;
    if (!nameRegex.test(trimmed)) {
      return 'Customer name contains invalid characters';
    }

    return null;
  }

  /**
   * Validate product SKU
   */
  validateProductSku(sku: string): string | null {
    const trimmed = sku.trim();

    if (!trimmed) {
      return 'SKU is required';
    }

    if (trimmed.length < 2) {
      return 'SKU must be at least 2 characters';
    }

    if (trimmed.length > 50) {
      return 'SKU must be less than 50 characters';
    }

    if (!this.validateSku(trimmed)) {
      return 'SKU can only contain letters, numbers, hyphens, and underscores';
    }

    return null;
  }

  /**
   * Validate product name
   */
  validateProductName(name: string): string | null {
    const trimmed = name.trim();

    if (!trimmed) {
      return 'Product name is required';
    }

    if (trimmed.length < 2) {
      return 'Product name must be at least 2 characters';
    }

    if (trimmed.length > 200) {
      return 'Product name must be less than 200 characters';
    }

    return null;
  }

  /**
   * Validate quantity
   */
  validateQuantity(quantity: string): string | null {
    const parsed = this.parseNumber(quantity);

    if (parsed <= 0) {
      return 'Quantity must be greater than 0';
    }

    if (parsed > 10000) {
      return 'Quantity cannot exceed 10,000';
    }

    // Check if it's a whole number
    if (parsed !== Math.floor(parsed)) {
      return 'Quantity must be a whole number';
    }

    return null;
  }

  /**
   * Validate unit price
   */
  validateUnitPrice(price: string): string | null {
    const parsed = this.parseNumber(price);

    if (parsed <= 0) {
      return 'Unit price must be greater than 0';
    }

    if (parsed > 1000000) {
      return 'Unit price cannot exceed $1,000,000';
    }

    // Check for reasonable decimal places (max 2)
    const decimalPlaces = (price.split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return 'Unit price cannot have more than 2 decimal places';
    }

    return null;
  }

  /**
   * Validate payment amount
   */
  validatePaymentAmount(amount: string, label: string): string | null {
    if (!amount.trim()) {
      return null; // Optional field
    }

    const parsed = this.parseNumber(amount);

    if (parsed < 0) {
      return `${label} cannot be negative`;
    }

    if (parsed > 1000000) {
      return `${label} cannot exceed $1,000,000`;
    }

    // Check for reasonable decimal places (max 2)
    const decimalPlaces = (amount.split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return `${label} cannot have more than 2 decimal places`;
    }

    return null;
  }

  /**
   * Validate payment platform
   */
  validatePaymentPlatform(
    platform: string,
    hasOnlinePayment: boolean,
  ): string | null {
    const trimmed = platform.trim();

    if (hasOnlinePayment && !trimmed) {
      return 'Payment platform is required when online payment is specified';
    }

    if (trimmed && trimmed.length > 50) {
      return 'Payment platform name must be less than 50 characters';
    }

    return null;
  }

  /**
   * Validate transaction ID
   */
  validateTransactionId(transactionId: string): string | null {
    const trimmed = transactionId.trim();

    if (trimmed && trimmed.length > 100) {
      return 'Transaction ID must be less than 100 characters';
    }

    return null;
  }

  /**
   * Comprehensive validation for sale form
   */
  validateSaleForm(formData: SaleFormData): ValidationResult {
    const errors: Record<string, string> = {};

    // Validate customer
    const customerError = this.validateCustomerName(formData.customer);
    if (customerError) errors.customer = customerError;

    // Validate SKU
    const skuError = this.validateProductSku(formData.sku);
    if (skuError) errors.sku = skuError;

    // Validate product name (optional but if provided, should be valid)
    if (formData.name.trim()) {
      const nameError = this.validateProductName(formData.name);
      if (nameError) errors.name = nameError;
    }

    // Validate quantity
    const quantityError = this.validateQuantity(formData.quantity);
    if (quantityError) errors.quantity = quantityError;

    // Validate unit price
    const priceError = this.validateUnitPrice(formData.unitPrice);
    if (priceError) errors.unitPrice = priceError;

    // Validate payment amounts
    const cashError = this.validatePaymentAmount(
      formData.paidCash,
      'Cash payment',
    );
    if (cashError) errors.paidCash = cashError;

    const onlineError = this.validatePaymentAmount(
      formData.paidOnline,
      'Online payment',
    );
    if (onlineError) errors.paidOnline = onlineError;

    // Validate payment platform
    const hasOnlinePayment = this.parseNumber(formData.paidOnline) > 0;
    const platformError = this.validatePaymentPlatform(
      formData.paymentPlatform,
      hasOnlinePayment,
    );
    if (platformError) errors.paymentPlatform = platformError;

    // Validate transaction ID
    const transactionError = this.validateTransactionId(formData.transactionId);
    if (transactionError) errors.transactionId = transactionError;

    // Business logic validations
    const totalPrice =
      this.parseNumber(formData.quantity) *
      this.parseNumber(formData.unitPrice);
    const totalPaid =
      this.parseNumber(formData.paidCash) +
      this.parseNumber(formData.paidOnline);

    if (totalPaid > totalPrice) {
      errors.payment = 'Total payment cannot exceed the total price';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Get user-friendly error messages for common validation scenarios
   */
  getErrorMessage(field: string, value: string): string {
    switch (field) {
      case 'required':
        return `${value} is required`;
      case 'minLength':
        return `${value} is too short`;
      case 'maxLength':
        return `${value} is too long`;
      case 'invalid':
        return `${value} is invalid`;
      case 'duplicate':
        return `${value} already exists`;
      case 'notFound':
        return `${value} not found`;
      default:
        return 'Invalid input';
    }
  }
}

export const validationService = new ValidationService();
