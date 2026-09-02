import api from "./api";
import {
  CreateSalePayload,
  SaleInvoice,
  HeldBill,
  HoldBillPayload,
  ReturnSalePayload,
  ReturnResponse,
  CashClosingSummary,
} from "@/types/pos";

export const createSale = async (
  payload: CreateSalePayload,
): Promise<SaleInvoice> => {
  const response = await api.post("/pos/sales", payload);
  return response.data;
};

export const getSales = async (
  search?: string,
): Promise<SaleInvoice[]> => {
  const response = await api.get("/pos/sales", {
    params: { search },
  });
  return response.data;
};

export const getSaleById = async (
  idOrInvoice: string,
): Promise<SaleInvoice> => {
  const response = await api.get(`/pos/sales/${idOrInvoice}`);
  return response.data;
};

export const holdBill = async (
  payload: HoldBillPayload,
): Promise<HeldBill> => {
  const response = await api.post("/pos/hold", payload);
  return response.data;
};

export const getHeldBills = async (): Promise<HeldBill[]> => {
  const response = await api.get("/pos/hold");
  return response.data;
};

export const deleteHeldBill = async (
  id: string,
): Promise<void> => {
  await api.delete(`/pos/hold/${id}`);
};

export const processReturn = async (
  payload: ReturnSalePayload,
): Promise<ReturnResponse> => {
  const response = await api.post("/pos/returns", payload);
  return response.data;
};

export const getCashClosingSummary = async (
  date?: string,
): Promise<CashClosingSummary> => {
  const response = await api.get("/pos/cash-closing", {
    params: { date },
  });
  return response.data;
};

const posService = {
  createSale,
  getSales,
  getSaleById,
  holdBill,
  getHeldBills,
  deleteHeldBill,
  processReturn,
  getCashClosingSummary,
};

export default posService;
