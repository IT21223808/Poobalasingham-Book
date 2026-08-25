"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ShoppingCart,
  Save,
  Package,
  FileText,
  AlertCircle,
  ChevronRight,
  Trash2,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

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

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const PRODUCTS_API = `${API_URL}/products`;

const SUPPLIERS_API = `${API_URL}/suppliers`;

const REQUISITIONS_API =
  `${API_URL}/purchasing/requisitions`;

const ORDERS_API =
  `${API_URL}/purchasing/orders`;

/* =========================================================
   HELPERS
========================================================= */

function extractArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === "object") {
    const objectData =
      data as Record<string, unknown>;

    if (Array.isArray(objectData.data)) {
      return objectData.data as T[];
    }

    if (Array.isArray(objectData.items)) {
      return objectData.items as T[];
    }

    if (Array.isArray(objectData.results)) {
      return objectData.results as T[];
    }
  }

  return [];
}

/* =========================================================
   PRICE
========================================================= */

function getProductPurchasePrice(
  product?: Product
): number {
  if (!product) {
    return 0;
  }

  const price = Number(
    product.costPrice ??
      product.purchasePrice ??
      product.sellingPrice ??
      0
  );

  return Number.isFinite(price)
    ? price
    : 0;
}

/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(
  value: number
): string {
  return value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* =========================================================
   DATE
========================================================= */

function toISODate(date: string): string {
  return new Date(
    `${date}T00:00:00.000Z`
  ).toISOString();
}

/* =========================================================
   PAGE
========================================================= */

export default function CreatePurchaseOrderPage() {
  /* =======================================================
     DATA
  ======================================================= */

  const [products, setProducts] =
    useState<Product[]>([]);

  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);

  const [requisitions, setRequisitions] =
    useState<Requisition[]>([]);

    const [notes, setNotes] = useState("");
  /* =======================================================
     FORM
  ======================================================= */

  const [requisitionId, setRequisitionId] =
    useState("");

  const [selectedSupplierId, setSelectedSupplierId] =
    useState<number | null>(null);

  const [poDate, setPoDate] = useState(
    new Date()
      .toISOString()
      .split("T")[0]
  );

  const [
    expectedDeliveryDate,
    setExpectedDeliveryDate,
  ] = useState("");

  const [discount, setDiscount] =
    useState(0);

  const [tax, setTax] =
    useState(0);

  const [items, setItems] =
    useState<OrderItem[]>([]);

  /* =======================================================
     ITEM FORM
  ======================================================= */

  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState("");

  const [itemQuantity, setItemQuantity] =
    useState(1);

  const [itemUnitPrice, setItemUnitPrice] =
    useState(0);

  /* =======================================================
     STATES
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /* =======================================================
     LOAD INITIAL DATA
  ======================================================= */

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
        fetch(PRODUCTS_API, {
          cache: "no-store",
        }),

        fetch(SUPPLIERS_API, {
          cache: "no-store",
        }),

        fetch(
          `${REQUISITIONS_API}?status=APPROVED`,
          {
            cache: "no-store",
          }
        ),
      ]);

      if (!productsResponse.ok) {
        throw new Error(
          "Failed to load products."
        );
      }

      if (!suppliersResponse.ok) {
        throw new Error(
          "Failed to load suppliers."
        );
      }

      if (!requisitionsResponse.ok) {
        throw new Error(
          "Failed to load approved requisitions."
        );
      }

      const productsData =
        await productsResponse.json();

      const suppliersData =
        await suppliersResponse.json();

      const requisitionsData =
        await requisitionsResponse.json();

      const loadedProducts =
        extractArray<Product>(
          productsData
        );

      const loadedSuppliers =
        extractArray<Supplier>(
          suppliersData
        );

      const loadedRequisitions =
        extractArray<Requisition>(
          requisitionsData
        ).filter(
          (requisition) =>
            String(
              requisition.status
            ).toUpperCase() === "APPROVED"
        );

      console.log(
        "Approved requisitions:",
        loadedRequisitions
      );

      console.log(
        "Suppliers:",
        loadedSuppliers
      );

      setProducts(
        loadedProducts
      );

      setSuppliers(
        loadedSuppliers
      );

      setRequisitions(
        loadedRequisitions
      );
    } catch (err) {
      console.error(
        "Create PO load error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load required data."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     GET SELECTED REQUISITION
  ======================================================= */

  const selectedRequisition =
    useMemo(() => {
      if (!requisitionId) {
        return null;
      }

      return (
        requisitions.find(
          (requisition) =>
            String(requisition.id) ===
            String(requisitionId)
        ) ?? null
      );
    }, [
      requisitions,
      requisitionId,
    ]);

  /* =======================================================
     GET SELECTED SUPPLIER
  ======================================================= */

  const selectedSupplier =
    useMemo(() => {
      if (!selectedSupplierId) {
        return null;
      }

      return (
        suppliers.find(
          (supplier) =>
            Number(supplier.id) ===
            Number(selectedSupplierId)
        ) ?? null
      );
    }, [
      suppliers,
      selectedSupplierId,
    ]);

  /* =======================================================
     PRODUCT PRICE
  ======================================================= */

  useEffect(() => {
    if (!selectedProductId) {
      setItemUnitPrice(0);
      return;
    }

    const product =
      products.find(
        (item) =>
          String(item.id) ===
          String(selectedProductId)
      );

    if (!product) {
      setItemUnitPrice(0);
      return;
    }

    setItemUnitPrice(
      getProductPurchasePrice(
        product
      )
    );
  }, [
    selectedProductId,
    products,
  ]);

  /* =======================================================
     REQUISITION CHANGE
  ======================================================= */

  function handleRequisitionChange(
    value: string
  ) {
    setError(null);

    setRequisitionId(value);

    /*
     * IMPORTANT:
     * Supplier is NOT connected to requisition.
     *
     * Therefore we DO NOT reset supplier here.
     * User selects supplier separately.
     */

    setItems([]);

    setSelectedProductId("");

    setItemQuantity(1);

    setItemUnitPrice(0);

    if (!value) {
      return;
    }

    const requisition =
      requisitions.find(
        (item) =>
          String(item.id) ===
          String(value)
      );

    if (!requisition) {
      setError(
        "Selected requisition was not found."
      );
      return;
    }

    if (
      String(
        requisition.status
      ).toUpperCase() !==
      "APPROVED"
    ) {
      setError(
        "Only approved requisitions can be used to create a purchase order."
      );

      setRequisitionId("");

      return;
    }

    /* =====================================================
       REQUISITION ITEMS
    ===================================================== */

    if (
      !requisition.items ||
      requisition.items.length === 0
    ) {
      setError(
        "The selected approved requisition has no items."
      );

      return;
    }

    /*
     * Convert requisition items
     * into purchase order items.
     */

    const mappedItems: OrderItem[] =
      requisition.items.map(
        (item) => {
          const product =
            item.product ||
            products.find(
              (productItem) =>
                String(
                  productItem.id
                ) ===
                String(
                  item.productId
                )
            );

          const price =
            getProductPurchasePrice(
              product
            );

          return {
            productId:
              String(
                item.productId
              ),

            productName:
              product?.productName ||
              "Unknown Product",

            productCode:
              product?.productCode,

            quantity:
              Number(
                item.quantity
              ) > 0
                ? Number(
                    item.quantity
                  )
                : 1,

            unitPrice: price,
          };
        }
      );

    setItems(
      mappedItems
    );
  }

  /* =======================================================
     ADD ITEM
  ======================================================= */

  function handleAddItem() {
    setError(null);

    if (!requisitionId) {
      setError(
        "Please select an approved requisition first."
      );
      return;
    }

    /*
     * Supplier is mandatory for PO.
     * But it comes from PO, NOT requisition.
     */

    if (!selectedSupplierId) {
      setError(
        "Please select a supplier."
      );
      return;
    }

    if (!selectedProductId) {
      setError(
        "Please select a product."
      );
      return;
    }

    if (
      !Number.isFinite(
        itemQuantity
      ) ||
      itemQuantity <= 0
    ) {
      setError(
        "Quantity must be greater than 0."
      );
      return;
    }

    if (
      !Number.isFinite(
        itemUnitPrice
      ) ||
      itemUnitPrice < 0
    ) {
      setError(
        "Unit price cannot be negative."
      );
      return;
    }

    /*
     * Product must belong to selected requisition.
     */

    const requisitionProduct =
      selectedRequisition?.items?.find(
        (item) =>
          String(
            item.productId
          ) ===
          String(
            selectedProductId
          )
      );

    if (!requisitionProduct) {
      setError(
        "This product is not part of the selected requisition."
      );
      return;
    }

    const product =
      products.find(
        (item) =>
          String(item.id) ===
          String(
            selectedProductId
          )
      );

    if (!product) {
      setError(
        "Product not found."
      );
      return;
    }

    const existingIndex =
      items.findIndex(
        (item) =>
          String(
            item.productId
          ) ===
          String(
            selectedProductId
          )
      );

    if (existingIndex !== -1) {
      const updatedItems =
        [...items];

      updatedItems[
        existingIndex
      ] = {
        ...updatedItems[
          existingIndex
        ],

        quantity:
          updatedItems[
            existingIndex
          ].quantity +
          itemQuantity,

        unitPrice:
          itemUnitPrice,
      };

      setItems(
        updatedItems
      );
    } else {
      setItems([
        ...items,
        {
          productId:
            String(
              product.id
            ),

          productName:
            product.productName,

          productCode:
            product.productCode,

          quantity:
            itemQuantity,

          unitPrice:
            itemUnitPrice,
        },
      ]);
    }

    setSelectedProductId("");
    setItemQuantity(1);
    setItemUnitPrice(0);
  }

  /* =======================================================
     REMOVE ITEM
  ======================================================= */

  function handleRemoveItem(
    index: number
  ) {
    setItems(
      items.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  }

  /* =======================================================
     UPDATE QUANTITY
  ======================================================= */

  function updateQuantity(
    index: number,
    value: number
  ) {
    const quantity =
      Number(value);

    const updatedItems =
      [...items];

    updatedItems[index] = {
      ...updatedItems[index],

      quantity:
        Number.isFinite(
          quantity
        ) &&
        quantity > 0
          ? quantity
          : 1,
    };

    setItems(
      updatedItems
    );
  }

  /* =======================================================
     UPDATE PRICE
  ======================================================= */

  function updateUnitPrice(
    index: number,
    value: number
  ) {
    const price =
      Number(value);

    const updatedItems =
      [...items];

    updatedItems[index] = {
      ...updatedItems[index],

      unitPrice:
        Number.isFinite(price) &&
        price >= 0
          ? price
          : 0,
    };

    setItems(
      updatedItems
    );
  }

  /* =======================================================
     TOTALS
  ======================================================= */

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

  const discountAmount =
    Math.min(
      Math.max(
        Number(discount) || 0,
        0
      ),
      subtotal
    );

  const taxAmount =
    Math.max(
      Number(tax) || 0,
      0
    );

  const totalAmount =
    subtotal -
    discountAmount +
    taxAmount;

  /* =======================================================
     SUBMIT
  ======================================================= */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);

    /* =====================================================
       REQUISITION
    ===================================================== */

    if (!requisitionId) {
      setError(
        "Please select an approved purchase requisition."
      );
      return;
    }

    const requisition =
      requisitions.find(
        (item) =>
          String(item.id) ===
          String(requisitionId)
      );

    if (!requisition) {
      setError(
        "Selected requisition is not available."
      );
      return;
    }

    if (
      String(
        requisition.status
      ).toUpperCase() !==
      "APPROVED"
    ) {
      setError(
        "Only approved requisitions can create purchase orders."
      );
      return;
    }

    /* =====================================================
       SUPPLIER
    ===================================================== */

    if (!selectedSupplierId) {
      setError(
        "Please select a supplier."
      );
      return;
    }

    const supplier =
      suppliers.find(
        (item) =>
          Number(item.id) ===
          Number(selectedSupplierId)
      );

    if (!supplier) {
      setError(
        "Selected supplier was not found."
      );
      return;
    }

    /* =====================================================
       PO DATE
    ===================================================== */

    if (!poDate) {
      setError(
        "Please select a PO date."
      );
      return;
    }

    /* =====================================================
       DELIVERY DATE
    ===================================================== */

    if (
      !expectedDeliveryDate
    ) {
      setError(
        "Please select an expected delivery date."
      );
      return;
    }

    if (
      new Date(
        expectedDeliveryDate
      ) <
      new Date(poDate)
    ) {
      setError(
        "Expected delivery date cannot be earlier than the PO date."
      );
      return;
    }

    /* =====================================================
       ITEMS
    ===================================================== */

    if (items.length === 0) {
      setError(
        "The selected requisition has no products."
      );
      return;
    }

    /* =====================================================
       VALIDATE ITEMS
    ===================================================== */

    const invalidItem =
      items.find(
        (item) =>
          !item.productId ||
          !Number.isInteger(
            Number(
              item.quantity
            )
          ) ||
          Number(
            item.quantity
          ) <= 0 ||
          !Number.isFinite(
            Number(
              item.unitPrice
            )
          ) ||
          Number(
            item.unitPrice
          ) < 0
      );

    if (invalidItem) {
      setError(
        "Please check product quantities and prices."
      );
      return;
    }

    /* =====================================================
       PAYLOAD
    ===================================================== */

    const payload = {

      requisitionId:
        Number(
          requisitionId
        ),

      supplierId:
        Number(
          selectedSupplierId
        ),

      poDate:
        toISODate(
          poDate
        ),

      expectedDeliveryDate:
        toISODate(
          expectedDeliveryDate
        ),

      discountAmount:
        Number(
          discountAmount
        ),

      taxAmount:
        Number(
          taxAmount
        ),

      notes:
        notes.trim() || null,

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

    console.log(
      "Create Purchase Order Payload:",
      payload
    );

    /* =====================================================
       CREATE
    ===================================================== */

    try {
      setSubmitting(true);

      const response =
        await fetch(
          ORDERS_API,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      if (!response.ok) {
        let message =
          "Failed to create purchase order.";

        try {
          const data =
            await response.json();

          console.error(
            "Purchase Order API Error:",
            data
          );

          if (
            typeof data?.message ===
            "string"
          ) {
            message =
              data.message;
          } else if (
            Array.isArray(
              data?.message
            )
          ) {
            message =
              data.message
                .map(
                  (
                    item: unknown
                  ) => {
                    if (
                      typeof item ===
                      "string"
                    ) {
                      return item;
                    }

                    if (
                      item &&
                      typeof item ===
                        "object"
                    ) {
                      const obj =
                        item as Record<
                          string,
                          unknown
                        >;

                      return String(
                        obj.message ??
                          obj.error ??
                          JSON.stringify(
                            obj
                          )
                      );
                    }

                    return String(
                      item
                    );
                  }
                )
                .join(", ");
          } else if (
            typeof data?.error ===
            "string"
          ) {
            message =
              data.error;
          }
        } catch {
          // Ignore invalid JSON
        }

        throw new Error(
          message
        );
      }

      const createdOrder =
        await response.json();

      console.log(
        "Purchase order created:",
        createdOrder
      );

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
    } catch (err) {
      console.error(
        "Create purchase order error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create purchase order."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[500px] w-full max-w-7xl items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-gray-500">
              Loading requisitions and suppliers...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full">

        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <div className="mb-5 flex items-center gap-2 text-sm">

          <Link
            href="/dashboard/purchasing"
            className="font-medium text-gray-500 transition hover:text-gray-900"
          >
            Purchasing
          </Link>

          <ChevronRight
            size={15}
            className="text-gray-400"
          />

          <Link
            href="/dashboard/purchasing/orders"
            className="text-gray-500 transition-colors hover:text-gray-900"
          >
            Orders
          </Link>

          <ChevronRight
            size={15}
            className="text-gray-400"
          />

          <span className="font-medium text-gray-900">
            Create Purchase Order
          </span>

        </div>

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ShoppingCart size={22} />
            </div>

            <div>

              <h1 className="text-2xl font-semibold text-gray-900">
                Create Purchase Order
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Create a purchase order from an approved requisition and select a supplier.
              </p>

            </div>

          </div>

          <Link
            href="/dashboard/purchasing/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to Orders
          </Link>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>

              <p className="font-medium text-red-800">
                Unable to create purchase order
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* =================================================
            NO APPROVED REQUISITIONS
        ================================================= */}

        {requisitions.length === 0 && (
          <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4">

            <div className="flex items-start gap-3">

              <AlertCircle
                size={20}
                className="mt-0.5 text-yellow-600"
              />

              <div>

                <p className="font-medium text-yellow-800">
                  No approved requisitions available
                </p>

                <p className="mt-1 text-sm text-yellow-700">
                  Approve a purchase requisition first before creating a purchase order.
                </p>

              </div>

            </div>

          </div>
        )}

        {/* =================================================
            NO SUPPLIERS
        ================================================= */}

        {suppliers.length === 0 && (
          <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4">

            <div className="flex items-start gap-3">

              <AlertCircle
                size={20}
                className="mt-0.5 text-yellow-600"
              />

              <div>

                <p className="font-medium text-yellow-800">
                  No suppliers available
                </p>

                <p className="mt-1 text-sm text-yellow-700">
                  Create a supplier before creating a purchase order.
                </p>

              </div>

            </div>

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
              BASIC INFORMATION
          ================================================= */}

          <div className="rounded-xl border border-gray-200 bg-white">

            <div className="border-b border-gray-100 px-6 py-4">

              <div className="flex items-center gap-2">

                <FileText
                  size={19}
                  className="text-blue-600"
                />

                <h2 className="font-semibold text-gray-900">
                  Purchase Order Information
                </h2>

              </div>

              <p className="mt-1 text-sm text-gray-500">
                Select an approved requisition and choose the supplier for this purchase order.
              </p>

            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-3">

              {/* =================================================
                  APPROVED REQUISITION
              ================================================= */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Approved Requisition
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <select
                  value={requisitionId}
                  onChange={(event) =>
                    handleRequisitionChange(
                      event.target.value
                    )
                  }
                  required
                  disabled={
                    requisitions.length === 0
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                >

                  <option value="">
                    Select approved requisition
                  </option>

                  {requisitions.map(
                    (requisition) => (
                      <option
                        key={
                          requisition.id
                        }
                        value={
                          requisition.id
                        }
                      >
                        {requisition.requisitionNumber ||
                          `REQ-${String(
                            requisition.id
                          ).padStart(
                            5,
                            "0"
                          )}`}
                      </option>
                    )
                  )}

                </select>

                <p className="mt-1 text-xs text-gray-400">
                  Only APPROVED requisitions are shown.
                </p>

              </div>

              {/* =================================================
                  SUPPLIER - MANUAL
              ================================================= */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Supplier
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <select
                  value={
                    selectedSupplierId
                      ? String(
                          selectedSupplierId
                        )
                      : ""
                  }
                  onChange={(event) => {
                    setError(null);

                    const value =
                      event.target.value;

                    setSelectedSupplierId(
                      value
                        ? Number(value)
                        : null
                    );
                  }}
                  required
                  disabled={
                    suppliers.length === 0
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
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

                <p className="mt-1 text-xs text-gray-400">
                  Supplier is selected when creating the purchase order.
                </p>

              </div>

              {/* =================================================
                  PO DATE
              ================================================= */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  PO Date
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="date"
                  value={poDate}
                  onChange={(event) =>
                    setPoDate(
                      event.target.value
                    )
                  }
                  required
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* =================================================
                  EXPECTED DELIVERY
              ================================================= */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Expected Delivery Date
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="date"
                  value={
                    expectedDeliveryDate
                  }
                  min={poDate}
                  onChange={(event) =>
                    setExpectedDeliveryDate(
                      event.target.value
                    )
                  }
                  required
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

            </div>

            {/* =================================================
                SELECTED SUPPLIER INFO
            ================================================= */}

            {selectedSupplier && (
              <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600">
                    <ShoppingCart size={18} />
                  </div>

                  <div>

                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Selected Supplier
                    </p>

                    <p className="font-medium text-gray-900">
                      {
                        selectedSupplier.supplierName
                      }
                    </p>

                    {selectedSupplier.supplierCode && (
                      <p className="text-xs text-gray-500">
                        Code:{" "}
                        {
                          selectedSupplier.supplierCode
                        }
                      </p>
                    )}

                  </div>

                </div>

              </div>
            )}

          </div>

          {/* =================================================
              PRODUCTS
          ================================================= */}

          <div className="rounded-xl border border-gray-200 bg-white">

            <div className="border-b border-gray-100 px-6 py-4">

              <div className="flex items-center gap-2">

                <Package
                  size={19}
                  className="text-blue-600"
                />

                <h2 className="font-semibold text-gray-900">
                  Requisition Products
                </h2>

              </div>

              <p className="mt-1 text-sm text-gray-500">
                Products are loaded from the selected approved requisition.
              </p>

            </div>

            <div className="p-6">

              {!requisitionId ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">

                  <Package
                    size={34}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-3 font-medium text-gray-600">
                    Select an approved requisition
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    Requisition products will appear here.
                  </p>

                </div>
              ) : items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-red-200 bg-red-50 px-5 py-8 text-center">

                  <AlertCircle
                    size={34}
                    className="mx-auto text-red-300"
                  />

                  <p className="mt-3 font-medium text-red-700">
                    No products found
                  </p>

                  <p className="mt-1 text-sm text-red-500">
                    The selected requisition does not contain any items.
                  </p>

                </div>
              ) : (
                <div className="rounded-lg border border-gray-200">

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[750px] text-left text-sm">

                      <thead className="bg-gray-50">

                        <tr>

                          <th className="px-5 py-3 font-medium text-gray-600">
                            Product
                          </th>

                          <th className="px-5 py-3 font-medium text-gray-600">
                            Quantity
                          </th>

                          <th className="px-5 py-3 font-medium text-gray-600">
                            Unit Price
                          </th>

                          <th className="px-5 py-3 font-medium text-gray-600">
                            Subtotal
                          </th>

                          <th className="px-5 py-3 text-right font-medium text-gray-600">
                            Action
                          </th>

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-gray-100">

                        {items.map(
                          (
                            item,
                            index
                          ) => (
                            <tr
                              key={`${item.productId}-${index}`}
                              className="hover:bg-gray-50"
                            >

                              <td className="px-5 py-4">

                                <p className="font-medium text-gray-900">
                                  {
                                    item.productName
                                  }
                                </p>

                                {item.productCode && (
                                  <p className="mt-1 text-xs text-gray-400">
                                    {
                                      item.productCode
                                    }
                                  </p>
                                )}

                              </td>

                              <td className="px-5 py-4">

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
                                    updateQuantity(
                                      index,
                                      Number(
                                        event
                                          .target
                                          .value
                                      )
                                    )
                                  }
                                  className="h-9 w-24 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                              </td>

                              <td className="px-5 py-4">

                                <div className="flex items-center gap-1">

                                  <span className="text-gray-500">
                                    Rs.
                                  </span>

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
                                      updateUnitPrice(
                                        index,
                                        Number(
                                          event
                                            .target
                                            .value
                                        )
                                      )
                                    }
                                    className="h-9 w-32 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                  />

                                </div>

                              </td>

                              <td className="px-5 py-4 font-medium text-gray-900">
                                Rs.{" "}
                                {formatCurrency(
                                  Number(
                                    item.quantity
                                  ) *
                                    Number(
                                      item.unitPrice
                                    )
                                )}
                              </td>

                              <td className="px-5 py-4 text-right">

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveItem(
                                      index
                                    )
                                  }
                                  className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                  title="Remove item"
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
              )}

            </div>

          </div>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* ADDITIONAL */}

           <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
  <h2 className="font-semibold text-gray-900">
    Additional Information
  </h2>

  <p className="mt-1 text-sm text-gray-500">
    Add any additional notes or instructions for this purchase order.
  </p>

  <textarea
    rows={7}
    value={notes}
    onChange={(event) =>
      setNotes(event.target.value)
    }
    placeholder="Enter notes..."
    className="mt-5 w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
  />
</div>

            {/* SUMMARY */}

            <div className="rounded-xl border border-gray-200 bg-white p-6">

              <h2 className="font-semibold text-gray-900">
                Order Summary
              </h2>

              <div className="mt-5 space-y-4">

                <div className="flex items-center justify-between text-sm">

                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span className="font-medium text-gray-900">
                    Rs.{" "}
                    {formatCurrency(
                      subtotal
                    )}
                  </span>

                </div>

                <div className="flex items-center justify-between text-sm">

                  <label
                    htmlFor="discount"
                    className="text-gray-500"
                  >
                    Discount
                  </label>

                  <div className="flex items-center">

                    <span className="mr-1 text-gray-500">
                      Rs.
                    </span>

                    <input
                      id="discount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        discount
                      }
                      onChange={(
                        event
                      ) =>
                        setDiscount(
                          Number(
                            event.target.value
                          )
                        )
                      }
                      className="h-9 w-28 rounded-lg border border-gray-300 px-2 text-right text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                  </div>

                </div>

                <div className="flex items-center justify-between text-sm">

                  <label
                    htmlFor="tax"
                    className="text-gray-500"
                  >
                    Tax
                  </label>

                  <div className="flex items-center">

                    <span className="mr-1 text-gray-500">
                      Rs.
                    </span>

                    <input
                      id="tax"
                      type="number"
                      min="0"
                      step="0.01"
                      value={tax}
                      onChange={(
                        event
                      ) =>
                        setTax(
                          Number(
                            event.target.value
                          )
                        )
                      }
                      className="h-9 w-28 rounded-lg border border-gray-300 px-2 text-right text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                  </div>

                </div>

                <div className="border-t border-gray-100 pt-4">

                  <div className="flex items-center justify-between">

                    <span className="font-semibold text-gray-900">
                      Total Amount
                    </span>

                    <span className="text-xl font-semibold text-blue-600">
                      Rs.{" "}
                      {formatCurrency(
                        totalAmount
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

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">

            <Link
              href="/dashboard/purchasing/orders"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                submitting ||
                items.length === 0 ||
                !requisitionId ||
                !selectedSupplierId ||
                !expectedDeliveryDate
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={17} />
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