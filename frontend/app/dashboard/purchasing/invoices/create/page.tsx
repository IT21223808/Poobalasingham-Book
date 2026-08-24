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

interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

export default function CreatePurchaseInvoicePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
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
      discount: 0,
      tax: 0,
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;

  // =====================================================
  // LOAD SUPPLIERS
  // =====================================================

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const token = getToken();

        const response = await fetch(
          `${API_URL}/suppliers`,
          {
            headers: {
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
          }
        );

        const data = await response.json();

        const result = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setSuppliers(result);
      } catch (error) {
        console.error(
          "Failed to load suppliers",
          error
        );
      }
    };

    loadSuppliers();
  }, []);

  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const token = getToken();

        const response = await fetch(
          `${API_URL}/products`,
          {
            headers: {
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
          }
        );

        const data = await response.json();

        const result = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setProducts(result);
      } catch (error) {
        console.error(
          "Failed to load products",
          error
        );
      }
    };

    loadProducts();
  }, []);

  // =====================================================
  // ITEM CALCULATIONS
  // =====================================================

  const calculateItemSubtotal = (
    item: InvoiceItem
  ) => {
    const gross =
      Number(item.quantity || 0) *
      Number(item.unitPrice || 0);

    const discount =
      Number(item.discount || 0);

    const tax =
      Number(item.tax || 0);

    const afterDiscount =
      gross - discount;

    return afterDiscount + tax;
  };

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      return (
        total +
        Number(item.quantity || 0) *
          Number(item.unitPrice || 0)
      );
    }, 0);
  }, [items]);

  const totalDiscount = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + Number(item.discount || 0),
      0
    );
  }, [items]);

  const totalTax = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + Number(item.tax || 0),
      0
    );
  }, [items]);

  const grandTotal =
    subtotal -
    totalDiscount +
    totalTax;

  // =====================================================
  // ITEM HANDLERS
  // =====================================================

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        productId: "",
        productName: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        tax: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((current) =>
      current.filter(
        (_, i) => i !== index
      )
    );
  };

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

  // =====================================================
  // CREATE
  // =====================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");

    if (!supplierId) {
      setError(
        "Please select a supplier."
      );
      return;
    }

    if (!invoiceNumber.trim()) {
      setError(
        "Please enter invoice number."
      );
      return;
    }

    if (items.length === 0) {
      setError(
        "Please add at least one item."
      );
      return;
    }

    if (
      items.some(
        (item) =>
          !item.productId ||
          Number(item.quantity) <= 0 ||
          Number(item.unitPrice) < 0
      )
    ) {
      setError(
        "Please provide valid product, quantity and unit price."
      );
      return;
    }

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

        discount:
          totalDiscount,

        tax:
          totalTax,

        grandTotal,

        paymentStatus:
          "UNPAID",

        items: items.map(
          (item) => ({
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
              JSON.stringify(payload),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          Array.isArray(
            data?.message
          )
            ? data.message.join(", ")
            : data?.message ||
                "Failed to create purchase invoice"
        );
      }

      window.location.href =
        "/dashboard/purchasing/invoices";
    } catch (err) {
      console.error(
        "Create invoice error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create purchase invoice"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="w-full space-y-6">

        {/* =================================================
            HEADER / BREADCRUMB
        ================================================= */}

        <div>
          {/* BREADCRUMB */}

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

          {/* PAGE TITLE */}

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
                Create a new purchase invoice.
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
              BASIC INFORMATION
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
                  Enter supplier and invoice details.
                </p>
              </div>

            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

              {/* Invoice Number */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Invoice Number *
                </label>

                <input
                  value={invoiceNumber}
                  onChange={(e) =>
                    setInvoiceNumber(
                      e.target.value
                    )
                  }
                  placeholder="INV-00001"
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Supplier */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Supplier *
                </label>

                <select
                  value={supplierId}
                  onChange={(e) =>
                    setSupplierId(
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

              {/* Invoice Date */}

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

              {/* Due Date */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Due Date
                </label>

                <input
                  type="date"
                  value={dueDate}
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
                            className="h-10 w-32 rounded-lg border border-gray-300 px-3"
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
                            className="h-10 w-28 rounded-lg border border-gray-300 px-3"
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
                            className="h-10 w-28 rounded-lg border border-gray-300 px-3"
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
                    }
                  )}
                </span>

              </div>

              <div className="flex justify-between py-2 text-sm">

                <span className="text-gray-500">
                  Discount
                </span>

                <span>
                  Rs.{" "}
                  {totalDiscount.toLocaleString(
                    "en-LK",
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </span>

              </div>

              <div className="flex justify-between py-2 text-sm">

                <span className="text-gray-500">
                  Tax
                </span>

                <span>
                  Rs.{" "}
                  {totalTax.toLocaleString(
                    "en-LK",
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </span>

              </div>

              <div className="mt-3 flex justify-between border-t border-gray-200 pt-4">

                <span className="font-semibold">
                  Grand Total
                </span>

                <span className="text-xl font-semibold text-blue-600">
                  Rs.{" "}
                  {grandTotal.toLocaleString(
                    "en-LK",
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </span>

              </div>

              {/* BUTTONS */}

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