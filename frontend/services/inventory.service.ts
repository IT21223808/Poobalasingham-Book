import api from "./api";

// ======================================================
// TYPES
// ======================================================

export interface Product {
  id: string;
  productCode: string;
  barcode?: string | null;
  isbn?: string | null;
  productName: string;

  author?: string | null;
  publisher?: string | null;
  language?: string | null;
  grade?: string | null;
  subject?: string | null;
  edition?: string | null;
  brand?: string | null;

  purchasePrice?: number | string;
  sellingPrice?: number | string;
  wholesalePrice?: number | string;

  stockQuantity?: number;
  reorderLevel?: number;

  imageUrl?: string | null;

  category?: {
    id: string;
    name: string;
  } | null;

  subcategory?: {
    id: string;
    name: string;
  } | null;
}

// ======================================================
// LOCATION
// ======================================================

export interface Location {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ======================================================
// INVENTORY STOCK
// ======================================================

export interface InventoryStock {
  id: string;
  quantity: number;

  product: Product;

  location: Location;

  createdAt?: string;
  updatedAt?: string;
}

// ======================================================
// STOCK MOVEMENT
// ======================================================

export type MovementType =
  | "IN"
  | "OUT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "PHYSICAL_COUNT"
  | "DAMAGED"
  | "LOST";

export interface StockMovement {
  id: string;

  product: Product;

  movementType: MovementType;

  quantity: number;

  previousStock: number;

  newStock: number;

  // ----------------------------------------
  // LOCATION
  // ----------------------------------------

  fromLocation?: Location | null;

  toLocation?: Location | null;

  // ----------------------------------------
  // OTHER
  // ----------------------------------------

  userId?: string | null;

  reason?: string | null;

  createdAt: string;
}

// ======================================================
// DASHBOARD
// ======================================================

export interface LowStockProduct {
  id: string;
  productName: string;
  stockQuantity: number;
  reorderLevel: number;
}

export interface InventoryDashboard {
  summary: {
    totalProducts: number;
    totalStock: number;
    lowStock: number;
    locations: number;
  };

  recentMovements: StockMovement[];

  lowStockProducts: LowStockProduct[];
}

// ======================================================
// STOCK IN / OUT
// ======================================================

export interface StockInPayload {
  productId: string;
  quantity: number;
  locationId?: string;
}

export interface StockOutPayload {
  productId: string;
  quantity: number;
  locationId?: string;
}

export interface StockResponse {
  success: boolean;
  message: string;

  data: {
    productId: string;
    productName: string;

    locationId?: string | null;
    locationName?: string | null;

    quantityAdded?: number;
    quantityRemoved?: number;

    previousStock: number;
    newStock: number;

    locationPreviousStock?: number;
    locationNewStock?: number;

    movementId: string;
  };
}

// ======================================================
// LOCATION
// ======================================================

export interface CreateLocationPayload {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateLocationPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// ======================================================
// STOCK TRANSFER
// ======================================================

export interface StockTransferPayload {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
}

export interface StockTransferLocationData {
  id: string;
  name: string;
  previousStock: number;
  newStock: number;
}

export interface StockTransferResponse {
  success: boolean;
  message: string;

  data: {
    productId: string;
    productName: string;

    fromLocation: StockTransferLocationData;

    toLocation: StockTransferLocationData;

    quantityTransferred: number;

    productTotalStock: number;

    movementId: string;

    transferOutMovementId: string;

    transferInMovementId: string;
  };
}

// ======================================================
// STOCK ADJUSTMENT
// ======================================================

export type AdjustmentType = "INCREASE" | "DECREASE";

export interface StockAdjustmentPayload {
  productId: string;
  adjustmentType: AdjustmentType;
  quantity: number;
  reason?: string;
}

export interface StockAdjustmentResponse {
  success: boolean;
  message: string;

  data: {
    productId: string;
    productName: string;

    adjustmentType: AdjustmentType;

    quantityAdjusted: number;

    previousStock: number;
    newStock: number;

    reason?: string | null;

    movementId: string;
  };
}

// ======================================================
// PHYSICAL STOCK COUNT
// ======================================================

export interface PhysicalStockCountPayload {
  productId: string;
  physicalQuantity: number;
  note?: string;
}

export interface PhysicalStockCountResponse {
  success: boolean;
  message: string;

