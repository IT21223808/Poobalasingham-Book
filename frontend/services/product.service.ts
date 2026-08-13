import api from "./api";

export interface Product {
  id: string;
  productCode: string;
  barcode?: string;
  isbn?: string;
  productName: string;

  author?: string;
  publisher?: string;
  language?: string;
  grade?: string;
  subject?: string;
  edition?: string;
  brand?: string;

  purchasePrice?: number | string;
  sellingPrice?: number | string;
  wholesalePrice?: number | string;

  stockQuantity?: number;
  reorderLevel?: number;

  imageUrl?: string;

  category?: {
    id: string;
    name: string;
  };

  subcategory?: {
    id: string;
    name: string;
  };
}

export interface ProductPayload {
  productCode: string;
  barcode?: string;
  isbn?: string;
  productName: string;

  categoryId?: string;
  subcategoryId?: string;

  author?: string;
  publisher?: string;
  language?: string;
  grade?: string;
  subject?: string;
  edition?: string;
  brand?: string;

  purchasePrice?: number;
  sellingPrice?: number;
  wholesalePrice?: number;

  stockQuantity?: number;
  reorderLevel?: number;

  imageUrl?: string;
}

export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get("/products");

  return response.data;
};

export const getProduct = async (
  id: string,
): Promise<Product> => {
  const response = await api.get(
    `/products/${id}`,
  );

  return response.data;
};

export const createProduct = async (
  data: ProductPayload,
): Promise<Product> => {
  const response = await api.post(
    "/products",
    data,
  );

  return response.data;
};

export const updateProduct = async (
  id: string,
  data: ProductPayload,
): Promise<Product> => {
  const response = await api.patch(
    `/products/${id}`,
    data,
  );

  return response.data;
};

export const deleteProduct = async (
  id: string,
) => {
  const response = await api.delete(
    `/products/${id}`,
  );

  return response.data;
};