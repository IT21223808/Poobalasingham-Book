'use client';

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

/* =========================================================
   OFFLINE POS CONFIG
========================================================= */

const DB_NAME = "poobalasingham-pos";
const DB_VERSION = 1;
const STORE_NAME = "offline-sales";

const POS_QUEUE_UPDATED_EVENT =
  "pos-queue-updated";

const POS_OFFLINE_STATUS_EVENT =
  "pos-offline-status-changed";

const POS_SALE_COMPLETED_EVENT =
  "pos-sale-completed";

/* =========================================================
   OPENING BALANCE
========================================================= */

export interface OpeningBalanceResponse {
  id?: string;

  locationId: string;

  tillId?: number | null;

  openingBalance: number;

  openingDate?: string;

  businessDate?: string;

  createdBy?: number | null;

  createdAt?: string;
}

/* =========================================================
   CASH CLOSING
========================================================= */

export interface CloseCashPayload {
  actualCash: number;
  businessDate: string;
}

export interface CashClosingResult {
  id: string;

  locationId: string;

  tillId?: number | null;

  date?: string;

  businessDate: string;

  openingBalance: number;

  cashSales: number;

  cardSales?: number;

  qrSales?: number;

  totalSales?: number;

  refunds: number;

  totalRefunds?: number;

  refundsCount?: number;

  expectedCash: number;

  actualCash: number | null;

  difference: number | null;

  closedBy?: number | null;

  closedAt?: string | null;

  closed?: boolean;

  isClosed?: boolean;
}

/* =========================================================
   OFFLINE SALE RECORD
========================================================= */

export interface OfflineSaleRecord {
  clientSaleId: string;

  payload: CreateSalePayload;

  createdAt: string;
}

/* Prevent multiple sync processes from running together */

let syncRunning = false;

/* =========================================================
   CLIENT SALE ID
========================================================= */

