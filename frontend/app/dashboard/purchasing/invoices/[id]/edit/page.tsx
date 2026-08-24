"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";

interface Supplier {
  id: number | string;
  supplierName: string;
}

interface Product {
  id: string;
  productName: string;
  productCode?: string;
}

interface InvoiceItem {
  id?: number;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
}

interface PurchaseInvoice {
  id: number;
  invoiceNumber: string;

  supplierId?: number | string | null;

  invoiceDate: string;

  dueDate?: string | null;

  subtotal: string | number;
  discount: string | number;
  tax: string | number;
  grandTotal: string | number;

  paymentStatus: string;

  items: InvoiceItem[];
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

export default function EditPurchaseInvoicePage() {
  // =====================================================
  // GET DYNAMIC ID
  // =====================================================

  const params = useParams();

  const invoiceId = params?.id
    ? String(params.id)
    : "";

  // =====================================================
  // STATE
  // =====================================================

  const [invoice, setInvoice] =
    useState<PurchaseInvoice | null>(null);

  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [invoiceNumber, setInvoiceNumber] =
    useState("");

  const [supplierId, setSupplierId] =
    useState("");

  const [invoiceDate, setInvoiceDate] =
    useState("");

  const [dueDate, setDueDate] =
    useState("");

  const [items, setItems] =
    useState<InvoiceItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    if (!invoiceId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = getToken();

        const headers: HeadersInit = {
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        };

        const [
          invoiceResponse,
          suppliersResponse,
          productsResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/purchasing/invoices/${invoiceId}`,
            {
              headers,
              cache: "no-store",
            }
          ),

          fetch(
            `${API_URL}/suppliers`,
            {
              headers,
              cache: "no-store",
            }
          ),

          fetch(
            `${API_URL}/products`,
            {
              headers,
              cache: "no-store",
            }
          ),
        ]);

        // =================================================
        // INVOICE RESPONSE
        // =================================================

        const invoiceData =
          await invoiceResponse
            .json()
            .catch(() => null);

        if (!invoiceResponse.ok) {
          throw new Error(
            getApiErrorMessage(
              invoiceData,
              "Failed to load invoice"
            )
          );
        }

        const loadedInvoice =
          invoiceData?.data ||
          invoiceData;

        if (!loadedInvoice) {
          throw new Error(
            "Invoice not found"
          );
        }

        // =================================================
        // SUPPLIERS
        // =================================================

        const suppliersData =
          await suppliersResponse
            .json()
            .catch(() => null);

        // =================================================
        // PRODUCTS
        // =================================================

        const productsData =
          await productsResponse
            .json()
            .catch(() => null);

        // =================================================
        // SET INVOICE
        // =================================================

        setInvoice(loadedInvoice);

        setInvoiceNumber(
          loadedInvoice.invoiceNumber || ""
        );

        setSupplierId(
          loadedInvoice.supplierId !==
            null &&
          loadedInvoice.supplierId !==
            undefined
            ? String(
                loadedInvoice.supplierId
              )
            : ""
        );

        setInvoiceDate(
          loadedInvoice.invoiceDate
            ? String(
                loadedInvoice.invoiceDate
              ).split("T")[0]
            : ""
        );

        setDueDate(
          loadedInvoice.dueDate
            ? String(
                loadedInvoice.dueDate
              ).split("T")[0]
            : ""
        );

        // =================================================
        // SET ITEMS
        // =================================================

        setItems(
          Array.isArray(
            loadedInvoice.items
          )
            ? loadedInvoice.items.map(
                (
                  item: InvoiceItem
                ) => ({
                  id: item.id,

                  productId:
                    item.productId
                      ? String(
                          item.productId
                        )
                      : "",

                  quantity: Number(
                    item.quantity || 0
                  ),

                  unitPrice: Number(
                    item.unitPrice || 0
                  ),

                  discount: Number(
                    item.discount || 0
                  ),

                  tax: Number(
                    item.tax || 0
                  ),
                })
              )
            : []
        );

        // =================================================
        // SET SUPPLIERS
        // =================================================

        const supplierResult =
          Array.isArray(
            suppliersData
          )
            ? suppliersData
            : Array.isArray(
                suppliersData?.data
              )
            ? suppliersData.data
            : [];

        // =================================================
        // SET PRODUCTS
        // =================================================

        const productResult =
          Array.isArray(
            productsData
          )
            ? productsData
            : Array.isArray(
                productsData?.data
              )
            ? productsData.data
            : [];

        setSuppliers(
          supplierResult
        );

        setProducts(
          productResult
        );
      } catch (err) {
        console.error(
          "Load edit invoice error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load invoice"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [invoiceId]);

  // =====================================================
  // TOTALS
  // =====================================================

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0) *
          Number(item.unitPrice || 0),
      0
    );
  }, [items]);

  const discount = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total +
        Number(item.discount || 0),
      0
    );
  }, [items]);

  const tax = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total +
        Number(item.tax || 0),
      0
    );
  }, [items]);

  const grandTotal =
    subtotal -
    discount +
    tax;

  // =====================================================
  // ADD ITEM
  // =====================================================

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        productId: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        tax: 0,
      },
    ]);
  };

  // =====================================================
  // REMOVE ITEM
  // =====================================================

  const removeItem = (
    index: number
  ) => {
    setItems((current) =>
      current.filter(
        (_, i) => i !== index
      )
    );
  };

  // =====================================================
  // UPDATE ITEM
  // =====================================================

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

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");

    // ===================================================
    // VALIDATION
    // ===================================================

    if (!invoiceId) {
      setError(
        "Invoice ID is missing."
      );
      return;
    }

    if (!invoiceNumber.trim()) {
      setError(
        "Please enter invoice number."
      );
      return;
    }

    if (!supplierId) {
      setError(
        "Please select a supplier."
      );
      return;
    }

    if (!invoiceDate) {
      setError(
        "Please select invoice date."
      );
      return;
    }

    if (!items.length) {
      setError(
        "Please add at least one item."
      );
      return;
    }

    const invalidItem = items.find(
      (item) =>
        !item.productId ||
        Number(item.quantity) <= 0 ||
        Number(item.unitPrice) < 0
    );

    if (invalidItem) {
      setError(
        "Please check product, quantity and unit price for all items."
      );
      return;
    }

    // ===================================================
    // UPDATE
    // ===================================================

    try {
      setSaving(true);

      const token = getToken();

      const payload = {
        invoiceNumber:
          invoiceNumber.trim(),

        supplierId:
          Number(supplierId),

        invoiceDate,

        dueDate:
          dueDate || null,

        subtotal,

        discount,

        tax,

        grandTotal,

        items: items.map(
          (item) => ({
            ...(item.id
              ? {
                  id: item.id,
                }
              : {}),

            productId:
              item.productId,

            quantity:
              Number(item.quantity),

            unitPrice:
              Number(item.unitPrice),

            discount:
              Number(item.discount),

            tax:
              Number(item.tax),
          })
        ),
      };

      const response =
        await fetch(
          `${API_URL}/purchasing/invoices/${invoiceId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },

            body: JSON.stringify(
              payload
            ),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            data,
            "Failed to update purchase invoice"
          )
        );
      }

