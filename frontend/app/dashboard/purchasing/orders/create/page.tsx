"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import api from "@/services/api";

// =========================================================
// TYPES
// =========================================================

interface Product {
  id: string;
  productCode?: string;
  productName: string;
  sellingPrice?: number | string;
  costPrice?: number | string;
  purchasePrice?: number | string;
}

interface Supplier {
  id: number | string;
  supplierCode?: string;
  supplierName: string;
}

interface RequisitionItem {
  id: number;
  productId: string;
  quantity: number;
  product?: Product;
}

interface Requisition {
  id: number;
  requisitionNumber?: string;
  status: string;
  items?: RequisitionItem[];
}

interface OrderItem {
  productId: string;
  productName: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
}

// =========================================================
// HELPERS
// =========================================================

function extractArray<T>(data: any): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function getProductPurchasePrice(product?: Product): number {
  if (!product) {
    return 0;
  }

  const price =
    product.purchasePrice ??
    product.costPrice ??
    product.sellingPrice ??
    0;

  const numericPrice = Number(price);

  return Number.isFinite(numericPrice)
    ? numericPrice
    : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function toISODate(value: string): string {
  if (!value) {
    return "";
  }

  return new Date(`${value}T00:00:00`).toISOString();
}

// =========================================================
// PAGE
// =========================================================

export default function CreatePurchaseOrderPage() {
  // =======================================================
  // DATA
  // =======================================================

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>(
    [],
  );

  // =======================================================
  // FORM
  // =======================================================

  const [notes, setNotes] = useState("");

  const [requisitionId, setRequisitionId] =
    useState("");

  const [selectedSupplierId, setSelectedSupplierId] =
    useState("");

  const [poDate, setPoDate] = useState("");

  const [expectedDeliveryDate, setExpectedDeliveryDate] =
    useState("");

  const [discount, setDiscount] = useState("0");

  const [tax, setTax] = useState("0");

  const [items, setItems] = useState<OrderItem[]>([]);

  // =======================================================
  // ADD ITEM
  // =======================================================

  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [itemQuantity, setItemQuantity] =
    useState("1");

  const [itemUnitPrice, setItemUnitPrice] =
    useState("0");

  // =======================================================
  // UI STATE
  // =======================================================

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  // =======================================================
  // INITIAL DATE
  // =======================================================

  useEffect(() => {
    const today = new Date();

    const localDate =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");

    setPoDate(localDate);
  }, []);

  // =======================================================
  // LOAD INITIAL DATA
  // =======================================================

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError(null);

      const [
        productsResponse,
        suppliersResponse,
        requisitionsResponse,
      ] = await Promise.all([
        api.get("/products"),

        api.get("/suppliers"),

        api.get("/purchasing/requisitions", {
          params: {
            status: "APPROVED",
          },
        }),
      ]);

      const productsData =
        productsResponse.data;

      const suppliersData =
        suppliersResponse.data;

      const requisitionsData =
        requisitionsResponse.data;

      const loadedProducts =
        extractArray<Product>(
          productsData,
        );

      const loadedSuppliers =
        extractArray<Supplier>(
          suppliersData,
        );

      const loadedRequisitions =
        extractArray<Requisition>(
          requisitionsData,
        ).filter(
          (requisition) =>
            String(
              requisition.status,
            ).toUpperCase() === "APPROVED",
        );

      console.log(
        "Products:",
        loadedProducts,
      );

      console.log(
        "Suppliers:",
        loadedSuppliers,
      );

      console.log(
        "Approved requisitions:",
        loadedRequisitions,
      );

      setProducts(loadedProducts);
      setSuppliers(loadedSuppliers);
      setRequisitions(
        loadedRequisitions,
      );
    } catch (err: any) {
      console.error(
        "Create PO load error:",
        err,
      );

      const message =
        err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(", ")
          : typeof message === "string"
            ? message
            : err instanceof Error
              ? err.message
              : "Failed to load required data.",
      );
    } finally {
      setLoading(false);
    }
  }

  // =======================================================
  // SELECTED REQUISITION
  // =======================================================

  const selectedRequisition =
    useMemo(() => {
      if (!requisitionId) {
        return undefined;
      }

      return requisitions.find(
        (requisition) =>
          String(requisition.id) ===
          String(requisitionId),
      );
    }, [
      requisitions,
      requisitionId,
    ]);

  // =======================================================
  // SELECTED SUPPLIER
  // =======================================================

  const selectedSupplier =
    useMemo(() => {
      if (!selectedSupplierId) {
        return undefined;
      }

      return suppliers.find(
        (supplier) =>
          String(supplier.id) ===
          String(selectedSupplierId),
      );
    }, [
      suppliers,
      selectedSupplierId,
    ]);

  // =======================================================
  // SELECTED PRODUCT
  // =======================================================

  const selectedProduct =
    useMemo(() => {
      if (!selectedProductId) {
        return undefined;
      }

      return products.find(
        (product) =>
          String(product.id) ===
          String(selectedProductId),
      );
    }, [
      products,
      selectedProductId,
    ]);

  // =======================================================
  // UPDATE PRODUCT PRICE
  // =======================================================

  useEffect(() => {
    if (!selectedProduct) {
      setItemUnitPrice("0");
      return;
    }

    const price =
      getProductPurchasePrice(
        selectedProduct,
      );

    setItemUnitPrice(
      String(price),
    );
  }, [selectedProduct]);

  // =======================================================
  // REQUISITION CHANGE
  // =======================================================

  function handleRequisitionChange(
    value: string,
  ) {
    setRequisitionId(value);
    setError(null);

    if (!value) {
      setItems([]);
      return;
    }

    const requisition =
      requisitions.find(
        (item) =>
          String(item.id) === value,
      );

    if (!requisition) {
      setItems([]);
      return;
    }

    if (
      String(requisition.status).toUpperCase() !==
      "APPROVED"
    ) {
      setError(
        "Only approved requisitions can be converted into a purchase order.",
      );

      setItems([]);
      return;
    }

    const requisitionItems =
      requisition.items ?? [];

    const mappedItems: OrderItem[] =
      requisitionItems.map(
        (item) => {
          const product =
            item.product ??
            products.find(
              (product) =>
                String(product.id) ===
                String(item.productId),
            );

          return {
            productId: String(
              item.productId,
            ),
            productName:
              product?.productName ??
              `Product ${item.productId}`,
            productCode:
              product?.productCode,
            quantity: Number(
              item.quantity,
            ),
            unitPrice:
              getProductPurchasePrice(
                product,
              ),
          };
        },
      );

    setItems(mappedItems);
  }

  // =======================================================
  // ADD ITEM
  // =======================================================

  function handleAddItem() {
    setError(null);

    if (!selectedRequisition) {
      setError(
        "Please select an approved requisition.",
      );
      return;
    }

    if (!selectedSupplier) {
      setError(
        "Please select a supplier.",
      );
      return;
    }

    if (!selectedProduct) {
      setError(
        "Please select a product.",
      );
      return;
    }

    const quantity =
      Number(itemQuantity);

    const unitPrice =
      Number(itemUnitPrice);

    if (
      !Number.isFinite(quantity) ||
      quantity < 1
    ) {
      setError(
        "Quantity must be at least 1.",
      );
      return;
    }

    if (
      !Number.isFinite(unitPrice) ||
      unitPrice < 0
    ) {
      setError(
        "Unit price cannot be negative.",
      );
      return;
    }

    const requisitionProductIds =
      (selectedRequisition.items ?? []).map(
        (item) =>
          String(item.productId),
      );

    if (
      !requisitionProductIds.includes(
        String(selectedProduct.id),
      )
    ) {
      setError(
        "This product does not belong to the selected requisition.",
      );
      return;
    }

    setItems((currentItems) => {
      const existingIndex =
        currentItems.findIndex(
          (item) =>
            String(item.productId) ===
            String(selectedProduct.id),
        );

      if (existingIndex >= 0) {
        return currentItems.map(
          (item, index) => {
            if (
              index !== existingIndex
            ) {
              return item;
            }

            return {
              ...item,
              quantity:
                item.quantity +
                quantity,
              unitPrice,
            };
          },
        );
      }

      return [
        ...currentItems,
        {
          productId: String(
            selectedProduct.id,
          ),
          productName:
            selectedProduct.productName,
          productCode:
            selectedProduct.productCode,
          quantity,
          unitPrice,
        },
      ];
    });

    setSelectedProductId("");
    setItemQuantity("1");
    setItemUnitPrice("0");
  }

  // =======================================================
  // REMOVE ITEM
  // =======================================================

  function handleRemoveItem(
    productId: string,
  ) {
    setItems((currentItems) =>
      currentItems.filter(
        (item) =>
          String(item.productId) !==
          String(productId),
      ),
    );
  }

  // =======================================================
  // UPDATE QUANTITY
  // =======================================================

  function updateQuantity(
    productId: string,
    value: string,
  ) {
    const quantity =
      Number(value);

    if (
      !Number.isFinite(quantity) ||
      quantity < 1
    ) {
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        String(item.productId) ===
        String(productId)
          ? {
              ...item,
              quantity,
            }
          : item,
      ),
    );
  }

  // =======================================================
  // UPDATE UNIT PRICE
  // =======================================================

  function updateUnitPrice(
    productId: string,
    value: string,
  ) {
    const unitPrice =
      Number(value);

    if (
      !Number.isFinite(unitPrice) ||
      unitPrice < 0
    ) {
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        String(item.productId) ===
        String(productId)
          ? {
              ...item,
              unitPrice,
            }
          : item,
      ),
    );
  }

  // =======================================================
  // TOTALS
  // =======================================================

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total +
        Number(item.quantity) *
          Number(item.unitPrice),
      0,
    );
  }, [items]);

  const discountAmount =
    useMemo(() => {
      const value =
        Number(discount);

      if (
        !Number.isFinite(value) ||
        value < 0
      ) {
        return 0;
      }

      return value;
    }, [discount]);

  const taxableAmount = Math.max(
    0,
    subtotal - discountAmount,
  );

  const taxAmount =
    useMemo(() => {
      const value =
        Number(tax);

      if (
        !Number.isFinite(value) ||
        value < 0
      ) {
        return 0;
      }

      return value;
    }, [tax]);

  const totalAmount =
    taxableAmount + taxAmount;

  // =======================================================
  // SUBMIT
  // =======================================================

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    setError(null);

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!selectedRequisition) {
      setError(
        "Please select an approved requisition.",
      );
      return;
    }

    if (
      String(
        selectedRequisition.status,
      ).toUpperCase() !== "APPROVED"
    ) {
      setError(
        "Selected requisition is not approved.",
      );
      return;
    }

    if (!selectedSupplier) {
      setError(
        "Please select a supplier.",
      );
      return;
    }

    if (!poDate) {
      setError(
        "Please select the purchase order date.",
      );
      return;
    }

    if (!expectedDeliveryDate) {
      setError(
        "Please select the expected delivery date.",
      );
      return;
    }

    if (
      expectedDeliveryDate <
      poDate
    ) {
      setError(
        "Expected delivery date cannot be earlier than the PO date.",
      );
      return;
    }

    if (items.length === 0) {
      setError(
        "Please add at least one product.",
      );
      return;
    }

    for (const item of items) {
      if (
        !item.productId ||
        Number(item.quantity) < 1
      ) {
        setError(
          "All items must have a valid quantity.",
        );
        return;
      }

      if (
        !Number.isFinite(
          Number(item.unitPrice),
        ) ||
        Number(item.unitPrice) < 0
      ) {
        setError(
          "All items must have a valid unit price.",
        );
        return;
      }
    }

    // -----------------------------------------------------
    // PAYLOAD
    // -----------------------------------------------------

    const payload = {
      requisitionId:
        Number(requisitionId),

      supplierId:
        Number(selectedSupplierId),

      poDate:
        toISODate(poDate),

      expectedDeliveryDate:
        toISODate(
          expectedDeliveryDate,
        ),

      discountAmount:
        Number(discountAmount),

      taxAmount:
        Number(taxAmount),

      notes:
        notes.trim() || null,

      items: items.map(
        (item) => ({
          productId:
            String(item.productId),

          quantity:
            Number(item.quantity),

          unitPrice:
            Number(item.unitPrice),
        }),
      ),
    };

    try {
      setSubmitting(true);

      console.log(
        "Creating purchase order:",
        payload,
      );

      // ===================================================
      // CREATE PURCHASE ORDER
      // ===================================================

      const response =
        await api.post(
          "/purchasing/orders",
          payload,
        );

      const createdOrder =
        response.data;

      console.log(
        "Purchase order created:",
        createdOrder,
      );

      // ===================================================
      // REDIRECT
      // ===================================================

      const createdId =
        createdOrder?.id ??
        createdOrder?.data?.id;

      if (createdId) {
        window.location.href =
          `/dashboard/purchasing/orders/${createdId}`;
      } else {
        window.location.href =
          "/dashboard/purchasing/orders";
      }
    } catch (err: any) {
      console.error(
        "Create purchase order error:",
        err,
      );

      const message =
        err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(", ")
          : typeof message === "string"
            ? message
            : err instanceof Error
              ? err.message
              : "Unable to create purchase order.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />

          <span>
            Loading purchase order data...
          </span>
        </div>
      </div>
    );
  }

  // =======================================================
  // UI
  // =======================================================

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/dashboard"
            className="hover:text-slate-900"
          >
            Dashboard
          </Link>

          <span>/</span>

          <Link
            href="/dashboard/purchasing"
            className="hover:text-slate-900"
          >
            Purchasing
          </Link>

          <span>/</span>

          <Link
            href="/dashboard/purchasing/orders"
            className="hover:text-slate-900"
          >
            Purchase Orders
          </Link>

          <span>/</span>

          <span className="text-slate-900">
            Create
          </span>
        </div>

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/purchasing/orders"
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Create Purchase Order
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Create a purchase order from an approved requisition.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex items-start gap-3">
              <span className="font-semibold">
                Error:
              </span>

              <span>
                {error}
              </span>
            </div>
          </div>
        )}

        {/* =================================================
            DATA WARNINGS
        ================================================= */}

        {requisitions.length === 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="font-semibold text-amber-800">
              No approved requisitions available
            </p>

            <p className="mt-1 text-sm text-amber-700">
              Approve a purchase requisition first before creating a purchase order.
            </p>
          </div>
        )}

        {suppliers.length === 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="font-semibold text-amber-800">
              No suppliers available
            </p>

            <p className="mt-1 text-sm text-amber-700">
              Create a supplier before creating a purchase order.
            </p>
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
              PO INFORMATION
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Purchase Order Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select the approved requisition and supplier.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">

              {/* REQUISITION */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Approved Requisition
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <select
                  value={requisitionId}
                  onChange={(event) =>
                    handleRequisitionChange(
                      event.target.value,
                    )
                  }
                  disabled={
                    requisitions.length === 0
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">
                    Select approved requisition
                  </option>

                  {requisitions.map(
                    (requisition) => (
                      <option
                        key={requisition.id}
                        value={requisition.id}
                      >
                        {requisition.requisitionNumber ??
                          `REQ-${requisition.id}`}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* SUPPLIER */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Supplier
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <select
                  value={
                    selectedSupplierId
                  }
                  onChange={(event) =>
                    setSelectedSupplierId(
                      event.target.value,
                    )
                  }
                  disabled={
                    suppliers.length === 0
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                        {supplier.supplierCode
                          ? `${supplier.supplierCode} - `
                          : ""}
                        {supplier.supplierName}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* PO DATE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  PO Date
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="date"
                    value={poDate}
                    onChange={(event) =>
                      setPoDate(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              {/* EXPECTED DELIVERY */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Expected Delivery Date
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="date"
                    value={
                      expectedDeliveryDate
                    }
                    min={poDate || undefined}
                    onChange={(event) =>
                      setExpectedDeliveryDate(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              REQUISITION PRODUCTS
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Requisition Products
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Products from the selected approved requisition.
              </p>
            </div>

            <div className="p-6">

              {/* ADD ITEM */}

              <div className="mb-6 rounded-xl bg-slate-50 p-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_140px_160px_auto] lg:items-end">

                  {/* PRODUCT */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Product
                    </label>

                    <select
                      value={
                        selectedProductId
                      }
                      onChange={(event) =>
                        setSelectedProductId(
                          event.target.value,
                        )
                      }
                      disabled={
                        !selectedRequisition
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="">
                        Select product
                      </option>

                      {(
                        selectedRequisition?.items ??
                        []
                      ).map(
                        (requisitionItem) => {
                          const product =
                            requisitionItem.product ??
                            products.find(
                              (item) =>
                                String(
                                  item.id,
                                ) ===
                                String(
                                  requisitionItem.productId,
                                ),
                            );

                          return (
                            <option
                              key={
                                requisitionItem.id
                              }
                              value={
                                requisitionItem.productId
                              }
                            >
                              {product?.productCode
                                ? `${product.productCode} - `
                                : ""}
                              {product?.productName ??
                                `Product ${requisitionItem.productId}`}
                            </option>
                          );
                        },
                      )}
                    </select>
                  </div>

                  {/* QUANTITY */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Quantity
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={
                        itemQuantity
                      }
                      onChange={(event) =>
                        setItemQuantity(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  {/* UNIT PRICE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Unit Price
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        itemUnitPrice
                      }
                      onChange={(event) =>
                        setItemUnitPrice(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  {/* ADD BUTTON */}

                  <button
                    type="button"
                    onClick={
                      handleAddItem
                    }
                    disabled={
                      !selectedRequisition ||
                      !selectedSupplier
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />

                    Add
                  </button>
                </div>
              </div>

              {/* ITEMS TABLE */}

              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
                  <p className="text-sm font-medium text-slate-600">
                    No products added yet.
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Select an approved requisition to load its products.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Product
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Code
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Quantity
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Unit Price
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Amount
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200 bg-white">
                      {items.map(
                        (item) => {
                          const amount =
                            Number(
                              item.quantity,
                            ) *
                            Number(
                              item.unitPrice,
                            );

                          return (
                            <tr
                              key={
                                item.productId
                              }
                              className="hover:bg-slate-50"
                            >
                              <td className="px-4 py-4">
                                <div className="font-medium text-slate-900">
                                  {
                                    item.productName
                                  }
                                </div>
                              </td>

                              <td className="px-4 py-4 text-sm text-slate-500">
                                {item.productCode ??
                                  "-"}
                              </td>

                              <td className="px-4 py-4">
                                <input
                                  type="number"
                                  min="1"
                                  value={
                                    item.quantity
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateQuantity(
                                      item.productId,
                                      event.target
                                        .value,
                                    )
                                  }
                                  className="mx-auto block w-24 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                              </td>

                              <td className="px-4 py-4">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={
                                    item.unitPrice
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateUnitPrice(
                                      item.productId,
                                      event.target
                                        .value,
                                    )
                                  }
                                  className="ml-auto block w-32 rounded-lg border border-slate-300 px-3 py-2 text-right text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                              </td>

                              <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">
                                {formatCurrency(
                                  amount,
                                )}
                              </td>

                              <td className="px-4 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveItem(
                                      item.productId,
                                    )
                                  }
                                  className="inline-flex rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                                  title="Remove item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              NOTES
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Additional Notes
              </h2>
            </div>

            <div className="p-6">
              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value,
                  )
                }
                rows={4}
                placeholder="Enter any additional notes..."
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          {/* =================================================
              ORDER SUMMARY
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Order Summary
              </h2>
            </div>

            <div className="p-6">
              <div className="ml-auto max-w-md space-y-4">

                {/* SUBTOTAL */}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    Subtotal
                  </span>

                  <span className="font-medium text-slate-900">
                    {formatCurrency(
                      subtotal,
                    )}
                  </span>
                </div>

                {/* DISCOUNT */}

                <div className="flex items-center justify-between gap-6 text-sm">
                  <label
                    htmlFor="discount"
                    className="text-slate-600"
                  >
                    Discount
                  </label>

                  <input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(event) =>
                      setDiscount(
                        event.target.value,
                      )
                    }
                    className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-right text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {/* TAX */}

                <div className="flex items-center justify-between gap-6 text-sm">
                  <label
                    htmlFor="tax"
                    className="text-slate-600"
                  >
                    Tax
                  </label>

                  <input
                    id="tax"
                    type="number"
                    min="0"
                    step="0.01"
                    value={tax}
                    onChange={(event) =>
                      setTax(
                        event.target.value,
                      )
                    }
                    className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-right text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-slate-900">
                      Total Amount
                    </span>

                    <span className="text-xl font-bold text-slate-900">
                      {formatCurrency(
                        totalAmount,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard/purchasing/orders"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                submitting ||
                !selectedRequisition ||
                !selectedSupplier ||
                items.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />

                  Create Purchase Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}