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

import api from "@/services/api";

// ============================================================
// TYPES
// ============================================================

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

// ============================================================
// CONSTANTS
// ============================================================

const INVOICE_LIST_PAGE =
  "/dashboard/purchasing/invoices";

// ============================================================
// ERROR MESSAGE HELPER
// ============================================================

function getErrorMessage(
  error: any,
  fallback = "Something went wrong."
): string {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  if (Array.isArray(error)) {
    return error
      .map((item) =>
        typeof item === "string"
          ? item
          : item?.message || JSON.stringify(item)
      )
      .join(", ");
  }

  if (typeof error === "object") {
    if (typeof error.message === "string") {
      return error.message;
    }

    if (Array.isArray(error.message)) {
      return error.message
        .map((item: any) =>
          typeof item === "string"
            ? item
            : item?.message ||
              JSON.stringify(item)
        )
        .join(", ");
    }

    if (
      error.message &&
      typeof error.message === "object"
    ) {
      return getErrorMessage(
        error.message,
        fallback
      );
    }

    if (
      error.response?.data
    ) {
      return getErrorMessage(
        error.response.data,
        fallback
      );
    }

    if (error.data) {
      return getErrorMessage(
        error.data,
        fallback
      );
    }
  }

  return fallback;
}

// ============================================================
// DATE HELPER
// ============================================================