function generateClientSaleId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `sale-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;
}

/* =========================================================
   ONLINE STATUS
========================================================= */

export function isOnline(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  return navigator.onLine;
}

/* =========================================================
   EVENTS
========================================================= */

function emitQueueUpdated(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(POS_QUEUE_UPDATED_EVENT),
  );
}

function emitOfflineStatus(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(POS_OFFLINE_STATUS_EVENT),
  );
}

function emitSaleCompleted(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(POS_SALE_COMPLETED_EVENT),
  );
}

/* =========================================================
   OPENING BALANCE - GET

   Branch/Till comes from logged-in user's JWT.
========================================================= */

export async function getOpeningBalance(): Promise<
  OpeningBalanceResponse | null
> {
  const response = await api.get(
    "/pos/opening-balance",
  );

  if (!response.data) {
    return null;
  }

  return {
    ...response.data,

    openingBalance: Number(
      response.data.openingBalance ?? 0,
    ),

    tillId:
      response.data.tillId !== undefined &&
      response.data.tillId !== null
        ? Number(response.data.tillId)
        : null,
  };
}

/* =========================================================
   OPENING BALANCE - SAVE

   Branch/Till comes from logged-in user's JWT.
========================================================= */

export async function saveOpeningBalance(
  openingBalance: number,
): Promise<OpeningBalanceResponse> {
  const numericOpeningBalance =
    Number(openingBalance);

  if (
    !Number.isFinite(numericOpeningBalance) ||
    numericOpeningBalance < 0
  ) {
    throw new Error(
      "Opening balance must be a valid non-negative amount.",
    );
  }

  const response = await api.post(
    "/pos/opening-balance",
    {
      openingBalance:
        numericOpeningBalance,
    },
  );

  return {
    ...response.data,

    openingBalance: Number(
      response.data.openingBalance ?? 0,
    ),

    tillId:
      response.data.tillId !== undefined &&
      response.data.tillId !== null
        ? Number(response.data.tillId)
        : null,
  };
}

/* =========================================================
   INDEXED DB
========================================================= */

function openDb(): Promise<IDBDatabase> {
  return new Promise(
    (resolve, reject) => {
      if (
        typeof window === "undefined"
      ) {
        reject(
          new Error(
            "IndexedDB is only available in the browser.",
          ),
        );

        return;
      }

      const request =
        indexedDB.open(
          DB_NAME,
          DB_VERSION,
        );

      request.onupgradeneeded = () => {
        const db =
          request.result;

        if (
          !db.objectStoreNames.contains(
            STORE_NAME,
          )
        ) {
          const store =
            db.createObjectStore(
              STORE_NAME,
              {
                keyPath:
                  "clientSaleId",
              },
            );

          store.createIndex(
            "createdAt",
            "createdAt",
            {
              unique: false,
            },
          );
        }
      };

      request.onsuccess = () => {
        resolve(
          request.result,
        );
      };

      request.onerror = () => {
        reject(
          request.error ||
            new Error(
              "Failed to open POS IndexedDB.",
            ),
        );
      };
    },
  );
}

/* =========================================================
   ADD OFFLINE SALE
========================================================= */

async function addOfflineSale(
  record: OfflineSaleRecord,
): Promise<void> {
  const db = await openDb();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORE_NAME,
          "readwrite",
        );

      const store =
        transaction.objectStore(
          STORE_NAME,
        );

      store.put(record);

      transaction.oncomplete =
        () => {
          db.close();

          emitQueueUpdated();

          resolve();
        };

      transaction.onerror = () => {
        db.close();

        reject(
          transaction.error ||
            new Error(
              "Failed to store offline sale.",
            ),
        );
      };

      transaction.onabort = () => {
        db.close();

        reject(
          transaction.error ||
            new Error(
              "Offline sale transaction was aborted.",
            ),
        );
      };
    },
  );
}

/* =========================================================
   DELETE OFFLINE SALE
========================================================= */

async function deleteOfflineSale(
  clientSaleId: string,
): Promise<void> {
  const db = await openDb();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORE_NAME,
          "readwrite",
        );

      const store =
        transaction.objectStore(
          STORE_NAME,
        );

      store.delete(
        clientSaleId,
      );

      transaction.oncomplete =
        () => {
          db.close();

          emitQueueUpdated();

          resolve();
        };

      transaction.onerror = () => {
        db.close();

        reject(
          transaction.error ||
            new Error(
              "Failed to delete offline sale.",
            ),
        );
      };

      transaction.onabort = () => {
        db.close();

        reject(
          transaction.error ||
            new Error(
              "Offline sale delete transaction was aborted.",
            ),
        );
      };
    },
  );
}

/* =========================================================
   GET OFFLINE QUEUE
========================================================= */

export async function getOfflineQueue(): Promise<
  OfflineSaleRecord[]
> {
  if (
    typeof window === "undefined"
  ) {
    return [];
  }

  const db = await openDb();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORE_NAME,
          "readonly",
        );

      const store =
        transaction.objectStore(
          STORE_NAME,
        );

      const request =
        store.getAll();

      request.onsuccess = () => {
        db.close();

        const records =
          (request.result ||
            []) as OfflineSaleRecord[];

        records.sort(
          (a, b) =>
            a.createdAt.localeCompare(
              b.createdAt,
            ),
        );

        resolve(records);
      };

      request.onerror = () => {
        db.close();

        reject(
          request.error ||
            new Error(
              "Failed to read offline POS queue.",
            ),
        );
      };
    },
  );
}

/* =========================================================
   GET QUEUE COUNT
========================================================= */

export async function getOfflineQueueCount(): Promise<number> {
  if (
    typeof window === "undefined"
  ) {
    return 0;
  }

  const db = await openDb();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORE_NAME,
          "readonly",
        );

      const store =
        transaction.objectStore(
          STORE_NAME,
        );

      const request =
        store.count();

      request.onsuccess = () => {
        db.close();

        resolve(
          request.result || 0,
        );
      };

      request.onerror = () => {
        db.close();

        reject(
          request.error ||
            new Error(
              "Failed to count offline POS queue.",
            ),
        );
      };
    },
  );
}

/* =========================================================
   BUILD OFFLINE INVOICE
========================================================= */

function buildOfflineInvoice(
  payload: CreateSalePayload,
): SaleInvoice {
  const clientSaleId =
    payload.clientSaleId ||
    generateClientSaleId();

  return {
    id: `offline-${clientSaleId}`,

    invoiceNumber:
      `OFFLINE-${clientSaleId
        .slice(0, 8)
        .toUpperCase()}`,

    clientSaleId,

    subtotal: Number(
      payload.subtotal || 0,
    ),

    discountAmount: Number(
      payload.discountAmount || 0,
    ),

    grandTotal: Number(
      payload.grandTotal || 0,
    ),

    status: "COMPLETED",

    customerId:
      payload.customerId ?? null,

    customerName:
      payload.customerName ?? null,

    cashierId:
      "Offline Register",

    /*
     * This value is only retained in the
     * offline record for UI/reference.
     *
     * Backend MUST NOT trust it when syncing.
     */
    locationId:
      payload.locationId ?? null,

    location: null,

    items: payload.items.map(
      (item, index) => ({
        id: `offline-item-${clientSaleId}-${index}`,

        productId:
          item.productId,

        productCode:
          item.productCode,

        productName:
          item.productName,

        barcode:
          item.barcode ?? null,

        unitPrice: Number(
          item.unitPrice || 0,
        ),

        quantity: Number(
          item.quantity || 0,
        ),

        discountAmount: Number(
          item.discountAmount || 0,
        ),

        lineTotal: Number(
          item.lineTotal || 0,
        ),
      }),
    ),

    payments:
      payload.payments.map(
        (payment, index) => ({
          id: `offline-payment-${clientSaleId}-${index}`,

          paymentMethod:
            payment.paymentMethod,

          amount: Number(
            payment.amount || 0,
          ),

          amountReceived:
            payment.amountReceived ??
            null,

          changeAmount:
            payment.changeAmount ??
            null,

          referenceNumber:
            payment.referenceNumber ??
            null,
        }),
      ),

    createdAt:
      new Date().toISOString(),
  };
}

/* =========================================================
   SEND SALE TO SERVER
========================================================= */

async function sendSaleToServer(
  payload: CreateSalePayload,
): Promise<SaleInvoice> {
  const response =
    await api.post(
      "/pos/sales",
      payload,
    );

  return response.data;
}

/* =========================================================
   CREATE SALE
========================================================= */

export const createSale = async (
  payload: CreateSalePayload,
): Promise<SaleInvoice> => {
  const finalPayload: CreateSalePayload =
    {
      ...payload,

      clientSaleId:
        payload.clientSaleId ||
        generateClientSaleId(),
    };

  /* =======================================================
     OFFLINE
  ======================================================= */

  if (!isOnline()) {
    await addOfflineSale({
      clientSaleId:
        finalPayload.clientSaleId!,

      payload: finalPayload,

      createdAt:
        new Date().toISOString(),
    });

    return buildOfflineInvoice(
      finalPayload,
    );
  }

  /* =======================================================
     ONLINE
  ======================================================= */

  try {
    return await sendSaleToServer(
      finalPayload,
    );
  } catch (error: any) {
    const isNetworkError =
      !error?.response;

    if (!isNetworkError) {
      throw error;
    }

    await addOfflineSale({
      clientSaleId:
        finalPayload.clientSaleId!,

      payload: finalPayload,

      createdAt:
        new Date().toISOString(),
    });

    return buildOfflineInvoice(
      finalPayload,
    );
  }
};

/* =========================================================
   SYNC OFFLINE SALES
========================================================= */

export async function syncOfflineSales(): Promise<void> {
  if (
    typeof window === "undefined" ||
    !navigator.onLine ||
    syncRunning
  ) {
    return;
  }

  syncRunning = true;

  try {
    const queue =
      await getOfflineQueue();

    for (const record of queue) {
      if (!navigator.onLine) {
        break;
      }

      try {
        /*
         * Backend will determine the correct
         * branch/till from the current JWT.
         */
        await sendSaleToServer(
          record.payload,
        );

        await deleteOfflineSale(
          record.clientSaleId,
        );

        emitSaleCompleted();
      } catch (error: any) {
        const status =
          error?.response?.status;

        if (
          !error?.response ||
          !status
        ) {
          break;
        }

        if (status >= 500) {
          break;
        }

        console.error(
          "Offline sale sync failed:",
          record.clientSaleId,
          error,
        );

        break;
      }
    }
  } catch (error) {
    console.error(
      "Offline POS sync failed:",
      error,
    );
  } finally {
    syncRunning = false;

    emitQueueUpdated();
  }
}

/* =========================================================
   START OFFLINE SYNC
========================================================= */

export function startOfflineSync(): () => void {
  if (
    typeof window === "undefined"
  ) {
    return () => {};
  }

  const handleOnline = () => {
    emitOfflineStatus();

    void syncOfflineSales();
  };

  const handleOffline = () => {
    emitOfflineStatus();
  };

  const interval =
    window.setInterval(() => {
      if (navigator.onLine) {
        void syncOfflineSales();
      }

      emitOfflineStatus();
    }, 5000);

  window.addEventListener(
    "online",
    handleOnline,
  );

  window.addEventListener(
    "offline",
    handleOffline,
  );

  emitOfflineStatus();

  void syncOfflineSales();

  return () => {
    window.clearInterval(
      interval,
    );

    window.removeEventListener(
      "online",
      handleOnline,
    );

    window.removeEventListener(
      "offline",
      handleOffline,
    );
  };
}

/* =========================================================
   GET SALES / ORDERS

   Branch/till filtering is handled by backend JWT scope.
========================================================= */

export async function getSales(
  query?: {
    search?: string;
    limit?: number;
  },
): Promise<SaleInvoice[]> {
  const response =
    await api.get(
      "/pos/sales",
      {
        params: query,
      },
    );

  const data =
    response.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(
      data?.data,
    )
  ) {
    return data.data;
  }

  return [];
}

/* =========================================================
   GET SINGLE SALE
========================================================= */

export async function getSaleById(
  idOrInvoice: string,
): Promise<SaleInvoice> {
  const response =
    await api.get(
      `/pos/sales/${encodeURIComponent(
        idOrInvoice,
      )}`,
    );

  return response.data;
}

/* =========================================================
   HOLD BILL
========================================================= */

export async function holdBill(
  payload: HoldBillPayload,
): Promise<HeldBill> {
  /*
   * Do NOT add locationId/tillId here.
   * Backend gets them from JWT.
   */
  const response =
    await api.post(
      "/pos/held-bills",
      payload,
    );

  return response.data;
}

/* =========================================================
   GET HELD BILLS
========================================================= */

export async function getHeldBills(): Promise<
  HeldBill[]
> {
  const response =
    await api.get(
      "/pos/held-bills",
    );

  const data =
    response.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(
      data?.data,
    )
  ) {
    return data.data;
  }

  return [];
}

/* =========================================================
   DELETE HELD BILL
========================================================= */

export async function deleteHeldBill(
  id: string,
): Promise<void> {
  await api.delete(
    `/pos/held-bills/${encodeURIComponent(
      id,
    )}`,
  );
}

/* =========================================================
   PROCESS RETURN
========================================================= */

export async function processReturn(
  payload: ReturnSalePayload,
): Promise<ReturnResponse> {
  const response =
    await api.post(
      "/pos/returns",
      payload,
    );

  return response.data;
}

/* =========================================================
   NORMALIZE CASH CLOSING DATA
========================================================= */

function normalizeCashClosingData(
  data: any,
  fallbackDate?: string,
): CashClosingResult & CashClosingSummary {
  const openingCash = Number(
    data?.openingCash ??
      data?.openingBalance ??
      0,
  );

  const cashSales = Number(
    data?.cashSales ?? 0,
  );

  const cardSales = Number(
    data?.cardSales ?? 0,
  );

  const qrSales = Number(
    data?.qrSales ?? 0,
  );

  const totalSales = Number(
    data?.totalSales ??
      cashSales +
        cardSales +
        qrSales,
  );

  const totalRefunds = Number(
    data?.totalRefunds ??
      data?.refunds ??
      0,
  );

  const refundsCount = Number(
    data?.refundsCount ?? 0,
  );

  const expectedCash = Number(
    data?.expectedCash ??
      openingCash +
        cashSales -
        totalRefunds,
  );

  const actualCash =
    data?.actualCash !== undefined &&
    data?.actualCash !== null
      ? Number(data.actualCash)
      : null;

  const difference =
    data?.difference !== undefined &&
    data?.difference !== null
      ? Number(data.difference)
      : actualCash !== null
        ? actualCash -
          expectedCash
        : null;

  const closed = Boolean(
    data?.closed ??
      data?.isClosed ??
      false,
  );

  const date =
    data?.date ??
    data?.businessDate ??
    fallbackDate ??
    "";

  return {
    ...data,

    /* Date */
    date,
    businessDate:
      data?.businessDate ??
      date,

    /* Scope */
    locationId:
      data?.locationId ?? "",

    tillId:
      data?.tillId !== undefined &&
      data?.tillId !== null
        ? Number(data.tillId)
        : null,

    /* Opening */
    openingCash,
    openingBalance:
      openingCash,

    /* Sales */
    cashSales,
    cardSales,
    qrSales,
    totalSales,

    /* Refunds */
    refunds:
      totalRefunds,

    totalRefunds,

    refundsCount,

    /* Expected */
    expectedCash,

    /* Closing */
    actualCash,

    difference,

    closed,
    isClosed:
      closed,

    closedBy:
      data?.closedBy ??
      null,

    closedAt:
      data?.closedAt ??
      null,
  };
}

/* =========================================================
   CASH CLOSING SUMMARY

   IMPORTANT:

   1. /cash-closing-summary gives:
      - opening cash
      - cash sales
      - card sales
      - QR sales
      - total sales
      - refunds
      - expected cash

   2. /cash-closing gives:
      - closed status
      - actual cash
      - difference
      - closedBy
      - closedAt

   Both endpoints use the logged-in user's
   JWT branch/till scope on the backend.
========================================================= */

export async function getCashClosingSummary(
  date?: string,
): Promise<
  CashClosingSummary &
  CashClosingResult
> {
  const params: {
    date?: string;
  } = {};

  if (date) {
    params.date = date;
  }

  /*
   * Load both pieces of information.
   *
   * Summary endpoint:
   * sales/revenue/refunds/opening
   *
   * Cash closing endpoint:
   * closed/actual/difference
   */
  const [
    summaryResponse,
    closingResponse,
  ] = await Promise.all([
    api.get(
      "/pos/cash-closing-summary",
      {
        params,
      },
    ),

    api.get(
      "/pos/cash-closing",
      {
        params,
      },
    ),
  ]);

  const summaryData =
    summaryResponse.data ?? {};

  const closingData =
    closingResponse.data ?? {};

  /*
   * Closing endpoint contains the authoritative
   * closed state and closing values.
   *
   * Summary endpoint contains sales details.
   */
  const mergedData = {
    ...summaryData,

    ...closingData,

    /*
     * Keep detailed sales fields from
     * the summary endpoint.
     */
    date:
      summaryData?.date ??
      closingData?.date ??
      closingData?.businessDate ??
      date ??
      "",

    locationId:
      summaryData?.locationId ??
      closingData?.locationId ??
      "",

    tillId:
      summaryData?.tillId ??
      closingData?.tillId ??
      null,

    openingCash:
      summaryData?.openingCash ??
      closingData?.openingBalance ??
      0,

    cashSales:
      summaryData?.cashSales ??
      closingData?.cashSales ??
      0,

    cardSales:
      summaryData?.cardSales ??
      closingData?.cardSales ??
      0,

    qrSales:
      summaryData?.qrSales ??
      closingData?.qrSales ??
      0,

    totalSales:
      summaryData?.totalSales ??
      closingData?.totalSales ??
      0,

    refundsCount:
      summaryData?.refundsCount ??
      closingData?.refundsCount ??
      0,

    totalRefunds:
      summaryData?.totalRefunds ??
      closingData?.totalRefunds ??
      closingData?.refunds ??
      0,

    expectedCash:
      summaryData?.expectedCash ??
      closingData?.expectedCash ??
      0,

    actualCash:
      closingData?.actualCash ??
      null,

    difference:
      closingData?.difference ??
      null,

    closed:
      closingData?.closed ??
      closingData?.isClosed ??
      false,

    isClosed:
      closingData?.closed ??
      closingData?.isClosed ??
      false,
  };

  return normalizeCashClosingData(
    mergedData,
    date,
  );
}

/* =========================================================
   CASH CLOSING

   Backend determines:
   - locationId
   - tillId
   - closedBy
   - business scope

   Frontend sends ONLY:
   - actualCash
   - businessDate
========================================================= */

export async function closeCash(
  payload: CloseCashPayload,
): Promise<CashClosingResult> {
  const actualCash =
    Number(payload.actualCash);

  if (
    !Number.isFinite(actualCash) ||
    actualCash < 0
  ) {
    throw new Error(
      "Actual cash must be a valid non-negative amount.",
    );
  }

  if (!payload.businessDate) {
    throw new Error(
      "Business date is required.",
    );
  }

  const response =
    await api.post(
      "/pos/cash-closing",
      {
        actualCash,
        businessDate:
          payload.businessDate,
      },
    );

  /*
   * Backend is authoritative.
   *
   * We normalize numbers here so the
   * frontend never receives decimal strings.
   */
  return normalizeCashClosingData(
    {
      ...response.data,

      actualCash:
        response.data?.actualCash ??
        actualCash,

      closed:
        response.data?.closed ??
        response.data?.isClosed ??
        true,

      isClosed:
        response.data?.closed ??
        response.data?.isClosed ??
        true,

      businessDate:
        response.data?.businessDate ??
        payload.businessDate,
    },
    payload.businessDate,
  );
}

/* =========================================================
   EVENT NAME EXPORTS
========================================================= */

export {
  POS_QUEUE_UPDATED_EVENT,
  POS_OFFLINE_STATUS_EVENT,
  POS_SALE_COMPLETED_EVENT,
};

/* =========================================================
   DEFAULT SERVICE
========================================================= */

const posService = {
  /* POS SALES */
  createSale,
  getSales,
  getSaleById,

  /* HOLD / RESUME */
  holdBill,
  getHeldBills,
  deleteHeldBill,

  /* RETURNS */
  processReturn,

  /* CASH CLOSING */
  getCashClosingSummary,
  closeCash,

  /* OPENING BALANCE */
  getOpeningBalance,
  saveOpeningBalance,

  /* OFFLINE POS */
  getOfflineQueue,
  getOfflineQueueCount,
  syncOfflineSales,
  startOfflineSync,
  isOnline,
};

export default posService;