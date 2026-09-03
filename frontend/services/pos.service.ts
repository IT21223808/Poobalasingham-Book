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

const POS_QUEUE_UPDATED_EVENT = "pos-queue-updated";
const POS_OFFLINE_STATUS_EVENT = "pos-offline-status-changed";
const POS_SALE_COMPLETED_EVENT = "pos-sale-completed";

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
   Used for EXACT-ONCE offline sync
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

  window.dispatchEvent(new Event(POS_QUEUE_UPDATED_EVENT));
}

function emitOfflineStatus(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(POS_OFFLINE_STATUS_EVENT));
}

function emitSaleCompleted(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(POS_SALE_COMPLETED_EVENT));
}

/* =========================================================
   INDEXED DB
========================================================= */

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(
        new Error(
          "IndexedDB is only available in the browser.",
        ),
      );
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(
          STORE_NAME,
          {
            keyPath: "clientSaleId",
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
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ||
          new Error("Failed to open POS IndexedDB."),
      );
    };
  });
}

/* =========================================================
   ADD OFFLINE SALE
========================================================= */

async function addOfflineSale(
  record: OfflineSaleRecord,
): Promise<void> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite",
    );

    const store =
      transaction.objectStore(STORE_NAME);

    store.put(record);

    transaction.oncomplete = () => {
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
  });
}

/* =========================================================
   DELETE OFFLINE SALE
========================================================= */

async function deleteOfflineSale(
  clientSaleId: string,
): Promise<void> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite",
    );

    const store =
      transaction.objectStore(STORE_NAME);

    store.delete(clientSaleId);

    transaction.oncomplete = () => {
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
  });
}

/* =========================================================
   GET OFFLINE QUEUE
========================================================= */

export async function getOfflineQueue(): Promise<
  OfflineSaleRecord[]
> {
  if (typeof window === "undefined") {
    return [];
  }

  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readonly",
    );

    const store =
      transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      db.close();

      const records =
        (request.result || []) as OfflineSaleRecord[];

      records.sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
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
  });
}

/* =========================================================
   GET QUEUE COUNT
========================================================= */

export async function getOfflineQueueCount(): Promise<number> {
  if (typeof window === "undefined") {
    return 0;
  }

  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readonly",
    );

    const store =
      transaction.objectStore(STORE_NAME);

    const request = store.count();

    request.onsuccess = () => {
      db.close();

      resolve(request.result || 0);
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
  });
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

    subtotal: Number(payload.subtotal || 0),

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

    cashierId: "Offline Register",

    locationId:
      payload.locationId ?? null,

    location: null,

    items: payload.items.map(
      (item, index) => ({
        id: `offline-item-${clientSaleId}-${index}`,

        productId: item.productId,

        productCode: item.productCode,

        productName: item.productName,

        barcode: item.barcode ?? null,

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

    payments: payload.payments.map(
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
  const response = await api.post(
    "/pos/sales",
    payload,
  );

  return response.data;
}

/* =========================================================
   CREATE SALE
   ONLINE  -> API
   OFFLINE -> IndexedDB queue
========================================================= */

export const createSale = async (
  payload: CreateSalePayload,
): Promise<SaleInvoice> => {
  const finalPayload: CreateSalePayload = {
    ...payload,

    clientSaleId:
      payload.clientSaleId ||
      generateClientSaleId(),
  };

  /* -------------------------------------------------------
     OFFLINE
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     ONLINE
  ------------------------------------------------------- */

  try {
    return await sendSaleToServer(
      finalPayload,
    );
  } catch (error: any) {
    /*
     * If server returned an HTTP response,
     * this is an API/backend error and should NOT
     * automatically become an offline sale.
     *
     * Example:
     * 400 validation
     * 401 unauthorized
     * 403 forbidden
     */
    const isNetworkError =
      !error?.response;

    if (!isNetworkError) {
      throw error;
    }

    /*
     * Network failed after user completed sale.
     * Store the exact same clientSaleId in IndexedDB.
     */
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
   EXACT-ONCE BEHAVIOUR
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

    /*
     * FIFO order:
     * oldest sale first
     */
    for (const record of queue) {
      if (!navigator.onLine) {
        break;
      }

      try {
        /*
         * Same payload + same clientSaleId
         *
         * Backend unique constraint prevents
         * duplicate creation.
         */
        await sendSaleToServer(
          record.payload,
        );

        /*
         * Delete only AFTER successful server
         * response.
         */
        await deleteOfflineSale(
          record.clientSaleId,
        );

        emitSaleCompleted();
      } catch (error: any) {
        const status =
          error?.response?.status;

        /*
         * No response means network failure.
         * Stop sync and keep item in queue.
         */
        if (
          !error?.response ||
          !status
        ) {
          break;
        }

        /*
         * Server 5xx:
         * backend temporarily unavailable.
         *
         * Keep queue item and retry later.
         */
        if (status >= 500) {
          break;
        }

        /*
         * 4xx:
         * payload/auth/permission problem.
         *
         * Do NOT delete automatically.
         * Keep the sale in queue so it is not lost.
         */
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

  /* -------------------------------------------------------
     ONLINE EVENT
  ------------------------------------------------------- */

  const handleOnline = () => {
    emitOfflineStatus();

    void syncOfflineSales();
  };

  /* -------------------------------------------------------
     OFFLINE EVENT
  ------------------------------------------------------- */

  const handleOffline = () => {
    emitOfflineStatus();
  };

  /* -------------------------------------------------------
     PERIODIC RETRY
     Every 5 seconds while online
  ------------------------------------------------------- */

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

  /* Initial status */
  emitOfflineStatus();

  /* Initial queue sync */
  void syncOfflineSales();

  /* -------------------------------------------------------
     CLEANUP
  ------------------------------------------------------- */

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
========================================================= */

export async function getSales(
  query?: {
    search?: string;
    limit?: number;
  },
): Promise<SaleInvoice[]> {
  const response = await api.get(
    "/pos/sales",
    {
      params: query,
    },
  );

  const data = response.data;

  /*
   * Supports either:
   * [
   *   ...
   * ]
   *
   * or:
   * {
   *   data: [...]
   * }
   */
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
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
  const response = await api.get(
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
  const response = await api.post(
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
  const response = await api.get(
    "/pos/held-bills",
  );

  const data = response.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
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
  const response = await api.post(
    "/pos/returns",
    payload,
  );

  return response.data;
}

/* =========================================================
   CASH CLOSING SUMMARY
========================================================= */

export async function getCashClosingSummary(
  date?: string,
): Promise<CashClosingSummary> {
  const response = await api.get(
    "/pos/cash-closing-summary",
    {
      params: date
        ? { date }
        : undefined,
    },
  );

  return response.data;
}

/* =========================================================
   OPTIONAL EVENT NAME EXPORTS
   Useful for POS components
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
  createSale,

  getSales,

  getSaleById,

  holdBill,

  getHeldBills,

  deleteHeldBill,

  processReturn,

  getCashClosingSummary,

  getOfflineQueue,

  getOfflineQueueCount,

  syncOfflineSales,

  startOfflineSync,

  isOnline,
};

export default posService;