"use client";

import {
  ShoppingBag,
  PauseCircle,
  CheckCircle2,
  Tag,
  Trash2,
  Mail,
  Eye,
  RotateCcw,
  Plus,
  Minus,
  User,
  UserPlus,
  Search,
  X,
  ArrowLeft,
  Loader2,
} from "lucide-react";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { PosCartItem } from "@/types/pos";
import customerService, {
  Customer,
} from "@/services/customer.service";

interface PosCartProps {
  cartItems: PosCartItem[];

  customers: Customer[];

  selectedCustomer: Customer | null;

  onSelectCustomer: (
    customer: Customer | null,
  ) => void;

  /*
   * Kept for compatibility with page.tsx.
   * New Customer is now handled inside the
   * customer popup itself.
   */
  onOpenNewCustomerModal?: () => void;

  onUpdateQty: (
    productId: string,
    newQty: number,
  ) => void;

  onRemoveItem: (
    productId: string,
  ) => void;

  onClearCart: () => void;

  subtotal: number;

  discountAmount: number;

  grandTotal: number;

  onOpenDiscountModal: () => void;

  /*
   * HOLD CURRENT BILL
   * F8
   */
  onHoldBill: () => void;

  /*
   * OPEN EXISTING HELD BILLS
   */
  onOpenHoldModal: () => void;

  /*
   * OPEN RETURNS
   */
  onOpenReturnModal: () => void;

  /*
   * OPEN PAYMENT
   * F9
   */
  onOpenPaymentModal: () => void;

  /*
   * EMAIL LAST RECEIPT
   */
  onEmailReceipt: () => void;

  /*
   * VIEW LAST RECEIPT
   */
  onViewReceipt: () => void;

  isHolding?: boolean;
}

