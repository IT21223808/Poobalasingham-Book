import api from "./api";

// ========================================
// TYPES
// ========================================

export type MovementType =
  | "IN"
  | "OUT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

// ========================================
// LOCATION
// ========================================

export interface Location {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationPayload {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface LocationResponse {
  success: boolean;
  message?: string;
  data: Location;
}

// ========================================
// INVENTORY STOCK
// ========================================

export interface InventoryStock {
  id: string;

  product: {
    id: string;
    productCode: string;
    barcode?: string | null;
    isbn?: string | null;
    productName: string;
    author?: string | null;
    sellingPrice?: number | string;
    stockQuantity?: number;
    reorderLevel?: number;
    imageUrl?: string | null;
  };

  location: Location;

  quantity: number;

  createdAt: string;
  updatedAt: string;
}

export interface LocationStockResponse {
  success: boolean;
  data: InventoryStock[];
}

// ========================================
// STOCK IN
// ========================================

export interface StockInPayload {
  productId: string;
  quantity: number;
  locationId?: string;
}

export interface StockInResponse {
  success: boolean;
  message: string;

  data: {
    productId: string;
    productName: string;

    locationId?: string | null;
    locationName?: string | null;

    quantityAdded: number;

    previousStock: number;
    newStock: number;

    locationPreviousStock: number;
    locationNewStock: number;

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
  locationId?: string;
}

export interface StockOutResponse {
  success: boolean;
  message: string;

  data: {
    productId: string;
    productName: string;

    locationId?: string | null;
    locationName?: string | null;

    quantityRemoved: number;

    previousStock: number;
    newStock: number;

    locationPreviousStock: number;
    locationNewStock: number;

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
// STOCK TRANSFER
// ========================================

export interface StockTransferPayload {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
}

export interface StockTransferResponse {
  success: boolean;
  message: string;

  data: {
    productId: string;
    productName: string;

    fromLocation: {
      id: string;
      name: string;
      previousStock: number;
      newStock: number;
    };

    toLocation: {
      id: string;
      name: string;
      previousStock: number;
      newStock: number;
    };

    quantityTransferred: number;

    movementId: string;
  };
}

export const stockTransfer = async (
  data: StockTransferPayload,
): Promise<StockTransferResponse> => {
  const response = await api.post(
    "/inventory/stock-transfer",
    data,
  );

  return response.data;
};

// ========================================
// MOVEMENT HISTORY
// ========================================

export interface StockMovementProduct {
  id: string;
  productCode: string;
  barcode?: string | null;
  isbn?: string | null;
  productName: string;
}

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

export interface MovementHistoryResponse {
  success: boolean;
  data: StockMovement[];
}

export const getMovements =
  async (): Promise<StockMovement[]> => {
    const response = await api.get(
      "/inventory/movements",
    );

    return response.data.data;
  };

// ========================================
// GET LOCATIONS
// ========================================

export const getLocations =
  async (): Promise<Location[]> => {
    const response = await api.get(
      "/inventory/locations",
    );

    return response.data.data;
  };

// ========================================
// GET SINGLE LOCATION
// ========================================

export const getLocation = async (
  id: string,
): Promise<Location> => {
  const response = await api.get(
    `/inventory/locations/${id}`,
  );

  return response.data.data;
};

// ========================================
// GET LOCATION STOCK
// ========================================

export const getLocationStock =
  async (
    locationId: string,
  ): Promise<InventoryStock[]> => {
    const response = await api.get(
      `/inventory/locations/${locationId}/stock`,
    );

    return response.data.data;
  };

// ========================================
// CREATE LOCATION
// ========================================

export const createLocation =
  async (
    data: LocationPayload,
  ): Promise<Location> => {
    const response = await api.post(
      "/inventory/locations",
      data,
    );

    return response.data.data;
  };

// ========================================
// UPDATE LOCATION
// ========================================

export const updateLocation =
  async (
    id: string,
    data: LocationPayload,
  ): Promise<Location> => {
    const response = await api.patch(
      `/inventory/locations/${id}`,
      data,
    );

    return response.data.data;
  };

// ========================================
// DELETE LOCATION
// ========================================

export const deleteLocation = async (
  id: string,
) => {
  const response = await api.delete(
    `/inventory/locations/${id}`,
  );

  return response.data;
};