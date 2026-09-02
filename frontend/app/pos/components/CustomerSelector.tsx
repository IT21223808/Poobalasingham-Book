"use client";

import { useState } from "react";
import { Customer } from "@/services/customer.service";
import { User, UserPlus, X, Check, Search } from "lucide-react";

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onOpenNewCustomerModal: () => void;
}

export default function CustomerSelector({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onOpenNewCustomerModal,
}: CustomerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCustomers = customers.filter(
    (c) =>
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.customerCode.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)),
  );

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        {/* Selected customer badge or Walk-in */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-1 cursor-pointer items-center gap-3 min-w-0"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <User size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Customer
            </p>
            <p className="truncate text-base font-bold text-slate-900">
              {selectedCustomer
                ? `${selectedCustomer.customerName} (${selectedCustomer.customerCode})`
                : "Walk-in Customer"}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {selectedCustomer && (
            <button
              type="button"
              onClick={() => onSelectCustomer(null)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              title="Clear customer selection"
            >
              <X size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenNewCustomerModal}
            className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
            title="Create new customer"
          >
            <UserPlus size={15} />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Customer Dropdown Modal / List */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            {/* Search filter */}
            <div className="border-b border-slate-100 p-2.5">
              <div className="relative flex items-center">
                <Search size={16} className="absolute left-3 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer name, phone, code..."
                  className="w-full rounded-lg bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="no-scrollbar max-h-56 overflow-y-auto p-1.5 space-y-1">
              {/* Walk-in option */}
              <button
                type="button"
                onClick={() => {
                  onSelectCustomer(null);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                  selectedCustomer === null
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>Walk-in Customer</span>
                {selectedCustomer === null && <Check size={16} className="text-blue-600" />}
              </button>

              {filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?.id === cust.id;
                return (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => {
                      onSelectCustomer(cust);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-800">{cust.customerName}</p>
                      <p className="text-xs text-slate-500">
                        {cust.customerCode} {cust.phone ? `• ${cust.phone}` : ""}
                      </p>
                    </div>
                    {isSelected && <Check size={16} className="text-blue-600" />}
                  </button>
                );
              })}

              {filteredCustomers.length === 0 && search && (
                <div className="p-3 text-center text-xs text-slate-400">
                  No matching customers found.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
