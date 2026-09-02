import { Product } from "@/services/product.service";
import { Customer } from "@/services/customer.service";

export interface PosCartItem {
  productId: string; // Product UUID
  productCode: string;
  productName: string;
  barcode?: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  discountAmount: number; // Item-level discount
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
  items: {
    productId: string;
    productCode: string;
    productName: string;
    barcode?: string;
    unitPrice: number;
    quantity: number;
    discountAmount: number;
    lineTotal: number;
  }[];
  payments: PosPaymentDetail[];
  heldBillId?: string;
  notes?: string;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  status: "COMPLETED" | "CANCELLED" | "RETURNED" | "PARTIALLY_RETURNED";
  customerId?: number | null;
  customerName?: string | null;
  cashierId?: string | null;
  items: {
    id: string;
    productId: string;
    productCode: string;
    productName: string;
    barcode?: string;
    unitPrice: number;
    quantity: number;
    discountAmount: number;
    lineTotal: number;
  }[];
  payments: {
    id: string;
    paymentMethod: PaymentMethod;
    amount: number;
    amountReceived?: number;
    changeAmount?: number;
    referenceNumber?: string;
  }[];
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
  cartData: Record<string, any>;
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
