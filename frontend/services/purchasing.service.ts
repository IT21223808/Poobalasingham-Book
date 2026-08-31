import api from "./api";

// =========================================================
// PRODUCT
// =========================================================

export interface Product {
  id: string;
  productName?: string;
  name?: string;
  productCode?: string;
}

// =========================================================
// LOCATION
// =========================================================

export interface Location {
  id: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

// =========================================================
// PURCHASE REQUISITION
// =========================================================

export interface PurchaseRequisition {
  id: number;
  requisitionNumber: string;
  status: string;
  items: PurchaseRequisitionItem[];
  createdAt: string;
}

export interface PurchaseRequisitionItem {
  id?: number;
  productId: string;
  quantity: number;
  product?: Product;
}

// =========================================================
// PURCHASE ORDER
// =========================================================

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  requisitionId?: number;
  status: string;
  totalAmount: number;
  items: PurchaseOrderItem[];
  createdAt: string;
}

export interface PurchaseOrderItem {
  id?: number;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: Product;
}

// =========================================================
// GRN
// =========================================================

export interface GRN {
  id: number;
  grnNumber: string;
  purchaseOrderId: number;
  locationId?: string;
  status: string;
  items: GRNItem[];
  createdAt: string;
}

export interface GRNItem {
  id?: number;
  grnId?: number;
  productId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  product?: Product;
}

// =========================================================
// PURCHASE INVOICE
// =========================================================

export interface PurchaseInvoice {
  id: number;
  invoiceNumber: string;
  purchaseOrderId: number;
  grnId: number;
  supplierId?: number | null;

  invoiceDate?: string;
  dueDate?: string | null;

  paymentStatus?: string;
  status?: string;

  subtotal: number;
  tax?: number;
  discount?: number;

  taxAmount?: number;
  discountAmount?: number;

  grandTotal?: number;
  totalAmount?: number;

  items: PurchaseInvoiceItem[];
  createdAt: string;
}

export interface PurchaseInvoiceItem {
  id?: number;
  invoiceId?: number;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: Product;
}

// =========================================================
// PURCHASE RETURN
// =========================================================

export interface PurchaseReturn {
  id: number;

  returnNumber: string;

  purchaseOrderId: number;

  invoiceId?: number | null;

  locationId?: string;

  reason?: string | null;

  status: string;

  items: PurchaseReturnItem[];

  createdAt: string;
}

export interface PurchaseReturnItem {
  id?: number;

  returnId?: number;

  productId: string;

  quantity: number;

  product?: Product;
}

// =========================================================
// DASHBOARD
// =========================================================

export interface DashboardData {
  summary: {
    totalRequisitions: number;
    pendingRequisitions: number;

    totalPurchaseOrders: number;
    pendingPurchaseOrders: number;

    totalGoodsReceived: number;
    totalPurchaseReturns: number;

    totalPurchaseInvoices: number;
    postedPurchaseInvoices: number;

    cancelledPurchaseOrders: number;
  };

  overview: {
    totalPurchaseAmount: number;
    orders: number;
    received: number;
    pending: number;
    approved: number;
    cancelled: number;
  };

  status: {
    pending: number;
    approved: number;
    received: number;
    cancelled: number;
  };

  recentOrders: PurchaseOrder[];
  recentGRNs: GRN[];
  recentReturns: PurchaseReturn[];
  recentInvoices: PurchaseInvoice[];
}

// =========================================================
// REQUISITION PAYLOAD
// =========================================================

export interface CreateRequisitionPayload {
  items: {
    productId: string;
    quantity: number;
  }[];
}

// =========================================================
// PURCHASE ORDER PAYLOAD
// =========================================================

export interface CreatePurchaseOrderPayload {
  requisitionId: number;

  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

// =========================================================
// GRN PAYLOAD
// =========================================================

export interface CreateGRNPayload {
  purchaseOrderId: number;

  locationId: string;

  items: {
    productId: string;
    receivedQuantity: number;
  }[];
}

export type UpdateGRNPayload =
  CreateGRNPayload;

// =========================================================
// INVOICE PAYLOAD
// =========================================================

export interface CreateInvoicePayload {
  supplierId: number;

  purchaseOrderId: number;

  grnId: number;

  invoiceDate?: string;

  dueDate?: string;

  taxAmount?: number;

  discountAmount?: number;

  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

// =========================================================
// PURCHASE RETURN PAYLOAD
// =========================================================

export interface CreateReturnPayload {
  purchaseOrderId: number;

  invoiceId?: number;

  locationId: string;

  reason?: string;