      // =================================================
      // SUCCESS
      // =================================================

      window.location.href =
        `/dashboard/purchasing/invoices/${invoiceId}`;
    } catch (err) {
      console.error(
        "Update invoice error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update purchase invoice"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={38}
            className="mx-auto animate-spin text-blue-600"
          />

          <p className="mt-3 text-sm text-gray-500">
            Loading invoice...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR / NOT FOUND
  // =====================================================

  if (!invoice) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
          <p className="font-medium text-red-600">
            {error ||
              "Invoice not found"}
          </p>

          <Link
            href="/dashboard/purchasing/invoices"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="w-full space-y-6">

        {/* =================================================
    HEADER
================================================= */}

<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

  <div>

    {/* BREADCRUMB */}

    <div className="flex flex-wrap items-center gap-2 text-sm mb-3">

      <Link
        href="/dashboard/purchasing"
        className="text-gray-500 transition-colors hover:text-blue-600"
      >
        Purchasing
      </Link>

      <span className="text-gray-300">
        /
      </span>

      <Link
        href="/dashboard/purchasing/invoices"
        className="text-gray-500 transition-colors hover:text-blue-600"
      >
        Purchase Invoices
      </Link>

      <span className="text-gray-300">
        /
      </span>

      <Link
        href={`/dashboard/purchasing/invoices/${invoiceId}`}
        className="text-gray-500 transition-colors hover:text-blue-600"
      >
        {invoice.invoiceNumber}
      </Link>

      <span className="text-gray-300">
        /
      </span>

      <span className="font-medium text-gray-900">
        Edit
      </span>

    </div>

    {/* PAGE TITLE */}

    <div>

      <h1 className="text-2xl font-semibold text-gray-900">
        Edit Purchase Invoice
      </h1>

      <p className="mt-1 text-sm text-gray-500">
        Update invoice details, products and pricing.
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

          {/* ===============================================
              INVOICE INFORMATION
          =============================================== */}

          <div className="rounded-xl border border-gray-200 bg-white p-6">

            <h2 className="font-semibold text-gray-900">
              Invoice Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update supplier and invoice details.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

              {/* Invoice Number */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Invoice Number *
                </label>

                <input
                  value={
                    invoiceNumber
                  }
                  onChange={(e) =>
                    setInvoiceNumber(
                      e.target.value
                    )
                  }
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Supplier */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Supplier *
                </label>

                <select
                  value={
                    supplierId
                  }
                  onChange={(e) =>
                    setSupplierId(
                      e.target.value
                    )
                  }
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                        {
                          supplier.supplierName
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Invoice Date */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Invoice Date *
                </label>

                <input
                  type="date"
                  value={
                    invoiceDate
                  }
                  onChange={(e) =>
                    setInvoiceDate(
                      e.target.value
                    )
                  }
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                  onChange={(e) =>
                    setDueDate(
                      e.target.value
                    )
                  }
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                  Update products and pricing.
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

              <table className="w-full min-w-[950px] text-sm">

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

                    <th className="px-5 py-3 text-left font-medium text-gray-600">
                      Discount
                    </th>

                    <th className="px-5 py-3 text-left font-medium text-gray-600">
                      Tax
                    </th>

                    <th className="px-5 py-3 text-right font-medium text-gray-600">
                      Total
                    </th>

                    <th />
                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {items.map(
                    (item, index) => {

                      const itemTotal =
                        Number(
                          item.quantity ||
                            0
                        ) *
                          Number(
                            item.unitPrice ||
                              0
                          ) -
                        Number(
                          item.discount ||
                            0
                        ) +
                        Number(
                          item.tax || 0
                        );

                      return (
                        <tr
                          key={
                            item.id ??
                            `new-${index}`
                          }
                        >

                          {/* PRODUCT */}

                          <td className="px-5 py-4">

                            <select
                              value={
                                item.productId
                              }
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "productId",
                                  e.target
                                    .value
                                )
                              }
                              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                                    {
                                      product.productName
                                    }
                                    {product.productCode
                                      ? ` (${product.productCode})`
                                      : ""}
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
                              className="h-10 w-24 rounded-lg border border-gray-300 px-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />

                          </td>

                          {/* UNIT PRICE */}

                          <td className="px-5 py-4">

                            <input
                              type="number"
                              min="0"
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
                              className="h-10 w-32 rounded-lg border border-gray-300 px-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />

                          </td>

                          {/* DISCOUNT */}

                          <td className="px-5 py-4">

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                item.discount
                              }
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "discount",
                                  Number(
                                    e.target
                                      .value
                                  )
                                )
                              }
                              className="h-10 w-28 rounded-lg border border-gray-300 px-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />

                          </td>

                          {/* TAX */}

                          <td className="px-5 py-4">

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                item.tax
                              }
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "tax",
                                  Number(
                                    e.target
                                      .value
                                  )
                                )
                              }
                              className="h-10 w-28 rounded-lg border border-gray-300 px-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />

                          </td>

                          {/* TOTAL */}

                          <td className="px-5 py-4 text-right font-medium text-gray-900">
                            Rs.{" "}
                            {formatMoney(
                              itemTotal
                            )}
                          </td>

                          {/* DELETE */}

                          <td className="px-5 py-4">

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
                              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Trash2
                                size={17}
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
          </div>

          {/* =================================================
              TOTALS
          ================================================= */}

          <div className="flex justify-end">

            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6">

              <TotalRow
                label="Subtotal"
                value={
                  subtotal
                }
              />

              <TotalRow
                label="Discount"
                value={
                  discount
                }
              />

              <TotalRow
                label="Tax"
                value={tax}
              />

              <div className="mt-3 flex justify-between border-t border-gray-200 pt-4">

                <span className="font-semibold text-gray-900">
                  Grand Total
                </span>

                <span className="text-xl font-semibold text-blue-600">
                  Rs.{" "}
                  {formatMoney(
                    grandTotal
                  )}
                </span>

              </div>

              {/* BUTTONS */}

              <div className="mt-6 flex justify-end gap-3">

                <Link
                  href={`/dashboard/purchasing/invoices/${invoiceId}`}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

// =====================================================
// TOTAL ROW
// =====================================================

function TotalRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex justify-between py-2 text-sm">
      <span className="text-gray-500">
        {label}
      </span>

      <span className="font-medium text-gray-900">
        Rs. {formatMoney(value)}
      </span>
    </div>
  );
}

// =====================================================
// MONEY FORMAT
// =====================================================

function formatMoney(
  value: string | number
) {
  return Number(value || 0).toLocaleString(
    "en-LK",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

// =====================================================
// API ERROR
// =====================================================

function getApiErrorMessage(
  data: any,
  fallback: string
) {
  if (!data) {
    return fallback;
  }

  if (Array.isArray(data.message)) {
    return data.message.join(", ");
  }

  if (
    typeof data.message ===
    "string"
  ) {
    return data.message;
  }

  if (
    typeof data.error ===
    "string"
  ) {
    return data.error;
  }

  if (
    typeof data.data?.message ===
    "string"
  ) {
    return data.data.message;
  }

  return fallback;
}