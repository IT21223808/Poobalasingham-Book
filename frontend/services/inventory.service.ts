import api from "./api";

// ========================================
// STOCK IN
// ========================================

export interface StockInPayload {
  productId: string;
  quantity: number;
}

export interface StockInResponse {
  success: boolean;
  message: string;
  data: {
    productId: string;
    productName: string;
    quantityAdded: number;
    previousStock: number;
    newStock: number;
    movementId: string;
  };
}

export const stockIn = async (
  data: StockInPayload,
): Promise<StockInResponse> => {
  const response = await api.post(
    "/inventory/stock-in",
    data,
  );

  return response.data;
};

// ========================================
// STOCK OUT
// ========================================

export interface StockOutPayload {
  productId: string;
  quantity: number;
}

export interface StockOutResponse {
  success: boolean;
  message: string;
  data: {
    productId: string;
    productName: string;
    quantityRemoved: number;
    previousStock: number;
    newStock: number;
    movementId: string;
  };
}

export const stockOut = async (
  data: StockOutPayload,
): Promise<StockOutResponse> => {
  const response = await api.post(
    "/inventory/stock-out",
    data,
  );

  return response.data;
};

// ========================================
// MOVEMENT TYPES
// ========================================

export type MovementType =
  | "IN"
  | "OUT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

// ========================================
// PRODUCT IN MOVEMENT
// ========================================

export interface StockMovementProduct {
  id: string;
  productName: string;
  productCode?: string;
  barcode?: string;
  isbn?: string;
}

// ========================================
// STOCK MOVEMENT
// ========================================

export interface StockMovement {
  id: string;

  product: StockMovementProduct;

  movementType: MovementType;

  quantity: number;

  previousStock: number;

  newStock: number;

  userId?: string | null;

  createdAt: string;
}

// ========================================
// GET MOVEMENTS
// ========================================

export interface MovementHistoryResponse {
  success: boolean;
  data: StockMovement[];
}

export const getMovements =
  async (): Promise<StockMovement[]> => {
    const response =
      await api.get<MovementHistoryResponse>(
        "/inventory/movements",
      );

    return response.data.data;
  };