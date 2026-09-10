"use client";

import { useState } from "react";
import customerService, {
  Customer,
} from "@/services/customer.service";

import {
  X,
  UserPlus,
  Loader2,
} from "lucide-react";

import toast from "react-hot-toast";

interface QuickCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;

  /*
   * Whether the customer is newly created or
   * already existed does not matter to POS.
   *
   * In both cases we receive a Customer object
   * and select that customer in the cart.
   */
  onCustomerCreated: (customer: Customer) => void;
}

export default function QuickCustomerModal({
  isOpen,
  onClose,
  onCustomerCreated,
}: QuickCustomerModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  if (!isOpen) {
    return null;
  }

  // =========================================================
  // RESET FORM
  // =========================================================
  const resetForm = () => {
    setCustomerName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setCity("");
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================
  const handleClose = () => {
    if (isLoading) {
      return;
    }

    resetForm();
    onClose();
  };

  // =========================================================
  // CREATE / SELECT CUSTOMER
  // =========================================================
  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error(
        "Customer name is required.",
      );
      return;
    }

    setIsLoading(true);

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
       * IMPORTANT:
       *
       * Backend now returns:
       *
       * 1. Newly created customer
       * OR
       * 2. Existing customer with same phone
       *
       * So POS can directly select the returned customer.
       */

      toast.success(
        `Customer "${customer.customerName}" selected!`,
      );

      // Select customer in POS
      onCustomerCreated(customer);

      // Close modal
      onClose();

      // Reset form
      resetForm();
    } catch (err: any) {
      console.error(
        "Failed to create/select customer:",
        err,
      );

      const message =
        err?.response?.data?.message;

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
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">

        {/* =====================================================
            HEADER
        ====================================================== */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserPlus size={20} />
            </div>

            <h3 className="text-base font-bold text-slate-800">
              Quick New Customer
            </h3>

          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* =====================================================
            FORM
        ====================================================== */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-6"
        >

          {/* CUSTOMER NAME */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Customer Name{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              type="text"
              required
              value={customerName}
              onChange={(e) =>
                setCustomerName(
                  e.target.value,
                )
              }
              placeholder="e.g. Perera"
              disabled={isLoading}
              autoFocus
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-slate-50"
            />
          </div>

          {/* PHONE + CITY */}
          <div className="grid grid-cols-2 gap-3">

            {/* PHONE */}
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Phone Number
              </label>

              <input
                type="text"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value,
                  )
                }
                placeholder="0771234567"
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-slate-50"
              />
            </div>

            {/* CITY */}
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                City
              </label>

              <input
                type="text"
                value={city}
                onChange={(e) =>
                  setCity(
                    e.target.value,
                  )
                }
                placeholder="Colombo / Jaffna"
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value,
                )
              }
              placeholder="customer@example.com"
              disabled={isLoading}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-slate-50"
            />
          </div>

          {/* ADDRESS */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Address
            </label>

            <input
              type="text"
              value={address}
              onChange={(e) =>
                setAddress(
                  e.target.value,
                )
              }
              placeholder="Street address..."
              disabled={isLoading}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:bg-slate-50"
            />
          </div>

          {/* =====================================================
              ACTION BUTTONS
          ====================================================== */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">

            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading && (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              )}

              <span>
                {isLoading
                  ? "Processing..."
                  : "Save & Select"}
              </span>
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}