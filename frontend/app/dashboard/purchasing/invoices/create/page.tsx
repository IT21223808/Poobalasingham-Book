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

interface Supplier {
  id: number | string;
  supplierCode?: string;
  supplierName: string;
}

interface Product {
  id: string;
  productCode?: string;
  productName: string;
}

interface PurchaseOrder {
  id: number;
  poNumber?: string;
  supplierId?: number;
  status?: string;
}

interface GRN {
  id: number;
  grnNumber?: string;
  purchaseOrderId?: number;
  status?: string;
}

interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

// =========================================================
// API
// =========================================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

function getErrorMessage(
  data: any,
  fallback = "Failed to create purchase invoice"
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

  // NestJS validation:
  // {
  //   message: [
  //     "supplierId must be an integer number",
  //     ...
  //   ]
  // }
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

  // NestJS:
  // {
  //   message: "..."
  // }
  if (typeof data?.message === "string") {
    return data.message;
  }

  // Nested message object
  if (
    data?.message &&
    typeof data.message === "object"
  ) {
    if (Array.isArray(data.message.message)) {
      return data.message.message
        .map((item: any) =>
          typeof item === "string"
            ? item
            : item?.message ||
              item?.error ||
              JSON.stringify(item)
        )
        .join(", ");
    }

    if (typeof data.message.message === "string") {
      return data.message.message;
    }

    if (typeof data.message.error === "string") {
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
// COMPONENT
// =========================================================

export default function CreatePurchaseInvoicePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(
    []
  );

  const [products, setProducts] = useState<Product[]>(
    []
  );

  const [purchaseOrders, setPurchaseOrders] =
    useState<PurchaseOrder[]>([]);

  const [grns, setGrns] = useState<GRN[]>([]);

  // =======================================================
  // FORM
  // =======================================================

  const [supplierId, setSupplierId] = useState("");

  const [purchaseOrderId, setPurchaseOrderId] =
    useState("");

  const [grnId, setGrnId] = useState("");

  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [dueDate, setDueDate] = useState("");

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      productId: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
    },
  ]);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  // =========================================================
  // TOKEN
  // =========================================================

  const getToken = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;

  // =========================================================
  // COMMON FETCH HEADERS
  // =========================================================

  const getHeaders = () => {
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

  // =========================================================
  // LOAD SUPPLIERS
  // =========================================================

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const response = await fetch(
          `${API_URL}/suppliers`,
          {
            headers: getHeaders(),
          }
        );

        const data =
          await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              data,
              "Failed to load suppliers"
            )
          );
        }

        const result = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setSuppliers(result);
      } catch (error) {
        console.error(
          "Failed to load suppliers:",
          error
        );
      }
    };

    loadSuppliers();
  }, []);

  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(
          `${API_URL}/products`,
          {
            headers: getHeaders(),
          }
        );

        const data =
          await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              data,
              "Failed to load products"
            )
          );
        }

        const result = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setProducts(result);
      } catch (error) {
        console.error(
          "Failed to load products:",
          error
        );
      }
    };

    loadProducts();
  }, []);

  // =========================================================
  // LOAD PURCHASE ORDERS
  // =========================================================

  useEffect(() => {
    const loadPurchaseOrders = async () => {
      try {
        const response = await fetch(
          `${API_URL}/purchasing/orders`,
          {
            headers: getHeaders(),
          }
        );

        const data =
          await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              data,
              "Failed to load purchase orders"
            )
          );
        }

        const result = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setPurchaseOrders(result);
      } catch (error) {
        console.error(
          "Failed to load purchase orders:",
          error
        );
      }
    };

    loadPurchaseOrders();
  }, []);

  // =========================================================
  // LOAD GRNS
  // =========================================================

  useEffect(() => {
    const loadGrns = async () => {
      try {
        const response = await fetch(
          `${API_URL}/purchasing/grn`,
          {
            headers: getHeaders(),
          }
        );

        const data =
          await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              data,
              "Failed to load GRNs"
            )
          );
        }

        const result = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setGrns(result);
      } catch (error) {
        console.error(
          "Failed to load GRNs:",
          error
        );
      }
    };

    loadGrns();
  }, []);

  // =========================================================
  // FILTER PURCHASE ORDERS BY SUPPLIER
  // =========================================================

  const filteredPurchaseOrders = useMemo(() => {
    if (!supplierId) {
      return purchaseOrders;
    }

    return purchaseOrders.filter(
      (order) =>
        order.supplierId === Number(supplierId)
    );
  }, [purchaseOrders, supplierId]);

  // =========================================================
  // FILTER GRNS BY PURCHASE ORDER
  // =========================================================

  const filteredGrns = useMemo(() => {
    if (!purchaseOrderId) {
      return grns;
    }

    return grns.filter(
      (grn) =>
        grn.purchaseOrderId ===
        Number(purchaseOrderId)
    );
  }, [grns, purchaseOrderId]);

  // =========================================================
  // ITEM SUBTOTAL
  // =========================================================

  const calculateItemSubtotal = (
    item: InvoiceItem
  ) => {
    return (
      Number(item.quantity || 0) *
      Number(item.unitPrice || 0)
    );
  };

  // =========================================================
  // TOTALS
  // =========================================================

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0) *
          Number(item.unitPrice || 0),
      0
    );
  }, [items]);

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

  const removeItem = (index: number) => {
    setItems((current) =>
      current.filter(
        (_, i) => i !== index
      )
    );
  };

  // =========================================================
  // UPDATE ITEM
  // =========================================================

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setItems((current) =>
      current.map((item, i) =>
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
  // PRODUCT CHANGE
  // =========================================================

  const handleProductChange = (
    index: number,
    productId: string
  ) => {
    const product = products.find(
      (item) =>
        String(item.id) === productId
    );

    setItems((current) =>
      current.map((item, i) =>
        i === index
          ? {
              ...item,
              productId,
              productName:
                product?.productName || "",
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

    // Reset dependent fields
    setPurchaseOrderId("");
    setGrnId("");
  };

  // =========================================================
  // PURCHASE ORDER CHANGE
  // =========================================================

  const handlePurchaseOrderChange = (
    value: string
  ) => {
    setPurchaseOrderId(value);

    // Reset dependent GRN
    setGrnId("");
  };

  // =========================================================
  // CREATE PURCHASE INVOICE
  // =========================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");

    // -------------------------------------------------------
    // SUPPLIER VALIDATION
    // -------------------------------------------------------

    if (!supplierId) {
      setError(
        "Please select a supplier."
      );
      return;
    }

    const supplierNumber =
      Number(supplierId);

    if (
      !Number.isInteger(
        supplierNumber
      ) ||
      supplierNumber <= 0
    ) {
      setError(
        "Invalid supplier selected."
      );
      return;
    }

    // -------------------------------------------------------
    // PURCHASE ORDER VALIDATION
    // -------------------------------------------------------

    if (!purchaseOrderId) {
      setError(
        "Please select a purchase order."
      );
      return;
    }

    const purchaseOrderNumber =
      Number(purchaseOrderId);

    if (
      !Number.isInteger(
        purchaseOrderNumber
      ) ||
      purchaseOrderNumber <= 0
    ) {
      setError(
        "Invalid purchase order selected."
      );
      return;
    }

    // -------------------------------------------------------
    // GRN VALIDATION
    // -------------------------------------------------------

    if (!grnId) {
      setError(
        "Please select a GRN."
      );
      return;
    }

    const grnNumber = Number(grnId);

    if (
      !Number.isInteger(grnNumber) ||
      grnNumber <= 0
    ) {
      setError(
        "Invalid GRN selected."
      );
      return;
    }

    // -------------------------------------------------------
    // DATE VALIDATION
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // ITEM VALIDATION
    // -------------------------------------------------------

    if (items.length === 0) {
      setError(
        "Please add at least one invoice item."
      );
      return;
    }

    const invalidItem = items.find(
      (item) =>
        !item.productId ||
        !Number.isFinite(
          Number(item.quantity)
        ) ||
        Number(item.quantity) <= 0 ||
        !Number.isFinite(
          Number(item.unitPrice)
        ) ||
        Number(item.unitPrice) <= 0
    );

    if (invalidItem) {
      setError(
        "Please provide a valid product, quantity and unit price for every item."
      );
      return;
    }

    // -------------------------------------------------------
    // DUPLICATE PRODUCT VALIDATION
    // -------------------------------------------------------

    const productIds = items.map(
      (item) => item.productId
    );

    const uniqueProductIds = [
      ...new Set(productIds),
    ];

    if (
      uniqueProductIds.length !==
      productIds.length
    ) {
      setError(
        "Duplicate products are not allowed."
      );
      return;
    }

    // -------------------------------------------------------
    // START
    // -------------------------------------------------------

    try {
      setSaving(true);

      const token = getToken();

      // =====================================================
      // IMPORTANT
      //
      // Backend CreatePurchaseInvoiceDto expects:
      //
      // supplierId
      // purchaseOrderId
      // grnId
      // invoiceDate?
      // dueDate?
      // discountAmount?
      // taxAmount?
      // items[]
      //
      // Backend generates invoiceNumber.
      //
      // Backend does NOT expect:
      // invoiceNumber
      // subtotal
      // discount
      // tax
      // grandTotal
      // paymentStatus
      // =====================================================

      const payload = {
        supplierId:
          supplierNumber,

        purchaseOrderId:
          purchaseOrderNumber,

        grnId:
          grnNumber,

        invoiceDate:
          invoiceDate,

        ...(dueDate
          ? {
              dueDate,
            }
          : {}),

        // Backend DTO uses discountAmount
        // and taxAmount.
        //
        // Current UI has no separate invoice-level
        // discount/tax fields, so send 0.

        discountAmount: 0,

        taxAmount: 0,

        items: items.map(
          (item) => ({
            // Product.id is UUID
            productId:
              String(item.productId),

            quantity:
              Number(item.quantity),

            unitPrice:
              Number(item.unitPrice),
          })
        ),
      };

      console.log(
        "========== CREATE PURCHASE INVOICE =========="
      );

      console.log(
        "REQUEST URL:",
        `${API_URL}/purchasing/invoices`
      );

      console.log(
        "REQUEST PAYLOAD:",
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      console.log(
        "============================================="
      );

      // =====================================================
      // FETCH
      // =====================================================

      let response: Response;

      try {
        response = await fetch(
          `${API_URL}/purchasing/invoices`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );
      } catch (networkError: any) {
        console.error(
          "NETWORK ERROR:",
          networkError
        );

        throw new Error(
          "Failed to fetch. Please make sure the backend server is running at " +
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
        "========== PURCHASE INVOICE RESPONSE =========="
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
      // ERROR RESPONSE
      // =====================================================

      if (!response.ok) {
        const errorMessage =
          getErrorMessage(
            data,
            `Failed to create purchase invoice (${response.status})`
          );

        throw new Error(
          errorMessage
        );
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      console.log(
        "Purchase invoice created successfully:",
        data
      );

      // Redirect after successful creation
      window.location.href =
        "/dashboard/purchasing/invoices";
    } catch (error: unknown) {
      console.error(
        "========== CREATE PURCHASE INVOICE ERROR =========="
      );

      console.error(
        error
      );

      let message =
        "Failed to create purchase invoice.";

      if (error instanceof Error) {
        message =
          error.message ||
          message;
      } else if (
        typeof error === "string"
      ) {
        message =
          error;
      } else {
        message =
          getErrorMessage(
            error,
            message
          );
      }

      // Never show [object Object]
      if (
        message ===
        "[object Object]"
      ) {
        message =
          "An unexpected error occurred while creating the purchase invoice.";
      }

      console.error(
        "FINAL ERROR MESSAGE:",
        message
      );

      console.error(
        "===================================================="
      );

      setError(
        message
      );
    } finally {
      setSaving(false);
    }
  };

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
              href="/dashboard/purchasing/invoices"
              className="text-gray-500 transition hover:text-blue-600"
            >
              Purchase Invoices
            </Link>

            <span className="text-gray-400">
              /
            </span>

            <span className="font-medium text-gray-900">
              Create
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
                Create Purchase Invoice
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Create a new purchase invoice from a purchase order and GRN.
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
                  Select supplier, purchase order and GRN.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

              {/* SUPPLIER */}

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
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Select supplier
                  </option>

                  {suppliers.map(
                    (supplier) => (
                      <option
                        key={supplier.id}
                        value={supplier.id}
                      >
                        {
                          supplier.supplierName
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* PURCHASE ORDER */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Purchase Order *
                </label>

                <select
                  value={purchaseOrderId}
                  onChange={(e) =>
                    handlePurchaseOrderChange(
                      e.target.value
                    )
                  }
                  disabled={!supplierId}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none disabled:bg-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              </div>

              {/* GRN */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  GRN *
                </label>

                <select
                  value={grnId}
                  onChange={(e) =>
                    setGrnId(
                      e.target.value
                    )
                  }
                  disabled={!purchaseOrderId}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none disabled:bg-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              </div>

              {/* INVOICE DATE */}

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
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* DUE DATE */}

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
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>
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
                  Add products included in this invoice.
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus size={16} />
                Add Item
              </button>

            </div>

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
                    (item, index) => (
                      <tr key={index}>

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
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                          >

                            <option value="">
                              Select product
                            </option>

                            {products.map(
                              (product) => (
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
                                  e.target
                                    .value
                                )
                              )
                            }
                            className="h-10 w-28 rounded-lg border border-gray-300 px-3"
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
                                  e.target
                                    .value
                                )
                              )
                            }
                            className="h-10 w-32 rounded-lg border border-gray-300 px-3"
                          />

                        </td>

                        {/* SUBTOTAL */}

                        <td className="px-5 py-4 text-right font-medium">

                          Rs.{" "}
                          {calculateItemSubtotal(
                            item
                          ).toLocaleString(
                            "en-LK",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
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
                              items.length ===
                              1
                            }
                            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
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

          </div>

          {/* =================================================
              TOTALS
          ================================================= */}

          <div className="flex justify-end">

            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6">

              <div className="flex justify-between py-2 text-sm">

                <span className="text-gray-500">
                  Subtotal
                </span>

                <span className="font-medium">
                  Rs.{" "}
                  {subtotal.toLocaleString(
                    "en-LK",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>

              </div>

              <div className="flex justify-between py-2 text-sm">

                <span className="text-gray-500">
                  Discount
                </span>

                <span>
                  Rs. 0.00
                </span>

              </div>

              <div className="flex justify-between py-2 text-sm">

                <span className="text-gray-500">
                  Tax
                </span>

                <span>
                  Rs. 0.00
                </span>

              </div>

              <div className="mt-3 flex justify-between border-t border-gray-200 pt-4">

                <span className="font-semibold">
                  Grand Total
                </span>

                <span className="text-xl font-semibold text-blue-600">
                  Rs.{" "}
                  {subtotal.toLocaleString(
                    "en-LK",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>

              </div>

              {/* =================================================
                  BUTTONS
              ================================================= */}

              <div className="mt-6 flex justify-end gap-3">

                <Link
                  href="/dashboard/purchasing/invoices"
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >

                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving
                    ? "Creating..."
                    : "Create Invoice"}

                </button>

              </div>

            </div>

          </div>

        </form>

      </div>
    </div>
  );
}