export default function PosCart({
  cartItems,
  customers,
  selectedCustomer,
  onSelectCustomer,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  subtotal,
  discountAmount,
  grandTotal,
  onOpenDiscountModal,
  onHoldBill,
  onOpenHoldModal,
  onOpenReturnModal,
  onOpenPaymentModal,
  onEmailReceipt,
  onViewReceipt,
  isHolding = false,
}: PosCartProps) {
  /* =========================================================
     CUSTOMER POPUP
  ========================================================= */

  const [isCustomerModalOpen, setIsCustomerModalOpen] =
    useState(false);

  const [customerSearch, setCustomerSearch] =
    useState("");

  const [showNewCustomerForm, setShowNewCustomerForm] =
    useState(false);

  /* =========================================================
     NEW CUSTOMER FORM
  ========================================================= */

  const [customerName, setCustomerName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [city, setCity] =
    useState("");

  const [isCustomerSaving, setIsCustomerSaving] =
    useState(false);

  /* =========================================================
     FILTER CUSTOMERS
  ========================================================= */

  const filteredCustomers = useMemo(() => {
    const query =
      customerSearch.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      const name =
        customer.customerName
          ?.toLowerCase()
          .includes(query);

      const phone =
        customer.phone
          ?.toLowerCase()
          .includes(query);

      const email =
        customer.email
          ?.toLowerCase()
          .includes(query);

      const code =
        customer.customerCode
          ?.toLowerCase()
          .includes(query);

      return (
        name ||
        phone ||
        email ||
        code
      );
    });
  }, [
    customers,
    customerSearch,
  ]);

  /* =========================================================
     OPEN CUSTOMER POPUP
  ========================================================= */

  const openCustomerModal = () => {
    setCustomerSearch("");
    setShowNewCustomerForm(false);
    setIsCustomerModalOpen(true);
  };

  /* =========================================================
     CLOSE CUSTOMER POPUP
  ========================================================= */

  const closeCustomerModal = () => {
    if (isCustomerSaving) {
      return;
    }

    setIsCustomerModalOpen(false);
    setCustomerSearch("");
    setShowNewCustomerForm(false);
  };

  /* =========================================================
     RESET NEW CUSTOMER FORM
  ========================================================= */

  const resetCustomerForm = () => {
    setCustomerName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setCity("");
  };

  /* =========================================================
     SELECT EXISTING CUSTOMER
  ========================================================= */

  const handleSelectCustomer = (
    customer: Customer,
  ) => {
    onSelectCustomer(customer);

    setIsCustomerModalOpen(false);
    setCustomerSearch("");
    setShowNewCustomerForm(false);

    toast.success(
      `${customer.customerName} selected`,
    );
  };

  /* =========================================================
     CONTINUE AS WALK-IN
  ========================================================= */

  const handleWalkIn = () => {
    onSelectCustomer(null);

    setIsCustomerModalOpen(false);
    setCustomerSearch("");
    setShowNewCustomerForm(false);

    toast.success(
      "Continuing as walk-in customer",
    );
  };

  /* =========================================================
     SAVE NEW CUSTOMER
  ========================================================= */

  const handleCreateCustomer = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!customerName.trim()) {
      toast.error(
        "Customer name is required.",
      );
      return;
    }

    setIsCustomerSaving(true);

    try {
      const customer =
        await customerService.createCustomer({
          customerName:
            customerName.trim(),

          phone:
            phone.trim() || undefined,

          email:
            email.trim() || undefined,

          address:
            address.trim() || undefined,

          city:
            city.trim() || undefined,

          isActive: true,
        });

      /*
       * Backend returns:
       *
       * - New customer if phone is new
       * - Existing customer if phone already exists
       *
       * So both cases can directly be selected.
       */

      onSelectCustomer(customer);

      toast.success(
        `${customer.customerName} selected`,
      );

      resetCustomerForm();

      setShowNewCustomerForm(false);
      setIsCustomerModalOpen(false);
    } catch (error: any) {
      console.error(
        "Failed to create/select customer:",
        error,
      );

      const message =
        error?.response?.data?.message;

      if (Array.isArray(message)) {
        toast.error(
          message.join(", "),
        );
      } else {
        toast.error(
          message ||
            "Failed to create customer. Please try again.",
        );
      }
    } finally {
      setIsCustomerSaving(false);
    }
  };

  /* =========================================================
     CLEAR CART
  ========================================================= */

  const handleClearRequest = () => {
    if (cartItems.length === 0) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to clear the cart?",
      );

    if (!confirmed) {
      return;
    }

    onClearCart();
  };

  return (
    <>
      {/* =====================================================
          MAIN CART
      ====================================================== */}

      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* =====================================================
            CART HEADER
        ====================================================== */}

        <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3">

          <div className="flex items-center justify-between">

            {/* LEFT */}
            <div className="flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <ShoppingBag className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Current Bill
                </h2>

                <p className="text-[11px] font-medium text-slate-500">
                  {cartItems.length}{" "}
                  {cartItems.length === 1
                    ? "item"
                    : "items"}
                </p>
              </div>

            </div>

            {/* =================================================
                ALL ACTIONS IN ONE LINE
            ================================================= */}

            <div className="flex items-center gap-1.5">

              {/* CLEAR */}
              <button
                type="button"
                onClick={
                  handleClearRequest
                }
                disabled={
                  cartItems.length === 0
                }
                title="Clear Cart"
                aria-label="Clear Cart"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* VIEW RECEIPT */}
              <button
                type="button"
                onClick={
                  onViewReceipt
                }
                title="View Receipt"
                aria-label="View Receipt"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Eye className="h-4 w-4" />
              </button>

              {/* EMAIL RECEIPT */}
              <button
                type="button"
                onClick={
                  onEmailReceipt
                }
                title="Email Receipt"
                aria-label="Email Receipt"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Mail className="h-4 w-4" />
              </button>

              {/* HELD BILLS */}
              <button
                type="button"
                onClick={
                  onOpenHoldModal
                }
                title="Held Bills"
                aria-label="Held Bills"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 transition hover:bg-amber-100"
              >
                <PauseCircle className="h-4 w-4" />
              </button>

              {/* RETURNS */}
              <button
                type="button"
                onClick={
                  onOpenReturnModal
                }
                title="Returns"
                aria-label="Returns"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 text-orange-700 transition hover:bg-orange-100"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

            </div>
          </div>
        </div>

        {/* =====================================================
            CUSTOMER
        ====================================================== */}

        <div className="shrink-0 border-b border-slate-200 px-4 py-3">

          <button
            type="button"
            onClick={
              openCustomerModal
            }
            className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
          >

            <div className="flex min-w-0 items-center gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <User className="h-4 w-4" />
              </div>

              <div className="min-w-0">

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Customer
                </p>

                {selectedCustomer ? (
                  <>
                    <p className="truncate text-sm font-bold text-slate-800">
                      {
                        selectedCustomer.customerName
                      }
                    </p>

                    {selectedCustomer.phone && (
                      <p className="text-[11px] text-slate-500">
                        {
                          selectedCustomer.phone
                        }
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-bold text-slate-800">
                    Walk-in Customer
                  </p>
                )}

              </div>
            </div>

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition group-hover:bg-blue-100 group-hover:text-blue-600">
              <Search className="h-4 w-4" />
            </div>

          </button>
        </div>

        {/* =====================================================
            CART ITEMS
        ====================================================== */}

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-3">

          {cartItems.length === 0 ? (

            <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">

              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <ShoppingBag className="h-7 w-7 text-slate-400" />
              </div>

              <p className="text-sm font-bold text-slate-700">
                Cart is empty
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Scan or select products to start billing.
              </p>

            </div>

          ) : (

            <div className="space-y-2">

              {cartItems.map((item) => {

                const quantity =
                  Number(
                    item.quantity || 0,
                  );

                const unitPrice =
                  Number(
                    item.unitPrice || 0,
                  );

                const lineTotal =
                  Number(
                    item.lineTotal || 0,
                  );

                const maxStock =
                  Number(
                    item.availableStock || 1,
                  );

                return (
                  <div
                    key={
                      item.productId
                    }
                    className="rounded-xl border border-slate-200 bg-white p-3"
                  >

                    <div className="flex items-start justify-between gap-2">

                      <div className="min-w-0">

                        <p className="line-clamp-2 text-sm font-bold text-slate-800">
                          {
                            item.productName
                          }
                        </p>

                        {item.productCode && (
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {
                              item.productCode
                            }
                          </p>
                        )}

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onRemoveItem(
                            item.productId,
                          )
                        }
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">

                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50">

                        <button
                          type="button"
                          disabled={
                            quantity <= 1
                          }
                          onClick={() =>
                            onUpdateQty(
                              item.productId,
                              quantity - 1,
                            )
                          }
                          className="p-1.5 text-slate-500 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>

                        <span className="min-w-[32px] text-center text-xs font-black text-slate-800">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          disabled={
                            quantity >=
                            maxStock
                          }
                          onClick={() =>
                            onUpdateQty(
                              item.productId,
                              quantity + 1,
                            )
                          }
                          className="p-1.5 text-slate-500 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>

                      </div>

                      <div className="text-right">

                        <p className="text-xs text-slate-400">
                          Rs.{" "}
                          {unitPrice.toFixed(
                            2,
                          )}{" "}
                          each
                        </p>

                        <p className="text-sm font-black text-slate-900">
                          Rs.{" "}
                          {lineTotal.toFixed(
                            2,
                          )}
                        </p>

                      </div>

                    </div>
                  </div>
                );
              })}

            </div>
          )}
        </div>

        {/* =====================================================
            SUMMARY
        ====================================================== */}

        <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-3">

          <div className="space-y-2 text-sm">

            <div className="flex items-center justify-between">
              <span className="text-slate-500">
                Subtotal
              </span>

              <span className="font-semibold text-slate-800">
                Rs.{" "}
                {subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">
                Discount
              </span>

              <span className="font-semibold text-red-600">
                - Rs.{" "}
                {discountAmount.toFixed(
                  2,
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={
                onOpenDiscountModal
              }
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <Tag className="h-3.5 w-3.5" />
              Apply Discount
            </button>

            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">

              <span className="text-base font-black text-slate-900">
                TOTAL
              </span>

              <span className="text-xl font-black text-blue-600">
                Rs.{" "}
                {grandTotal.toFixed(2)}
              </span>

            </div>
          </div>

          {/* PAYMENT */}

          <div className="mt-3 grid grid-cols-2 gap-2">

            <button
              type="button"
              onClick={
                onHoldBill
              }
              disabled={
                isHolding ||
                cartItems.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PauseCircle className="h-5 w-5" />

              {isHolding
                ? "HOLDING..."
                : "HOLD (F8)"}
            </button>

            <button
              type="button"
              onClick={
                onOpenPaymentModal
              }
              disabled={
                cartItems.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-5 w-5" />
              CHARGE (F9)
            </button>

          </div>
        </div>
      </div>

      {/* =======================================================
          CUSTOMER SELECT MODAL
      ======================================================== */}

      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">

          <div className="flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">

              <div className="flex items-center gap-3">

                {showNewCustomerForm && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowNewCustomerForm(
                        false,
                      )
                    }
                    disabled={
                      isCustomerSaving
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  {showNewCustomerForm ? (
                    <UserPlus className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>

                <div>

                  <h2 className="text-lg font-black text-slate-900">
                    {showNewCustomerForm
                      ? "New Customer"
                      : "Attach Customer"}
                  </h2>

                  <p className="text-xs text-slate-500">
                    {showNewCustomerForm
                      ? "Add customer details"
                      : "Search and select a customer"}
                  </p>

                </div>
              </div>

              <button
                type="button"
                onClick={
                  closeCustomerModal
                }
                disabled={
                  isCustomerSaving
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* =================================================
                CUSTOMER LIST
            ================================================= */}

            {!showNewCustomerForm ? (

              <>

                {/* SEARCH */}

                <div className="shrink-0 px-6 pt-5">

                  <div className="relative">

                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      value={
                        customerSearch
                      }
                      onChange={(event) =>
                        setCustomerSearch(
                          event.target.value,
                        )
                      }
                      placeholder="Search name or phone..."
                      autoFocus
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />

                  </div>

                </div>

                {/* CUSTOMER LIST */}

                <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-3">

                  {filteredCustomers.length ===
                  0 ? (

                    <div className="flex min-h-[240px] flex-col items-center justify-center text-center">

                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                        <User className="h-7 w-7 text-slate-400" />
                      </div>

                      <p className="mt-3 text-sm font-bold text-slate-700">
                        No customers found
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Try another name or phone number.
                      </p>

                    </div>

                  ) : (

                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">

                      {filteredCustomers.map(
                        (customer) => (

                          <button
                            type="button"
                            key={
                              customer.id
                            }
                            onClick={() =>
                              handleSelectCustomer(
                                customer,
                              )
                            }
                            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-blue-50"
                          >

                            <div className="flex min-w-0 items-center gap-3">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                                <User className="h-4 w-4" />
                              </div>

                              <div className="min-w-0">

                                <p className="truncate text-sm font-bold text-slate-800">
                                  {
                                    customer.customerName
                                  }
                                </p>

                                <p className="text-[11px] text-slate-400">
                                  {
                                    customer.customerCode
                                  }
                                </p>

                              </div>
                            </div>

                            <div className="shrink-0 text-right">

                              {customer.phone && (
                                <p className="text-xs font-medium text-slate-500">
                                  {
                                    customer.phone
                                  }
                                </p>
                              )}

                              {customer.email && (
                                <p className="max-w-[180px] truncate text-[10px] text-slate-400">
                                  {
                                    customer.email
                                  }
                                </p>
                              )}

                            </div>

                          </button>
                        ),
                      )}

                    </div>
                  )}

                </div>

                {/* =================================================
                    BOTTOM ACTIONS
                ================================================= */}

                <div className="shrink-0 space-y-2 border-t border-slate-200 bg-slate-50 px-6 py-4">

                  {/* NEW CUSTOMER */}

                  <button
                    type="button"
                    onClick={() => {
                      resetCustomerForm();
                      setShowNewCustomerForm(
                        true,
                      );
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
                  >
                    <UserPlus className="h-5 w-5" />
                    New Customer
                  </button>

                  {/* WALK-IN */}

                  <button
                    type="button"
                    onClick={
                      handleWalkIn
                    }
                    className="w-full rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-300"
                  >
                    Continue as walk-in (no customer)
                  </button>

                </div>

              </>

            ) : (

              /* =================================================
                 NEW CUSTOMER FORM
              ================================================= */

              <form
                onSubmit={
                  handleCreateCustomer
                }
                className="min-h-0 overflow-y-auto"
              >

                <div className="space-y-4 px-6 py-5">

                  {/* CUSTOMER NAME */}

                  <div>

                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Customer Name{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      value={
                        customerName
                      }
                      onChange={(event) =>
                        setCustomerName(
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Perera"
                      autoFocus
                      disabled={
                        isCustomerSaving
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-50"
                    />

                  </div>

                  {/* PHONE + CITY */}

                  <div className="grid grid-cols-2 gap-3">

                    <div>

                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Phone Number
                      </label>

                      <input
                        type="text"
                        value={
                          phone
                        }
                        onChange={(event) =>
                          setPhone(
                            event.target.value,
                          )
                        }
                        placeholder="0771234567"
                        disabled={
                          isCustomerSaving
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-50"
                      />

                    </div>

                    <div>

                      <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        City
                      </label>

                      <input
                        type="text"
                        value={
                          city
                        }
                        onChange={(event) =>
                          setCity(
                            event.target.value,
                          )
                        }
                        placeholder="Jaffna / Colombo"
                        disabled={
                          isCustomerSaving
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-50"
                      />

                    </div>

                  </div>

                  {/* EMAIL */}

                  <div>

                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Email Address
                    </label>

                    <input
                      type="email"
                      value={
                        email
                      }
                      onChange={(event) =>
                        setEmail(
                          event.target.value,
                        )
                      }
                      placeholder="customer@example.com"
                      disabled={
                        isCustomerSaving
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-50"
                    />

                  </div>

                  {/* ADDRESS */}

                  <div>

                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Address
                    </label>

                    <input
                      type="text"
                      value={
                        address
                      }
                      onChange={(event) =>
                        setAddress(
                          event.target.value,
                        )
                      }
                      placeholder="Street address..."
                      disabled={
                        isCustomerSaving
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-50"
                    />

                  </div>

                </div>

                {/* FORM ACTIONS */}

                <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewCustomerForm(
                        false,
                      )
                    }
                    disabled={
                      isCustomerSaving
                    }
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={
                      isCustomerSaving
                    }
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {isCustomerSaving && (
                      <Loader2
                        className="animate-spin"
                        size={17}
                      />
                    )}

                    {isCustomerSaving
                      ? "Saving..."
                      : "Save & Select"}

                  </button>

                </div>

              </form>
            )}

          </div>
        </div>
      )}
    </>
  );
}