  items: {
    productId: string;
    quantity: number;
  }[];
}

export type UpdateReturnPayload =
  CreateReturnPayload;

// =========================================================
// PURCHASING SERVICE
// =========================================================

export const purchasingService = {
  // =======================================================
  // LOCATIONS
  // =======================================================

  getLocations: async (): Promise<Location[]> => {
    const response = await api.get(
      "/inventory/locations"
    );

    const result = response.data;

    const locations = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
      ? result.data
      : [];

    return locations;
  },

  // =======================================================
  // REQUISITIONS
  // =======================================================

  getRequisitions:
    async (): Promise<PurchaseRequisition[]> => {
      const response = await api.get(
        "/purchasing/requisitions"
      );

      return response.data;
    },

  getRequisition: async (
    id: number
  ): Promise<PurchaseRequisition> => {
    const response = await api.get(
      `/purchasing/requisitions/${id}`
    );

    return response.data;
  },

  createRequisition: async (
    data: CreateRequisitionPayload
  ): Promise<PurchaseRequisition> => {
    const response = await api.post(
      "/purchasing/requisitions",
      data
    );

    return response.data;
  },

  // =======================================================
  // PURCHASE ORDERS
  // =======================================================

  getOrders:
    async (): Promise<PurchaseOrder[]> => {
      const response = await api.get(
        "/purchasing/orders"
      );

      return response.data;
    },

  getOrder: async (
    id: number
  ): Promise<PurchaseOrder> => {
    const response = await api.get(
      `/purchasing/orders/${id}`
    );

    return response.data;
  },

  createOrder: async (
    data: CreatePurchaseOrderPayload
  ): Promise<PurchaseOrder> => {
    const response = await api.post(
      "/purchasing/orders",
      data
    );

    return response.data;
  },

  updateOrder: async (
    id: number,
    data: CreatePurchaseOrderPayload
  ): Promise<PurchaseOrder> => {
    const response = await api.put(
      `/purchasing/orders/${id}`,
      data
    );

    return response.data;
  },

  approveOrder: async (
    id: number
  ): Promise<PurchaseOrder> => {
    const response = await api.patch(
      `/purchasing/orders/${id}/approve`
    );

    return response.data;
  },

  cancelOrder: async (
    id: number
  ): Promise<PurchaseOrder> => {
    const response = await api.patch(
      `/purchasing/orders/${id}/cancel`
    );

    return response.data;
  },

  deleteOrder: async (
    id: number
  ) => {
    const response = await api.delete(
      `/purchasing/orders/${id}`
    );

    return response.data;
  },

  // =======================================================
  // GRN
  // =======================================================

  getGRNs: async (): Promise<GRN[]> => {
    const response = await api.get(
      "/purchasing/grn"
    );

    return response.data;
  },

  getGRN: async (
    id: number
  ): Promise<GRN> => {
    const response = await api.get(
      `/purchasing/grn/${id}`
    );

    return response.data;
  },

  createGRN: async (
    data: CreateGRNPayload
  ): Promise<GRN> => {
    const response = await api.post(
      "/purchasing/grn",
      data
    );

    return response.data;
  },

  updateGRN: async (
    id: number,
    data: UpdateGRNPayload
  ): Promise<GRN> => {
    const response = await api.put(
      `/purchasing/grn/${id}`,
      data
    );

    return response.data;
  },

  deleteGRN: async (
    id: number
  ) => {
    const response = await api.delete(
      `/purchasing/grn/${id}`
    );

    return response.data;
  },

  cancelGrn: async (
    id: number
  ): Promise<GRN> => {
    const response = await api.patch(
      `/purchasing/grn/${id}/cancel`
    );

    return response.data;
  },

  // =======================================================
  // PURCHASE INVOICES
  // =======================================================

  getInvoices:
    async (): Promise<PurchaseInvoice[]> => {
      const response = await api.get(
        "/purchasing/invoices"
      );

      return response.data;
    },

  getInvoice: async (
    id: number
  ): Promise<PurchaseInvoice> => {
    const response = await api.get(
      `/purchasing/invoices/${id}`
    );

    return response.data;
  },

  createInvoice: async (
    data: CreateInvoicePayload
  ): Promise<PurchaseInvoice> => {
    const response = await api.post(
      "/purchasing/invoices",
      data
    );

    return response.data;
  },

  updateInvoice: async (
  id: number,
  data: CreateInvoicePayload
): Promise<PurchaseInvoice> => {
  const response = await api.put(
    `/purchasing/invoices/${id}`,
    data
  );

  return response.data;
},

  // =======================================================
  // PURCHASE RETURNS
  // =======================================================

  getReturns:
    async (): Promise<PurchaseReturn[]> => {
      const response = await api.get(
        "/purchasing/returns"
      );

      return response.data;
    },

  getReturn: async (
    id: number
  ): Promise<PurchaseReturn> => {
    const response = await api.get(
      `/purchasing/returns/${id}`
    );

    return response.data;
  },

  createReturn: async (
    data: CreateReturnPayload
  ): Promise<PurchaseReturn> => {
    const response = await api.post(
      "/purchasing/returns",
      data
    );

    return response.data;
  },

  updateReturn: async (
    id: number,
    data: UpdateReturnPayload
  ): Promise<PurchaseReturn> => {
    const response = await api.put(
      `/purchasing/returns/${id}`,
      data
    );

    return response.data;
  },

  cancelReturn: async (id: number) => {
  const response = await api.patch(
    `/purchasing/returns/${id}/cancel`,
  );

  return response.data;
},

  // =======================================================
  // DASHBOARD
  // =======================================================

  getDashboard:
    async (): Promise<DashboardData> => {
      const response = await api.get(
        "/purchasing/dashboard"
      );

      return response.data;
    },
};
