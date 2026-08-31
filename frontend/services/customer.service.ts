import api from "./api";

export interface Customer {
  id: number;
  customerCode: string;
  customerName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerPayload {
  customerName: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  isActive?: boolean;
}

export interface UpdateCustomerPayload {
  customerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  isActive?: boolean;
}

export interface PurchaseHistoryResponse {
  success: boolean;
  customer: {
    id: number;
    customerCode: string;
    customerName: string;
  };
  summary: {
    totalPurchases: number;
    totalPurchaseAmount: number;
    totalPaidAmount: number;
    totalOutstandingAmount: number;
  };
  purchases: unknown[];
}

const customerService = {
  async getCustomers(): Promise<Customer[]> {
    const response = await api.get("/customers");

    return response.data;
  },

  async getCustomer(id: number): Promise<Customer> {
    const response = await api.get(`/customers/${id}`);

    return response.data;
  },

  async createCustomer(
    data: CreateCustomerPayload,
  ): Promise<Customer> {
    const response = await api.post(
      "/customers",
      data,
    );

    return response.data;
  },

  async updateCustomer(
    id: number,
    data: UpdateCustomerPayload,
  ): Promise<Customer> {
    const response = await api.patch(
      `/customers/${id}`,
      data,
    );

    return response.data;
  },

  async deactivateCustomer(
    id: number,
  ): Promise<Customer> {
    const response = await api.delete(
      `/customers/${id}`,
    );

    return response.data;
  },

  async activateCustomer(
    id: number,
  ): Promise<Customer> {
    const response = await api.patch(
      `/customers/${id}/activate`,
    );

    return response.data;
  },

  async getPurchaseHistory(
    id: number,
  ): Promise<PurchaseHistoryResponse> {
    const response = await api.get(
      `/customers/${id}/purchase-history`,
    );

    return response.data;
  },
};

export default customerService;