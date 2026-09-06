import api from "@/services/api";

export interface DashboardSummary {
  todaySales: number;
  monthlySales: number;
  totalProducts: number;
  customers: number;
  lowStock: number;
  outOfStock: number;

  totalStock: number;
  stockValue: number;

  todayProfit: number;
  monthlyProfit: number;
  grossProfit: number;
  profitMargin: number;
}

export interface DashboardSale {
  id: string | number;
  invoiceNumber?: string;
  customerName?: string | null;
  grandTotal: number | string;
  createdAt: string;
  status?: string;
}

export interface SalesChartItem {
  date: string;
  sales: number;
}

export interface LowStockProduct {
  id: string | number;
  productCode?: string;
  productName?: string;
  stockQuantity?: number;
  reorderLevel?: number;
}

export interface DashboardData {
  summary: DashboardSummary;

  salesChart: SalesChartItem[];

  recentSales: DashboardSale[];

  lowStockProducts: LowStockProduct[];
}

export async function getDashboard(): Promise<DashboardData> {
  const response =
    await api.get<DashboardData>(
      "/dashboard",
    );

  return response.data;
}