function formatDateForInput(
  value?: string
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ============================================================
// CURRENCY
// ============================================================

function formatCurrency(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-LK",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(value);
}

// ============================================================
// INTEGER VALIDATION
// ============================================================

function isPositiveInteger(
  value: number
): boolean {
  return (
    Number.isInteger(value) &&
    value > 0
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function EditPurchaseInvoicePage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  // ==========================================================
  // STATE
  // ==========================================================

  const [invoice, setInvoice] =
    useState<PurchaseInvoice | null>(
      null
    );

  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [
    purchaseOrders,
    setPurchaseOrders,
  ] = useState<PurchaseOrder[]>(
    []
  );

  const [grns, setGrns] =
    useState<GRN[]>([]);

  const [supplierId, setSupplierId] =
    useState("");

  const [
    purchaseOrderId,
    setPurchaseOrderId,
  ] = useState("");

  const [grnId, setGrnId] =
    useState("");

  const [invoiceDate, setInvoiceDate] =
    useState("");

  const [dueDate, setDueDate] =
    useState("");

  const [
    discountAmount,
    setDiscountAmount,
  ] = useState(0);

  const [
    taxAmount,
    setTaxAmount,
  ] = useState(0);

  const [items, setItems] =
    useState<InvoiceItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  useEffect(() => {
    if (
      !id ||
      Number.isNaN(id)
    ) {
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

        console.log(
          "=========================================="
        );

        console.log(
          "LOADING PURCHASE INVOICE EDIT PAGE"
        );

        console.log(
          "Invoice ID:",
          id
        );

        console.log(
          "=========================================="
        );

        const [
          invoiceResponse,
          suppliersResponse,
          productsResponse,
          ordersResponse,
          grnsResponse,
        ] = await Promise.all([
          api.get(
            `/purchasing/invoices/${id}`
          ),

          api.get(
            "/suppliers"
          ),

          api.get(
            "/products"
          ),

          api.get(
            "/purchasing/orders"
          ),

          api.get(
            "/purchasing/grn"
          ),
        ]);

        // ======================================================
        // RESPONSE DATA
        // ======================================================

        const invoiceData =
          invoiceResponse.data;

        const suppliersData =
          suppliersResponse.data;

        const productsData =
          productsResponse.data;

        const ordersData =
          ordersResponse.data;

        const grnsData =
          grnsResponse.data;

        // ======================================================
        // NORMALIZE INVOICE
        // ======================================================

        const invoiceResult: PurchaseInvoice =
          invoiceData?.data ??
          invoiceData;

        // ======================================================
        // NORMALIZE SUPPLIERS
        // ======================================================

        const suppliersResult: Supplier[] =
          Array.isArray(
            suppliersData
          )
            ? suppliersData
            : Array.isArray(
                suppliersData?.data
              )
            ? suppliersData.data
            : [];

        // ======================================================
        // NORMALIZE PRODUCTS
        // ======================================================

        const productsResult: Product[] =
          Array.isArray(
            productsData
          )
            ? productsData
            : Array.isArray(
                productsData?.data
              )
            ? productsData.data
            : [];

        // ======================================================
        // NORMALIZE PURCHASE ORDERS
        // ======================================================

        const ordersResult: PurchaseOrder[] =
          Array.isArray(
            ordersData
          )
            ? ordersData
            : Array.isArray(
                ordersData?.data
              )
            ? ordersData.data
            : [];

        // ======================================================
        // NORMALIZE GRNS
        // ======================================================

        const grnsResult: GRN[] =
          Array.isArray(
            grnsData
          )
            ? grnsData
            : Array.isArray(
                grnsData?.data
              )
            ? grnsData.data
            : [];

        // ======================================================
        // SET MAIN DATA
        // ======================================================

        setInvoice(
          invoiceResult
        );

        setSuppliers(
          suppliersResult
        );

        setProducts(
          productsResult
        );

        setPurchaseOrders(
          ordersResult
        );

        setGrns(
          grnsResult
        );

        // ======================================================
        // FORM VALUES
        // ======================================================

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

        // ======================================================
        // MAP ITEMS
        // ======================================================

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

        setItems(
          mappedItems
        );

        // ======================================================
        // DEBUG
        // ======================================================

        console.log(
          "Invoice:",
          invoiceResult
        );

        console.log(
          "Suppliers:",
          suppliersResult
        );

        console.log(
          "Products:",
          productsResult
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
          "Invoice Items:",
          mappedItems
        );
      } catch (loadError: any) {
        console.error(
          "Failed to load purchase invoice:",
          loadError
        );

        console.error(
          "Axios response:",
          loadError?.response
        );

        console.error(
          "Axios response data:",
          loadError?.response?.data
        );

        const responseData =
          loadError?.response?.data;

        setError(
          getErrorMessage(
            responseData ||
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

  // ==========================================================
  // FILTER PURCHASE ORDERS
  // ==========================================================

  const filteredPurchaseOrders =
    useMemo(() => {
      if (!supplierId) {
        return [];
      }

      return purchaseOrders.filter(
        (order) =>
          String(
            order.supplierId
          ) ===
          String(
            supplierId
          )
      );
    }, [
      purchaseOrders,
      supplierId,
    ]);

  // ==========================================================
  // FILTER GRNS
  // ==========================================================

  const filteredGrns =
    useMemo(() => {
      if (!purchaseOrderId) {
        return [];
      }

      return grns.filter(
        (grn) =>
          String(
            grn.purchaseOrderId
          ) ===
          String(
            purchaseOrderId
          )
      );
    }, [
      grns,
      purchaseOrderId,
    ]);

  // ==========================================================
  // SUBTOTAL
  // ==========================================================

  const subtotal =
    useMemo(() => {
      return items.reduce(
        (
          total,
          item
        ) => {
          const quantity =
            Number(
              item.quantity
            ) || 0;

          const unitPrice =
            Number(
              item.unitPrice
            ) || 0;

          return (
            total +
            quantity *
              unitPrice
          );
        },
        0
      );
    }, [items]);

  // ==========================================================
  // DISCOUNT
  // ==========================================================

  const cleanDiscount =
    Math.max(
      0,
      Number(
        discountAmount
      ) || 0
    );

  // ==========================================================
  // TAX
  // ==========================================================

  const cleanTax =
    Math.max(
      0,
      Number(
        taxAmount
      ) || 0
    );

  // ==========================================================
  // GRAND TOTAL
  // ==========================================================

  const grandTotal =
    Math.max(
      0,
      subtotal -
        cleanDiscount +
        cleanTax
    );

  // ==========================================================
  // ADD ITEM
  // ==========================================================

  const addItem = () => {
    setItems(
      (current) => [
        ...current,
        {
          productId: "",
          productName: "",
          quantity: 1,
          unitPrice: 0,
        },
      ]
    );
  };

  // ==========================================================
  // REMOVE ITEM
  // ==========================================================

  const removeItem = (
    index: number
  ) => {
    if (
      items.length <= 1
    ) {
      return;
    }

    setItems(
      (current) =>
        current.filter(
          (_, itemIndex) =>
            itemIndex !==
            index
        )
    );
  };

  // ==========================================================
  // UPDATE ITEM
  // ==========================================================

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setItems(
      (current) =>
        current.map(
          (item, itemIndex) => {
            if (
              itemIndex !==
              index
            ) {
              return item;
            }

            return {
              ...item,
              [field]: value,
            };
          }
        )
    );
  };

  // ==========================================================
  // PRODUCT CHANGE
  // ==========================================================

  const handleProductChange = (
    index: number,
    productId: string
  ) => {
    const selectedProduct =
      products.find(
        (product) =>
          String(
            product.id
          ) ===
          String(
            productId
          )
      );

    setItems(
      (current) =>
        current.map(
          (item, itemIndex) => {
            if (
              itemIndex !==
              index
            ) {
              return item;
            }

            return {
              ...item,

              productId,

              productName:
                selectedProduct
                  ?.productName ||
                selectedProduct
                  ?.name ||
                "",
            };
          }
        )
    );
  };

  // ==========================================================
  // SUPPLIER CHANGE
  // ==========================================================

  const handleSupplierChange = (
    value: string
  ) => {
    setSupplierId(value);

    setPurchaseOrderId("");

    setGrnId("");
  };

  // ==========================================================
  // PURCHASE ORDER CHANGE
  // ==========================================================

  const handlePurchaseOrderChange = (
    value: string
  ) => {
    setPurchaseOrderId(value);

    setGrnId("");
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError("");

    // ========================================================
    // VALIDATE SUPPLIER
    // ========================================================

    if (!supplierId) {
      setError(
        "Please select a supplier."
      );

      return;
    }

    // ========================================================
    // VALIDATE PURCHASE ORDER
    // ========================================================

    if (!purchaseOrderId) {
      setError(
        "Please select a purchase order."
      );

      return;
    }

    // ========================================================
    // VALIDATE GRN
    // ========================================================

    if (!grnId) {
      setError(
        "Please select a GRN."
      );

      return;
    }

    // ========================================================
    // VALIDATE INVOICE DATE
    // ========================================================

    if (!invoiceDate) {
      setError(
        "Invoice date is required."
      );

      return;
    }

    // ========================================================
    // VALIDATE DUE DATE
    // ========================================================

    if (
      dueDate &&
      invoiceDate &&
      new Date(dueDate) <
        new Date(invoiceDate)
    ) {
      setError(
        "Due date cannot be before invoice date."
      );

      return;
    }

    // ========================================================
    // VALIDATE ITEMS
    // ========================================================

    if (
      items.length === 0
    ) {
      setError(
        "At least one invoice item is required."
      );

      return;
    }

    // ========================================================
    // VALIDATE EACH ITEM
    // ========================================================

    for (
      let index = 0;
      index < items.length;
      index++
    ) {
      const item =
        items[index];

      if (!item.productId) {
        setError(
          `Please select a product for item ${
            index + 1
          }.`
        );

        return;
      }

      const quantity =
        Number(
          item.quantity
        );

      if (
        !isPositiveInteger(
          quantity
        )
      ) {
        setError(
          `Quantity for item ${
            index + 1
          } must be a positive integer.`
        );

        return;
      }

      const unitPrice =
        Number(
          item.unitPrice
        );

      if (
        !Number.isFinite(
          unitPrice
        ) ||
        unitPrice < 0
      ) {
        setError(
          `Unit price for item ${
            index + 1
          } must be valid.`
        );

        return;
      }
    }

    // ========================================================
    // DUPLICATE PRODUCTS
    // ========================================================

    const productIds =
      items.map(
        (item) =>
          String(
            item.productId
          )
      );

    const uniqueProductIds =
      new Set(
        productIds
      );

    if (
      uniqueProductIds.size !==
      productIds.length
    ) {
      setError(
        "Duplicate products are not allowed in the invoice."
      );

      return;
    }

    // ========================================================
    // VALIDATE DISCOUNT
    // ========================================================

    if (
      cleanDiscount >
      subtotal
    ) {
      setError(
        "Discount cannot be greater than subtotal."
      );

      return;
    }

    // ========================================================
    // VALIDATE TOTAL
    // ========================================================

    if (
      grandTotal < 0
    ) {
      setError(
        "Grand total cannot be negative."
      );

      return;
    }

    // ========================================================
    // PAYLOAD
    // ========================================================

    const payload = {
      supplierId:
        Number(
          supplierId
        ),

      purchaseOrderId:
        Number(
          purchaseOrderId
        ),

      grnId:
        Number(
          grnId
        ),

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

      items:
        items.map(
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

    // ========================================================
    // UPDATE
    // ========================================================

    try {
      setSaving(true);

      console.log(
        "=========================================="
      );

      console.log(
        "UPDATE PURCHASE INVOICE"
      );

      console.log(
        "Invoice ID:",
        id
      );

      console.log(
        "URL:",
        `/purchasing/invoices/${id}`
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
        "=========================================="
      );

      const response =
        await api.patch(
          `/purchasing/invoices/${id}`,
          payload
        );

      console.log(
        "UPDATE RESPONSE:",
        response.data
      );

      // ======================================================
      // SUCCESS
      // ======================================================

      router.push(
        INVOICE_LIST_PAGE
      );

      router.refresh();
    } catch (updateError: any) {
      console.error(
        "=========================================="
      );

      console.error(
        "UPDATE PURCHASE INVOICE ERROR"
      );

      console.error(
        updateError
      );

      console.error(
        "Response:",
        updateError?.response
      );

      console.error(
        "Response Data:",
        updateError?.response
          ?.data
      );

      console.error(
        "=========================================="
      );

      const responseData =
        updateError?.response
          ?.data;

      setError(
        getErrorMessage(
          responseData ||
            updateError,
          "Failed to update purchase invoice."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2
            className="animate-spin"
            size={22}
          />

          <span>
            Loading purchase invoice...
          </span>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR / NO INVOICE
  // ==========================================================

  if (
    !invoice &&
    error
  ) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Link
            href={
              INVOICE_LIST_PAGE
            }
            className="inline-flex items-center text-sm text-blue-600 hover:underline"
          >
            ← Back to Purchase Invoices
          </Link>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="p-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-2">
            <Link
              href={
                INVOICE_LIST_PAGE
              }
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back to Purchase Invoices
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Receipt
                size={24}
                className="text-blue-600"
              />
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Edit Purchase Invoice
              </h1>

              <p className="text-sm text-gray-500">
                Update purchase invoice details
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ======================================================
          FORM
      ====================================================== */}

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-6"
      >
        {/* ====================================================
            BASIC INFORMATION
        ==================================================== */}

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Invoice Information
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Invoice Number */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Invoice Number
              </label>

              <input
                type="text"
                value={
                  invoice?.invoiceNumber ||
                  ""
                }
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2.5 text-sm text-gray-600"
              />
            </div>

            {/* Supplier */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Supplier
                <span className="text-red-500">
                  {" "}
                  *
                </span>
              </label>

              <select
                value={
                  supplierId
                }
                onChange={(event) =>
                  handleSupplierChange(
                    event.target
                      .value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Select Supplier
                </option>

                {suppliers
                  .filter(
                    (supplier) =>
                      supplier.isActive !==
                        false ||
                      String(
                        supplier.id
                      ) ===
                        String(
                          supplierId
                        )
                  )
                  .map(
                    (
                      supplier
                    ) => (
                      <option
                        key={
                          supplier.id
                        }
                        value={String(
                          supplier.id
                        )}
                      >
                        {supplier.supplierCode
                          ? `${supplier.supplierCode} - `
                          : ""}
                        {
                          supplier.supplierName
                        }
                      </option>
                    )
                  )}
              </select>
            </div>

            {/* Purchase Order */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Purchase Order
                <span className="text-red-500">
                  {" "}
                  *
                </span>
              </label>

              <select
                value={
                  purchaseOrderId
                }
                onChange={(event) =>
                  handlePurchaseOrderChange(
                    event.target
                      .value
                  )
                }
                disabled={
                  !supplierId
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              >
                <option value="">
                  {supplierId
                    ? "Select Purchase Order"
                    : "Select Supplier First"}
                </option>

                {filteredPurchaseOrders.map(
                  (
                    order
                  ) => (
                    <option
                      key={
                        order.id
                      }
                      value={String(
                        order.id
                      )}
                    >
                      {order.poNumber ||
                        `PO-${order.id}`}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* GRN */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                GRN
                <span className="text-red-500">
                  {" "}
                  *
                </span>
              </label>

              <select
                value={
                  grnId
                }
                onChange={(event) =>
                  setGrnId(
                    event.target
                      .value
                  )
                }
                disabled={
                  !purchaseOrderId
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              >
                <option value="">
                  {purchaseOrderId
                    ? "Select GRN"
                    : "Select Purchase Order First"}
                </option>

                {filteredGrns.map(
                  (grn) => (
                    <option
                      key={
                        grn.id
                      }
                      value={String(
                        grn.id
                      )}
                    >
                      {grn.grnNumber ||
                        `GRN-${grn.id}`}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Invoice Date */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Invoice Date
                <span className="text-red-500">
                  {" "}
                  *
                </span>
              </label>

              <input
                type="date"
                value={
                  invoiceDate
                }
                onChange={(event) =>
                  setInvoiceDate(
                    event.target
                      .value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Due Date */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Due Date
              </label>

              <input
                type="date"
                value={
                  dueDate
                }
                min={
                  invoiceDate ||
                  undefined
                }
                onChange={(event) =>
                  setDueDate(
                    event.target
                      .value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {/* ====================================================
            ITEMS
        ==================================================== */}

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Invoice Items
              </h2>

              <p className="text-sm text-gray-500">
                Update products, quantities and prices
              </p>
            </div>

            <button
              type="button"
              onClick={
                addItem
              }
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus
                size={16}
              />

              Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                  <th className="px-3 py-3">
                    #
                  </th>

                  <th className="px-3 py-3">
                    Product
                  </th>

                  <th className="px-3 py-3">
                    Quantity
                  </th>

                  <th className="px-3 py-3">
                    Unit Price
                  </th>

                  <th className="px-3 py-3">
                    Total
                  </th>

                  <th className="px-3 py-3 text-center">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map(
                  (
                    item,
                    index
                  ) => {
                    const lineTotal =
                      Number(
                        item.quantity
                      ) *
                      Number(
                        item.unitPrice
                      );

                    return (
                      <tr
                        key={
                          item.id ??
                          `new-${index}`
                        }
                        className="border-b border-gray-100"
                      >
                        {/* Number */}

                        <td className="px-3 py-4 text-sm text-gray-600">
                          {index +
                            1}
                        </td>

                        {/* Product */}

                        <td className="px-3 py-4">
                          <select
                            value={
                              item.productId
                            }
                            onChange={(
                              event
                            ) =>
                              handleProductChange(
                                index,
                                event
                                  .target
                                  .value
                              )
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="">
                              Select Product
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
                                    product.productName
                                  }
                                </option>
                              )
                            )}
                          </select>
                        </td>

                        {/* Quantity */}

                        <td className="w-32 px-3 py-4">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={
                              item.quantity
                            }
                            onChange={(
                              event
                            ) =>
                              updateItem(
                                index,
                                "quantity",
                                Number(
                                  event
                                    .target
                                    .value
                                )
                              )
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>

                        {/* Unit Price */}

                        <td className="w-40 px-3 py-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              item.unitPrice
                            }
                            onChange={(
                              event
                            ) =>
                              updateItem(
                                index,
                                "unitPrice",
                                Number(
                                  event
                                    .target
                                    .value
                                )
                              )
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>

                        {/* Total */}

                        <td className="px-3 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(
                            Number(
                              lineTotal
                            ) || 0
                          )}
                        </td>

                        {/* Action */}

                        <td className="px-3 py-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
                                index
                              )
                            }
                            disabled={
                              items.length <=
                              1
                            }
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Remove item"
                          >
                            <Trash2
                              size={18}
                            />
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {items.length ===
            0 && (
            <div className="py-10 text-center text-sm text-gray-500">
              No invoice items added.
            </div>
          )}
        </div>

        {/* ====================================================
            TOTALS
        ==================================================== */}

        <div className="flex justify-end">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              Invoice Summary
            </h2>

            <div className="space-y-4">
              {/* Subtotal */}

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Subtotal
                </span>

                <span className="font-medium text-gray-900">
                  {formatCurrency(
                    subtotal
                  )}
                </span>
              </div>

              {/* Discount */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Discount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    discountAmount
                  }
                  onChange={(
                    event
                  ) =>
                    setDiscountAmount(
                      Number(
                        event
                          .target
                          .value
                      )
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Tax */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tax
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    taxAmount
                  }
                  onChange={(
                    event
                  ) =>
                    setTaxAmount(
                      Number(
                        event
                          .target
                          .value
                      )
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Grand Total */}

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">
                    Grand Total
                  </span>

                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(
                      grandTotal
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div className="flex items-center justify-end gap-3">
          <Link
            href={
              INVOICE_LIST_PAGE
            }
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              saving
            }
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Updating...
              </>
            ) : (
              <>
                <Save
                  size={18}
                />

                Update Invoice
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}