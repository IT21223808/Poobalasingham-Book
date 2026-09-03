
import type { Customer } from "@/services/customer.service";

export interface PosCartItem {
  productId: string;
  productCode: string;
  productName: string;
  barcode?: string | null;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  discountAmount: number;
  lineTotal: number;
  imageUrl?: string;
}

export type PaymentMethod = "CASH" | "CARD" | "QR";

export interface PosPaymentDetail {
  paymentMethod: PaymentMethod;
  amount: number;
  amountReceived?: number;
  changeAmount?: number;
  referenceNumber?: string;
}

export interface CreateSalePayload {
  customerId?: number;
  customerName?: string;

  subtotal: number;
  discountAmount: number;
  grandTotal: number;

  /**
   * Unique browser-generated ID.
   * Used to prevent duplicate creation
   * when offline sales are retried.
   */
  clientSaleId?: string;

  /**
   * POS branch / location.
   */
  locationId?: string;

  items: {
    productId: string;
    productCode: string;
    productName: string;
    barcode?: string | null;
    unitPrice: number;
    quantity: number;
    discountAmount: number;
    lineTotal: number;
  }[];

  payments: PosPaymentDetail[];

  heldBillId?: string;
  notes?: string;
}

export interface SaleInvoiceItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  barcode?: string | null;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
  lineTotal: number;
}

export interface SaleInvoicePayment {
  id: string;
  paymentMethod: PaymentMethod;
  amount: number;
  amountReceived?: number | null;
  changeAmount?: number | null;
  referenceNumber?: string | null;
}

export interface SaleLocation {
  id: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;

  subtotal: number;
  discountAmount: number;
  grandTotal: number;

  status:
    | "COMPLETED"
    | "CANCELLED"
    | "RETURNED"
    | "PARTIALLY_RETURNED";

  customerId?: number | null;
  customerName?: string | null;
  cashierId?: string | null;

  /**
   * Offline / exactly-once identifier.
   */
  clientSaleId?: string | null;

  /**
   * Branch / location.
   */
  locationId?: string | null;
  location?: SaleLocation | null;

  items: SaleInvoiceItem[];

  payments: SaleInvoicePayment[];

  createdAt: string;
}

export interface HeldBill {
  id: string;
  holdNumber: string;

  customerId?: number | null;
  customerName?: string | null;

  cartData: {
    items: PosCartItem[];
    customer?: Customer | null;

    discountAmount?: number;
    discountType?: "fixed" | "percentage";
    discountValue?: number;
  };

  subtotal: number;
  discountAmount: number;
  grandTotal: number;

  cashierId?: string | null;
  createdAt: string;
}

export interface HoldBillPayload {
  customerId?: number;
  customerName?: string;

  cartData: Record<string, unknown>;

  subtotal: number;
  discountAmount: number;
  grandTotal: number;
}

export interface ReturnSalePayload {
  saleId: string;
  reason: string;

  items: {
    productId: string;
    quantity: number;
    refundUnitPrice: number;
  }[];
}

export interface ReturnResponse {
  id: string;
  returnNumber: string;
  posSaleId: string;
  invoiceNumber: string;
  totalReturnAmount: number;
  reason: string;
  createdAt: string;
}

export interface CashClosingSummary {
  date: string;

  totalTransactions: number;

  openingCash: number;
  cashSales: number;
  cardSales: number;
  qrSales: number;

  totalSales: number;

  refundsCount: number;
  totalRefunds: number;

  expectedCash: number;
}
