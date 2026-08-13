import api from "./api";

export interface Subcategory {
  id: string;
  name: string;
  description?: string;
  category: {
    id: string;
    name: string;
  };
}

export const getSubcategories = async (
  categoryId?: string,
): Promise<Subcategory[]> => {
  const url = categoryId
    ? `/subcategories?categoryId=${categoryId}`
    : "/subcategories";

  const response = await api.get(url);

  return response.data;
};