  data: {
    productId: string;
    productName: string;

    systemStock: number;
    physicalStock: number;
    difference: number;
    newStock: number;

    movementId?: string | null;
  };
}

// ======================================================
// DAMAGED / LOST
// ======================================================

export type DamagedLostType = "DAMAGED" | "LOST";

export interface DamagedLostPayload {
  productId: string;
  quantity: number;
  type: DamagedLostType;
  reason?: string;
}

export interface DamagedLostResponse {
  success: boolean;
  message: string;

  data: {
    productId: string;
    productName: string;

    type: DamagedLostType;

    quantity: number;

    previousStock: number;
    newStock: number;

    reason?: string | null;

    movementId: string;
  };
}

// ======================================================
// STOCK IN
// ======================================================

export const stockIn = async (
  data: StockInPayload,
): Promise<StockResponse> => {
  const response = await api.post(
    "/inventory/stock-in",
    data,
  );

  return response.data;
};

// ======================================================
// STOCK OUT
// ======================================================

export const stockOut = async (
  data: StockOutPayload,
): Promise<StockResponse> => {
  const response = await api.post(
    "/inventory/stock-out",
    data,
  );

  return response.data;
};

// ======================================================
// MOVEMENT HISTORY
// ======================================================

export const getMovements = async (): Promise<
  StockMovement[]
> => {
  const response = await api.get(
    "/inventory/movements",
  );

  return response.data?.data ?? [];
};

// ======================================================
// INVENTORY DASHBOARD
// ======================================================

export const getDashboard =
  async (): Promise<InventoryDashboard> => {
    const response = await api.get(
      "/inventory/dashboard",
    );

    return response.data?.data;
  };

// ======================================================
// LOCATIONS
// ======================================================

export const getLocations = async (): Promise<
  Location[]
> => {
  const response = await api.get(
    "/inventory/locations",
  );

  return response.data?.data ?? [];
};

export const getLocation = async (
  id: string,
): Promise<Location> => {
  const response = await api.get(
    `/inventory/locations/${id}`,
  );

  return response.data?.data;
};

export const createLocation = async (
  data: CreateLocationPayload,
): Promise<Location> => {
  const response = await api.post(
    "/inventory/locations",
    data,
  );

  return response.data?.data;
};

export const updateLocation = async (
  id: string,
  data: UpdateLocationPayload,
): Promise<Location> => {
  const response = await api.patch(
    `/inventory/locations/${id}`,
    data,
  );

  return response.data?.data;
};

export const deleteLocation = async (
  id: string,
) => {
  const response = await api.delete(
    `/inventory/locations/${id}`,
  );

  return response.data;
};

// ======================================================
// LOCATION-WISE STOCK
// ======================================================

export const getLocationStock = async (
  locationId: string,
): Promise<InventoryStock[]> => {
  const response = await api.get(
    `/inventory/locations/${locationId}/stock`,
  );

  return response.data?.data ?? [];
};

// ======================================================
// STOCK TRANSFER
// ======================================================

export const stockTransfer = async (
  data: StockTransferPayload,
): Promise<StockTransferResponse> => {
  const response = await api.post(
    "/inventory/stock-transfer",
    data,
  );

  return response.data;
};

// ======================================================
// STOCK ADJUSTMENT
// ======================================================

export const stockAdjustment = async (
  data: StockAdjustmentPayload,
): Promise<StockAdjustmentResponse> => {
  const response = await api.post(
    "/inventory/stock-adjustment",
    data,
  );

  return response.data;
};

// ======================================================
// PHYSICAL STOCK COUNT
// ======================================================

export const physicalStockCount = async (
  data: PhysicalStockCountPayload,
): Promise<PhysicalStockCountResponse> => {
  const response = await api.post(
    "/inventory/physical-stock-count",
    data,
  );

  return response.data;
};

// ======================================================
// DAMAGED / LOST ITEMS
// ======================================================

export const recordDamagedLost = async (
  data: DamagedLostPayload,
): Promise<DamagedLostResponse> => {
  const response = await api.post(
    "/inventory/damaged-lost",
    data,
  );

  return response.data;
};