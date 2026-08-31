"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Receipt,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

// =========================================================
// TYPES
// =========================================================

interface Supplier {
  id: number | string;
  supplierCode?: string;
  supplierName: string;
  isActive?: boolean;
}

interface Product {
  id: string;
  productCode?: string;
  productName: string;
  name?: string;
}

interface PurchaseOrder {
  id: number | string;
  poNumber?: string;
  supplierId?: number | string;
  status?: string;
}

interface GRN {
  id: number | string;
  grnNumber?: string;
  purchaseOrderId?: number | string;
  status?: string;
}

interface InvoiceItem {
  id?: number | string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface PurchaseInvoice {
  id: number;
  invoiceNumber?: string;

  supplierId?: number | string;
  purchaseOrderId?: number | string;
  grnId?: number | string;

  invoiceDate?: string;
  dueDate?: string;

  discountAmount?: number;
  taxAmount?: number;

  status?: string;

  items?: Array<{
    id?: number | string;
    productId: string | number;

    product?: {
      id?: string | number;
      productCode?: string;
      productName?: string;
      name?: string;
    };

    quantity: number | string;
    unitPrice: number | string;
  }>;
}

// =========================================================
// API
// =========================================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const INVOICE_API = `${API_URL}/purchasing/invoices`;
const SUPPLIER_API = `${API_URL}/suppliers`;
const PRODUCT_API = `${API_URL}/products`;
const PO_API = `${API_URL}/purchasing/orders`;
const GRN_API = `${API_URL}/purchasing/grn`;

const INVOICE_LIST_PAGE =
  "/dashboard/purchasing/invoices";

// =========================================================
// ERROR HELPER
// =========================================================

function getErrorMessage(
  data: any,
  fallback = "Something went wrong."
): string {
  if (!data) {
    return fallback;
  }

  if (data instanceof Error) {
    return data.message || fallback;
  }

  if (typeof data === "string") {
    return data || fallback;
  }

  if (Array.isArray(data?.message)) {
    return data.message
      .map((item: any) => {
        if (typeof item === "string") {
          return item;
        }

        if (item?.message) {
          if (Array.isArray(item.message)) {
            return item.message.join(", ");
          }

          return String(item.message);
        }

        if (item?.error) {
          return String(item.error);
        }

        try {
          return JSON.stringify(item);
        } catch {
          return String(item);
        }
      })
      .filter(Boolean)
      .join(", ");
  }

  if (typeof data?.message === "string") {
    return data.message;
  }

  if (
    data?.message &&
    typeof data.message === "object"
  ) {
    if (Array.isArray(data.message.message)) {
      return data.message.message
        .map((item: any) => {
          if (typeof item === "string") {
            return item;
          }

          return (
            item?.message ||
            item?.error ||
            JSON.stringify(item)
          );
        })
        .join(", ");
    }

    if (
      typeof data.message.message === "string"
    ) {
      return data.message.message;
    }

    if (
      typeof data.message.error === "string"
    ) {
      return data.message.error;
    }

    try {
      return JSON.stringify(data.message);
    } catch {
      return fallback;
    }
  }

  if (typeof data?.error === "string") {
    return data.error;
  }

  if (
    data?.error &&
    typeof data.error === "object"
  ) {
    try {
      return JSON.stringify(data.error);
    } catch {
      return fallback;
    }
  }

  try {
    const json = JSON.stringify(data);

    if (json && json !== "{}") {
      return json;
    }
  } catch {
    // ignore
  }

  return fallback;
}

// =========================================================
// DATE HELPER
// =========================================================

function formatDateForInput(
  value?: string | null
): string {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
}

// =========================================================
// NUMBER FORMATTER
// =========================================================

function formatCurrency(value: number): string {
  return Number(value || 0).toLocaleString(
    "en-LK",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

// =========================================================
// INTEGER VALIDATION
// =========================================================

function isPositiveInteger(
  value: string
): boolean {
  const number = Number(value);

  return (
    Number.isInteger(number) &&
    number > 0
  );
}

// =========================================================
// COMPONENT
// =========================================================

export default function EditPurchaseInvoicePage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  // =======================================================
  // DATA
  // =======================================================

  const [invoice, setInvoice] =
    useState<PurchaseInvoice | null>(null);

  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [purchaseOrders, setPurchaseOrders] =
    useState<PurchaseOrder[]>([]);

  const [grns, setGrns] =
    useState<GRN[]>([]);

  // =======================================================
  // FORM
  // =======================================================

  const [supplierId, setSupplierId] =
    useState("");

  const [purchaseOrderId, setPurchaseOrderId] =
    useState("");

  const [grnId, setGrnId] =
    useState("");

  const [invoiceDate, setInvoiceDate] =
    useState("");

  const [dueDate, setDueDate] =
    useState("");

  const [discountAmount, setDiscountAmount] =
    useState(0);

  const [taxAmount, setTaxAmount] =
    useState(0);

  const [items, setItems] =
    useState<InvoiceItem[]>([]);

  // =======================================================
  // UI STATE
  // =======================================================

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  // =======================================================
  // TOKEN
  // =======================================================

  const getToken = () => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem(
      "accessToken"
    );
  };

  // =======================================================
  // HEADERS
  // =======================================================

  const getHeaders = (): HeadersInit => {
    const token = getToken();

    return {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  // =======================================================
  // LOAD DATA
  // =======================================================

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setError(
        "Invalid purchase invoice ID."
      );

      setLoading(false);

      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          invoiceResponse,
          suppliersResponse,
          productsResponse,
          ordersResponse,
          grnsResponse,
        ] = await Promise.all([
          fetch(
            `${INVOICE_API}/${id}`,
            {
              headers: getHeaders(),
            }
          ),

          fetch(SUPPLIER_API, {
            headers: getHeaders(),
          }),

          fetch(PRODUCT_API, {
            headers: getHeaders(),
          }),

          fetch(PO_API, {
            headers: getHeaders(),
          }),

          fetch(GRN_API, {
            headers: getHeaders(),
          }),
        ]);

        // =================================================
        // READ RESPONSE
        // =================================================

        const invoiceData =
          await invoiceResponse
            .json()
            .catch(() => null);

        const suppliersData =
          await suppliersResponse
            .json()
            .catch(() => null);

        const productsData =
          await productsResponse
            .json()
            .catch(() => null);

        const ordersData =
          await ordersResponse
            .json()
            .catch(() => null);

        const grnsData =
          await grnsResponse
            .json()
            .catch(() => null);

        // =================================================
        // RESPONSE VALIDATION
        // =================================================

        if (!invoiceResponse.ok) {
          throw new Error(
            getErrorMessage(
              invoiceData,
              "Failed to load purchase invoice."
            )
          );
        }

        if (!suppliersResponse.ok) {
          throw new Error(
            getErrorMessage(
              suppliersData,
              "Failed to load suppliers."
            )
          );
        }

        if (!productsResponse.ok) {
          throw new Error(
            getErrorMessage(
              productsData,
              "Failed to load products."
            )
          );
        }

        if (!ordersResponse.ok) {
          throw new Error(
            getErrorMessage(
              ordersData,
              "Failed to load purchase orders."
            )
          );
        }

        if (!grnsResponse.ok) {
          throw new Error(
            getErrorMessage(
              grnsData,
              "Failed to load GRNs."
            )
          );
        }

        // =================================================
        // NORMALIZE
        // =================================================

        const invoiceResult: PurchaseInvoice =
          invoiceData?.data ??
          invoiceData;

        const suppliersResult: Supplier[] =
          Array.isArray(suppliersData)
            ? suppliersData
            : Array.isArray(
                suppliersData?.data
              )
            ? suppliersData.data
            : [];

        const productsResult: Product[] =
          Array.isArray(productsData)
            ? productsData
            : Array.isArray(
                productsData?.data
              )
            ? productsData.data
            : [];

        const ordersResult: PurchaseOrder[] =
          Array.isArray(ordersData)
            ? ordersData
            : Array.isArray(
                ordersData?.data
              )
            ? ordersData.data
            : [];

        const grnsResult: GRN[] =
          Array.isArray(grnsData)
            ? grnsData
            : Array.isArray(
                grnsData?.data
              )
            ? grnsData.data
            : [];

        // =================================================
        // SET DATA
        // =================================================

        setInvoice(invoiceResult);

        setSuppliers(
          suppliersResult
        );

        setProducts(
          productsResult
        );

        setPurchaseOrders(
          ordersResult
        );

        setGrns(grnsResult);

        // =================================================
        // FORM VALUES
        // =================================================

        setSupplierId(
          invoiceResult.supplierId !==
            undefined &&
          invoiceResult.supplierId !==
            null
            ? String(
                invoiceResult.supplierId
              )
            : ""
        );

        setPurchaseOrderId(
          invoiceResult.purchaseOrderId !==
            undefined &&
          invoiceResult.purchaseOrderId !==
            null
            ? String(
                invoiceResult.purchaseOrderId
              )
            : ""
        );

        setGrnId(
          invoiceResult.grnId !==
            undefined &&
          invoiceResult.grnId !==
            null
            ? String(
                invoiceResult.grnId
              )
            : ""
        );

        setInvoiceDate(
          formatDateForInput(
            invoiceResult.invoiceDate
          )
        );

        setDueDate(
          formatDateForInput(
            invoiceResult.dueDate
          )
        );

        setDiscountAmount(
          Number(
            invoiceResult.discountAmount ||
              0
          )
        );

        setTaxAmount(
          Number(
            invoiceResult.taxAmount ||
              0
          )
        );

        // =================================================
        // MAP ITEMS
        // =================================================

        const invoiceItems =
          Array.isArray(
            invoiceResult.items
          )
            ? invoiceResult.items
            : [];

        const mappedItems: InvoiceItem[] =
          invoiceItems.map(
            (item) => {
              const invoiceProduct =
                item.product;

              const productFromProducts =
                productsResult.find(
                  (product) =>
                    String(
                      product.id
                    ) ===
                    String(
                      item.productId
                    )
                );

              return {
                id: item.id,

                productId:
                  String(
                    item.productId
                  ),

                productName:
                  invoiceProduct
                    ?.productName ||
                  invoiceProduct?.name ||
                  productFromProducts
                    ?.productName ||
                  productFromProducts
                    ?.name ||
                  "",

                quantity:
                  Number(
                    item.quantity
                  ) || 0,

                unitPrice:
                  Number(
                    item.unitPrice
                  ) || 0,
              };
            }
          );

        setItems(mappedItems);

        console.log(
          "========== PURCHASE INVOICE LOAD =========="
        );

        console.log(
          "Invoice:",
          invoiceResult
        );

        console.log(
          "Items:",
          mappedItems
        );

        console.log(
          "Suppliers:",
          suppliersResult
        );

        console.log(
          "Purchase Orders:",
          ordersResult
        );

        console.log(
          "GRNs:",
          grnsResult
        );

        console.log(
          "=========================================="
        );
      } catch (loadError: unknown) {
        console.error(
          "Failed to load purchase invoice:",
          loadError
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : getErrorMessage(
                loadError,
                "Failed to load purchase invoice."
              )
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // =========================================================
  // FILTER PURCHASE ORDERS
  // =========================================================

  const filteredPurchaseOrders =
    useMemo(() => {
      if (!supplierId) {
        return [];
      }

      const filtered =
        purchaseOrders.filter(
          (order) =>
            String(
              order.supplierId
            ) ===
            String(supplierId)
        );

      // Keep currently selected PO
      // even if backend response does not
      // contain supplierId correctly.
      if (
        purchaseOrderId &&
        !filtered.some(
          (order) =>
            String(order.id) ===
            String(purchaseOrderId)
        )
      ) {
        const currentOrder =
          purchaseOrders.find(
            (order) =>
              String(order.id) ===
              String(
                purchaseOrderId
              )
          );

        if (currentOrder) {
          return [
            currentOrder,
            ...filtered,
          ];
        }
      }

      return filtered;
    }, [
      purchaseOrders,
      supplierId,
      purchaseOrderId,
    ]);

  // =========================================================
  // FILTER GRNs
  // =========================================================

  const filteredGrns =
    useMemo(() => {
      if (!purchaseOrderId) {
        return [];
      }

      const filtered =
        grns.filter(
          (grn) =>
            String(
              grn.purchaseOrderId
            ) ===
            String(
              purchaseOrderId
            )
        );

      // Keep current GRN if required
      if (
        grnId &&
        !filtered.some(
          (grn) =>
            String(grn.id) ===
            String(grnId)
        )
      ) {
        const currentGrn =
          grns.find(
            (grn) =>
              String(grn.id) ===
              String(grnId)
          );

        if (currentGrn) {
          return [
            currentGrn,
            ...filtered,
          ];
        }
      }

      return filtered;
    }, [
      grns,
      purchaseOrderId,
      grnId,
    ]);

  // =========================================================
  // SELECTED SUPPLIER
  // =========================================================

  const selectedSupplier =
    useMemo(() => {
      return suppliers.find(
        (supplier) =>
          String(
            supplier.id
          ) ===
          String(supplierId)
      );
    }, [
      suppliers,
      supplierId,
    ]);

  // =========================================================
  // SELECTED PO
  // =========================================================

  const selectedPurchaseOrder =
    useMemo(() => {
      return purchaseOrders.find(
        (order) =>
          String(order.id) ===
          String(
            purchaseOrderId
          )
      );
    }, [
      purchaseOrders,
      purchaseOrderId,
    ]);

  // =========================================================
  // SELECTED GRN
  // =========================================================

  const selectedGrn =
    useMemo(() => {
      return grns.find(
        (grn) =>
          String(grn.id) ===
          String(grnId)
      );
    }, [
      grns,
      grnId,
    ]);

  // =========================================================
  // SUBTOTAL
  // =========================================================

  const subtotal =
    useMemo(() => {
      return items.reduce(
        (total, item) =>
          total +
          Number(
            item.quantity || 0
          ) *
            Number(
              item.unitPrice || 0
            ),
        0
      );
    }, [items]);

  // =========================================================
  // GRAND TOTAL
  // =========================================================

  const grandTotal =
    useMemo(() => {
      return (
        subtotal -
        Number(
          discountAmount || 0
        ) +
        Number(
          taxAmount || 0
        )
      );
    }, [
      subtotal,
      discountAmount,
      taxAmount,
    ]);

  // =========================================================
  // ADD ITEM
  // =========================================================

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        productId: "",
        productName: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  // =========================================================
  // REMOVE ITEM
  // =========================================================

  const removeItem = (
    index: number
  ) => {
    setItems((current) =>
      current.filter(
        (_, i) => i !== index
      )
    );
  };

  // =========================================================
  // PRODUCT CHANGE
  // =========================================================

  const handleProductChange = (
    index: number,
    productId: string
  ) => {
    const product =
      products.find(
        (item) =>
          String(item.id) ===
          String(productId)
      );

    setItems((current) =>
      current.map(
        (item, i) =>
          i === index
            ? {
                ...item,
                productId,
                productName:
                  product?.productName ||
                  product?.name ||
                  "",
              }
            : item
      )
    );
  };

  // =========================================================
  // ITEM FIELD CHANGE
  // =========================================================

  const updateItem = (
    index: number,
    field:
      | "quantity"
      | "unitPrice",
    value: number
  ) => {
    setItems((current) =>
      current.map(
        (item, i) =>
          i === index
            ? {
                ...item,
                [field]: value,
              }
            : item
      )
    );
  };

  // =========================================================
  // SUPPLIER CHANGE
  // =========================================================

  const handleSupplierChange = (
    value: string
  ) => {
    setSupplierId(value);

    // Supplier changed
    // Reset dependent fields.
    setPurchaseOrderId("");

    setGrnId("");
  };

  // =========================================================
  // PO CHANGE
  // =========================================================

  const handlePurchaseOrderChange = (
    value: string
  ) => {
    setPurchaseOrderId(value);

    // PO changed
    // Reset GRN.
    setGrnId("");
  };

  // =========================================================
  // GRN CHANGE
  // =========================================================

  const handleGrnChange = (
    value: string
  ) => {
    setGrnId(value);
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");

    // =======================================================
    // SUPPLIER
    // =======================================================

    if (!supplierId) {
      setError(
        "Please select a supplier."
      );
      return;
    }

    if (
      !isPositiveInteger(
        supplierId
      )
    ) {
      setError(
        "Invalid supplier selected."
      );
      return;
    }

    // =======================================================
    // PURCHASE ORDER
    // =======================================================

    if (!purchaseOrderId) {
      setError(
        "Please select a purchase order."
      );
      return;
    }

    if (
      !isPositiveInteger(
        purchaseOrderId
      )
    ) {
      setError(
        "Invalid purchase order selected."
      );
      return;
    }

    // =======================================================
    // GRN
    // =======================================================

    if (!grnId) {
      setError(
        "Please select a GRN."
      );
      return;
    }

    if (
      !isPositiveInteger(grnId)
    ) {
      setError(
        "Invalid GRN selected."
      );
      return;
    }

    // =======================================================
    // DATE
    // =======================================================

    if (!invoiceDate) {
      setError(
        "Invoice date is required."
      );
      return;
    }

    if (
      dueDate &&
      dueDate < invoiceDate
    ) {
      setError(
        "Due date cannot be before invoice date."
      );
      return;
    }

    // =======================================================
    // ITEMS
    // =======================================================

    if (items.length === 0) {
      setError(
        "Please add at least one invoice item."
      );
      return;
    }

    const invalidItem =
      items.find(
        (item) =>
          !item.productId ||
          !Number.isFinite(
            Number(item.quantity)
          ) ||
          Number(item.quantity) <=
            0 ||
          !Number.isFinite(
            Number(item.unitPrice)
          ) ||
          Number(item.unitPrice) <=
            0
      );

    if (invalidItem) {
      setError(
        "Please provide a valid product, quantity and unit price for every item."
      );
      return;
    }

    // =======================================================
    // DUPLICATE PRODUCTS
    // =======================================================

    const productIds =
      items.map(
        (item) =>
          String(item.productId)
      );

    const uniqueProductIds =
      new Set(productIds);

    if (
      uniqueProductIds.size !==
      productIds.length
    ) {
      setError(
        "Duplicate products are not allowed."
      );
      return;
    }

    // =======================================================
    // DISCOUNT
    // =======================================================

    const cleanDiscount =
      Number(
        discountAmount || 0
      );

    if (
      !Number.isFinite(
        cleanDiscount
      ) ||
      cleanDiscount < 0
    ) {
      setError(
        "Discount amount cannot be negative."
      );
      return;
    }

    // =======================================================
    // TAX
    // =======================================================

    const cleanTax =
      Number(
        taxAmount || 0
      );

    if (
      !Number.isFinite(
        cleanTax
      ) ||
      cleanTax < 0
    ) {
      setError(
        "Tax amount cannot be negative."
      );
      return;
    }

    // =======================================================
    // GRAND TOTAL
    // =======================================================

    const calculatedGrandTotal =
      subtotal -
      cleanDiscount +
      cleanTax;

    if (
      calculatedGrandTotal < 0
    ) {
      setError(
        "Discount cannot be greater than the subtotal."
      );
      return;
    }

    // =======================================================
    // UPDATE
    // =======================================================

    try {
      setSaving(true);

      const token = getToken();

      // =====================================================
      // PAYLOAD
      // =====================================================

      const payload = {
        supplierId:
          Number(supplierId),

        purchaseOrderId:
          Number(
            purchaseOrderId
          ),

        grnId:
          Number(grnId),

        invoiceDate,

        ...(dueDate
          ? {
              dueDate,
            }
          : {}),

        discountAmount:
          cleanDiscount,

        taxAmount:
          cleanTax,

        items: items.map(
          (item) => ({
            productId:
              String(
                item.productId
              ),

            quantity:
              Number(
                item.quantity
              ),

            unitPrice:
              Number(
                item.unitPrice
              ),
          })
        ),
      };

      console.log(
        "================================================"
      );

      console.log(
        "UPDATE PURCHASE INVOICE"
      );

      console.log(
        "================================================"
      );

      console.log(
        "URL:",
        `${INVOICE_API}/${id}`
      );

      console.log(
        "METHOD:",
        "PATCH"
      );

      console.log(
        "PAYLOAD:",
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      console.log(
        "================================================"
      );

      // =====================================================
      // API REQUEST
      // =====================================================

      let response: Response;

      try {
        response =
          await fetch(
            `${INVOICE_API}/${id}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                ...(token
                  ? {
                      Authorization:
                        `Bearer ${token}`,
                    }
                  : {}),
              },

              body: JSON.stringify(
                payload
              ),
            }
          );
      } catch (networkError) {
        console.error(
          "NETWORK ERROR:",
          networkError
        );

        throw new Error(
          "Failed to connect to the backend server. Please make sure the backend is running at " +
            API_URL
        );
      }

      // =====================================================
      // RESPONSE
      // =====================================================

      const responseText =
        await response.text();

      let data: any = null;

      if (responseText) {
        try {
          data =
            JSON.parse(
              responseText
            );
        } catch {
          data =
            responseText;
        }
      }

      console.log(
        "================================================"
      );

      console.log(
        "UPDATE RESPONSE"
      );

      console.log(
        "HTTP STATUS:",
        response.status
      );

      console.log(
        "RESPONSE:",
        data
      );

      console.log(
        "================================================"
      );

      // =====================================================
      // API ERROR
      // =====================================================

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            `Failed to update purchase invoice (${response.status}).`
          )
        );
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      console.log(
        "Purchase invoice updated successfully."
      );

      router.push(
        INVOICE_LIST_PAGE
      );

      router.refresh();
    } catch (updateError: unknown) {
      console.error(
        "================================================"
      );

      console.error(
        "UPDATE PURCHASE INVOICE ERROR"
      );

      console.error(
        updateError
      );

      console.error(
        "================================================"
      );

      let message =
        "Failed to update purchase invoice.";

      if (
        updateError instanceof Error
      ) {
        message =
          updateError.message ||
          message;
      } else if (
        typeof updateError ===
        "string"
      ) {
        message =
          updateError;
      } else {
        message =
          getErrorMessage(
            updateError,
            message
          );
      }

      if (
        message ===
        "[object Object]"
      ) {
        message =
          "An unexpected error occurred while updating the purchase invoice.";
      }

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CANCEL
  // =========================================================

  const handleCancel = () => {
    if (saving) {
      return;
    }

    router.push(
      INVOICE_LIST_PAGE
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Loader2
              size={20}
              className="animate-spin"
            />

            Loading purchase invoice...
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // NOT FOUND
  // =========================================================

  if (!invoice) {
    return (
      <div className="min-h-full bg-gray-50 p-6">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
          <Receipt
            size={32}
            className="mx-auto mb-3 text-red-400"
          />

          <p className="font-semibold text-red-600">
            Purchase invoice not found
          </p>

          {error && (
            <p className="mt-2 text-sm text-gray-500">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleCancel}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="w-full space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div>
          <div className="flex items-center gap-2 text-sm">

            <Link
              href="/dashboard/purchasing"
              className="text-gray-500 transition hover:text-blue-600"
            >
              Purchasing
            </Link>

            <span className="text-gray-400">
              /
            </span>

            <Link
              href={INVOICE_LIST_PAGE}
              className="text-gray-500 transition hover:text-blue-600"
            >
              Purchase Invoices
            </Link>

            <span className="text-gray-400">
              /
            </span>

            <span className="font-medium text-gray-900">
              Edit
            </span>

          </div>

          <div className="mt-2 flex items-center gap-3">

            <div className="rounded-lg bg-blue-50 p-2">
              <Receipt
                size={22}
                className="text-blue-600"
              />
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Edit Purchase Invoice
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Update{" "}
                {invoice.invoiceNumber ||
                  `Invoice #${invoice.id}`}
              </p>
            </div>

          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* =================================================
              INVOICE INFORMATION
          ================================================= */}

          <div className="rounded-xl border border-gray-200 bg-white p-6">

            <div className="mb-5 flex items-center gap-3">

              <div className="rounded-lg bg-blue-50 p-2">
                <Receipt
                  size={20}
                  className="text-blue-600"
                />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Invoice Information
                </h2>

                <p className="text-sm text-gray-500">
                  Update supplier, purchase order, GRN and invoice dates.
                </p>
              </div>

            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

              {/* =================================================
                  INVOICE NUMBER
              ================================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Invoice Number
                </label>

                <input
                  type="text"
                  value={
                    invoice.invoiceNumber ||
                    ""
                  }
                  disabled
                  className="h-10 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 text-sm text-gray-600 outline-none"
                />

                <p className="mt-1 text-xs text-gray-400">
                  Invoice number cannot be changed.
                </p>
              </div>

              {/* =================================================
                  SUPPLIER
              ================================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Supplier *
                </label>

                <select
                  value={supplierId}
                  onChange={(e) =>
                    handleSupplierChange(
                      e.target.value
                    )
                  }
                  disabled={saving}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                >
                  <option value="">
                    Select supplier
                  </option>

                  {suppliers.map(
                    (supplier) => (
                      <option
                        key={
                          supplier.id
                        }
                        value={
                          supplier.id
                        }
                      >
                        {supplier.supplierName}
                        {supplier.supplierCode
                          ? ` (${supplier.supplierCode})`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* =================================================
                  PURCHASE ORDER
              ================================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Purchase Order *
                </label>

                <select
                  value={
                    purchaseOrderId
                  }
                  onChange={(e) =>
                    handlePurchaseOrderChange(
                      e.target.value
                    )
                  }
                  disabled={
                    !supplierId ||
                    saving
                  }
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                >
                  <option value="">
                    {supplierId
                      ? "Select purchase order"
                      : "Select supplier first"}
                  </option>

                  {filteredPurchaseOrders.map(
                    (order) => (
                      <option
                        key={order.id}
                        value={order.id}
                      >
                        {order.poNumber ||
                          `PO-${String(
                            order.id
                          ).padStart(
                            5,
                            "0"
                          )}`}
                      </option>
                    )
                  )}
                </select>

                {selectedPurchaseOrder && (
                  <p className="mt-1 text-xs text-gray-500">
                    Status:{" "}
                    <span className="font-medium">
                      {selectedPurchaseOrder.status ||
                        "N/A"}
                    </span>
                  </p>
                )}
              </div>

              {/* =================================================
                  GRN
              ================================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  GRN *
                </label>

                <select
                  value={grnId}
                  onChange={(e) =>
                    handleGrnChange(
                      e.target.value
                    )
                  }
                  disabled={
                    !purchaseOrderId ||
                    saving
                  }
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                >
                  <option value="">
                    {purchaseOrderId
                      ? "Select GRN"
                      : "Select purchase order first"}
                  </option>

                  {filteredGrns.map(
                    (grn) => (
                      <option
                        key={grn.id}
                        value={grn.id}
                      >
                        {grn.grnNumber ||
                          `GRN-${String(
                            grn.id
                          ).padStart(
                            5,
                            "0"
                          )}`}
                      </option>
                    )
                  )}
                </select>

                {selectedGrn && (
                  <p className="mt-1 text-xs text-gray-500">
                    Status:{" "}
                    <span className="font-medium">
                      {selectedGrn.status ||
                        "N/A"}
                    </span>
                  </p>
                )}
              </div>

              {/* =================================================
                  INVOICE DATE
              ================================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Invoice Date *
                </label>

                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) =>
                    setInvoiceDate(
                      e.target.value
                    )
                  }
                  disabled={saving}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* =================================================
                  DUE DATE
              ================================================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Due Date
                </label>

                <input
                  type="date"
                  value={dueDate}
                  min={invoiceDate}
                  onChange={(e) =>
                    setDueDate(
                      e.target.value
                    )
                  }
                  disabled={saving}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

            </div>

            {/* =================================================
                SELECTED SUPPLIER
            ================================================= */}

            {selectedSupplier && (
              <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                Supplier:{" "}
                <span className="font-semibold">
                  {
                    selectedSupplier.supplierName
                  }
                </span>

                {selectedSupplier.supplierCode && (
                  <>
                    {" "}
                    (
                    {
                      selectedSupplier.supplierCode
                    }
                    )
                  </>
                )}
              </div>
            )}

          </div>

          {/* =================================================
              ITEMS
          ================================================= */}

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">

              <div>
                <h2 className="font-semibold text-gray-900">
                  Invoice Items
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update products, quantities and unit prices.
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Plus size={16} />
                Add Item
              </button>

            </div>

            {items.length === 0 ? (
              <div className="px-6 py-12 text-center">

                <Receipt
                  size={32}
                  className="mx-auto mb-3 text-gray-400"
                />

                <p className="font-medium text-gray-700">
                  No invoice items
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Click Add Item to add a product.
                </p>

              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[850px] text-sm">

                  <thead className="bg-gray-50">
                    <tr>

                      <th className="px-5 py-3 text-left font-medium text-gray-600">
                        Product
                      </th>

                      <th className="px-5 py-3 text-left font-medium text-gray-600">
                        Quantity
                      </th>

                      <th className="px-5 py-3 text-left font-medium text-gray-600">
                        Unit Price
                      </th>

                      <th className="px-5 py-3 text-right font-medium text-gray-600">
                        Subtotal
                      </th>

                      <th className="px-5 py-3" />

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {items.map(
                      (
                        item,
                        index
                      ) => (
                        <tr
                          key={
                            item.id ??
                            `${item.productId}-${index}`
                          }
                        >

                          {/* PRODUCT */}

                          <td className="px-5 py-4">

                            <select
                              value={
                                item.productId
                              }
                              onChange={(e) =>
                                handleProductChange(
                                  index,
                                  e.target.value
                                )
                              }
                              disabled={
                                saving
                              }
                              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            >

                              <option value="">
                                Select product
                              </option>

                              {products.map(
                                (
                                  product
                                ) => (
                                  <option
                                    key={
                                      product.id
                                    }
                                    value={
                                      product.id
                                    }
                                  >
                                    {product.productCode
                                      ? `${product.productCode} - `
                                      : ""}
                                    {
                                      product.productName ||
                                      product.name
                                    }
                                  </option>
                                )
                              )}

                            </select>

                          </td>

                          {/* QUANTITY */}

                          <td className="px-5 py-4">

                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={
                                item.quantity
                              }
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                              disabled={
                                saving
                              }
                              className="h-10 w-28 rounded-lg border border-gray-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            />

                          </td>

                          {/* UNIT PRICE */}

                          <td className="px-5 py-4">

                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={
                                item.unitPrice
                              }
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "unitPrice",
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                              disabled={
                                saving
                              }
                              className="h-10 w-32 rounded-lg border border-gray-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            />

                          </td>

                          {/* SUBTOTAL */}

                          <td className="px-5 py-4 text-right font-medium">

                            Rs.{" "}
                            {formatCurrency(
                              Number(
                                item.quantity ||
                                  0
                              ) *
                                Number(
                                  item.unitPrice ||
                                    0
                                )
                            )}

                          </td>

                          {/* DELETE */}

                          <td className="px-5 py-4 text-right">

                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  index
                                )
                              }
                              disabled={
                                saving ||
                                items.length ===
                                  1
                              }
                              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                              title={
                                items.length ===
                                1
                                  ? "At least one item is required"
                                  : "Remove item"
                              }
                            >
                              <Trash2
                                size={17}
                              />
                            </button>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>

          {/* =================================================
              TOTALS
          ================================================= */}

          <div className="flex justify-end">

            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6">

              {/* SUBTOTAL */}

              <div className="flex justify-between py-2 text-sm">

                <span className="text-gray-500">
                  Subtotal
                </span>

                <span className="font-medium">
                  Rs.{" "}
                  {formatCurrency(
                    subtotal
                  )}
                </span>

              </div>

              {/* DISCOUNT */}

              <div className="flex items-center justify-between gap-4 py-2 text-sm">

                <label
                  htmlFor="discountAmount"
                  className="text-gray-500"
                >
                  Discount
                </label>

                <div className="flex items-center gap-2">

                  <span className="text-gray-400">
                    Rs.
                  </span>

                  <input
                    id="discountAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      discountAmount
                    }
                    onChange={(e) =>
                      setDiscountAmount(
                        Number(
                          e.target.value
                        ) || 0
                      )
                    }
                    disabled={
                      saving
                    }
                    className="h-9 w-32 rounded-lg border border-gray-300 px-3 text-right text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />

                </div>

              </div>

              {/* TAX */}

              <div className="flex items-center justify-between gap-4 py-2 text-sm">

                <label
                  htmlFor="taxAmount"
                  className="text-gray-500"
                >
                  Tax
                </label>

                <div className="flex items-center gap-2">

                  <span className="text-gray-400">
                    Rs.
                  </span>

                  <input
                    id="taxAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      taxAmount
                    }
                    onChange={(e) =>
                      setTaxAmount(
                        Number(
                          e.target.value
                        ) || 0
                      )
                    }
                    disabled={
                      saving
                    }
                    className="h-9 w-32 rounded-lg border border-gray-300 px-3 text-right text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />

                </div>

              </div>

              {/* GRAND TOTAL */}

              <div className="mt-3 flex justify-between border-t border-gray-200 pt-4">

                <span className="font-semibold">
                  Grand Total
                </span>

                <span
                  className={`text-xl font-semibold ${
                    grandTotal < 0
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  Rs.{" "}
                  {formatCurrency(
                    grandTotal
                  )}
                </span>

              </div>

              {/* =================================================
                  BUTTONS
              ================================================= */}

              <div className="mt-6 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={
                    handleCancel
                  }
                  disabled={
                    saving
                  }
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    items.length ===
                      0
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save
                      size={17}
                    />
                  )}

                  {saving
                    ? "Updating..."
                    : "Update Invoice"}

                </button>

              </div>

            </div>

          </div>

        </form>
      </div>
    </div>
  );
}

