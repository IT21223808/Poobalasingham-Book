"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  UserCheck,
  UserX,
  X,
  Phone,
  Mail,
  MapPin,
  Users,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";

import api from "@/services/api";

/* =========================================================
   TYPES
========================================================= */

interface Customer {
  id: number;
  customerCode: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface CustomerForm {
  customerCode: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
}

/* =========================================================
   INITIAL FORM
========================================================= */

const EMPTY_FORM: CustomerForm = {
  customerCode: "",
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  country: "",
};

/* =========================================================
   PAGE
========================================================= */

export default function CustomersPage() {
  /* =======================================================
     STATE
  ======================================================= */

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">(
    "all",
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [viewingCustomer, setViewingCustomer] =
    useState<Customer | null>(null);

  const [form, setForm] =
    useState<CustomerForm>(EMPTY_FORM);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =======================================================
     ERROR HELPER
  ======================================================= */

  const getErrorMessage = (error: any) => {
    const data = error?.response?.data;

    if (Array.isArray(data?.message)) {
      return data.message.join(", ");
    }

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (typeof error?.message === "string") {
      return error.message;
    }

    return "Something went wrong. Please try again.";
  };

  /* =======================================================
     LOAD CUSTOMERS
  ======================================================= */

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      /*
       * IMPORTANT:
       * Do NOT use fetch() here.
       *
       * api.get() automatically adds:
       * Authorization: Bearer <JWT>
       */

      const response = await api.get("/customers");

      const data = response.data;

      if (Array.isArray(data)) {
        setCustomers(data);
      } else if (Array.isArray(data?.data)) {
        setCustomers(data.data);
      } else {
        setCustomers([]);
      }
    } catch (error: any) {
      console.error(
        "❌ Failed to load customers:",
        error,
      );

      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadCustomers();
  }, []);

  /* =======================================================
     FILTER CUSTOMERS
  ======================================================= */

  const filteredCustomers = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !searchValue ||
        customer.customerCode
          ?.toLowerCase()
          .includes(searchValue) ||
        customer.name
          ?.toLowerCase()
          .includes(searchValue) ||
        customer.phone
          ?.toLowerCase()
          .includes(searchValue) ||
        customer.email
          ?.toLowerCase()
          .includes(searchValue) ||
        customer.city
          ?.toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        status === "all" ||
        (status === "active" &&
          customer.isActive) ||
        (status === "inactive" &&
          !customer.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, status]);

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredCustomers.length / itemsPerPage,
    ),
  );

  const paginatedCustomers = useMemo(() => {
    const start =
      (currentPage - 1) * itemsPerPage;

    return filteredCustomers.slice(
      start,
      start + itemsPerPage,
    );
  }, [
    filteredCustomers,
    currentPage,
    itemsPerPage,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* =======================================================
     SUMMARY
  ======================================================= */

  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    (customer) => customer.isActive,
  ).length;

  const inactiveCustomers =
    customers.filter(
      (customer) => !customer.isActive,
    ).length;

  /* =======================================================
     OPEN CREATE
  ======================================================= */

  const openCreateModal = () => {
    setEditingCustomer(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  /* =======================================================
     OPEN EDIT
  ======================================================= */

  const openEditModal = (
    customer: Customer,
  ) => {
    setEditingCustomer(customer);

    setForm({
      customerCode:
        customer.customerCode || "",
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      city: customer.city || "",
      country: customer.country || "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  /* =======================================================
     OPEN VIEW
  ======================================================= */

  const openViewModal = (
    customer: Customer,
  ) => {
    setViewingCustomer(customer);
    setShowViewModal(true);
  };

  /* =======================================================
     CLOSE FORM MODAL
  ======================================================= */

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCustomer(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
  };

  /* =======================================================
     CLOSE VIEW MODAL
  ======================================================= */

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingCustomer(null);
  };

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange = (
    field: keyof CustomerForm,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* =======================================================
     SAVE CUSTOMER
  ======================================================= */

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Customer name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        customerCode:
          form.customerCode.trim() || undefined,

        name: form.name.trim(),

        phone:
          form.phone.trim() || undefined,

        email:
          form.email.trim() || undefined,

        address:
          form.address.trim() || undefined,

        city:
          form.city.trim() || undefined,

        country:
          form.country.trim() || undefined,
      };

      let response;

      /* =====================================================
         EDIT
      ===================================================== */

      if (editingCustomer) {
        response = await api.patch(
          `/customers/${editingCustomer.id}`,
          payload,
        );
      }

      /* =====================================================
         CREATE
      ===================================================== */

      else {
        response = await api.post(
          "/customers",
          payload,
        );
      }

      console.log(
        "✅ Customer saved:",
        response.data,
      );

      setSuccess(
        editingCustomer
          ? "Customer updated successfully."
          : "Customer created successfully.",
      );

      await loadCustomers();

      setTimeout(() => {
        setShowModal(false);
        setEditingCustomer(null);
        setForm(EMPTY_FORM);
        setSuccess("");
      }, 700);
    } catch (error: any) {
      console.error(
        "❌ Failed to save customer:",
        error,
      );

      setError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DEACTIVATE
  ======================================================= */

  const handleDeactivate = async (
    customer: Customer,
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${customer.name}?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await api.delete(
        `/customers/${customer.id}`,
      );

      console.log(
        "✅ Customer deactivated:",
        response.data,
      );

      setSuccess(
        "Customer deactivated successfully.",
      );

      await loadCustomers();

      setTimeout(() => {
        setSuccess("");
      }, 1500);
    } catch (error: any) {
      console.error(
        "❌ Failed to deactivate customer:",
        error,
      );

      setError(getErrorMessage(error));
    }
  };

  /* =======================================================
     ACTIVATE
  ======================================================= */

  const handleActivate = async (
    customer: Customer,
  ) => {
    try {
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/customers/${customer.id}/activate`,
      );

      console.log(
        "✅ Customer activated:",
        response.data,
      );

      setSuccess(
        "Customer activated successfully.",
      );

      await loadCustomers();

      setTimeout(() => {
        setSuccess("");
      }, 1500);
    } catch (error: any) {
      console.error(
        "❌ Failed to activate customer:",
        error,
      );

      setError(getErrorMessage(error));
    }
  };

  /* =======================================================
     SEARCH RESET
  ======================================================= */

  const handleSearchChange = (
    value: string,
  ) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (
    value:
      | "all"
      | "active"
      | "inactive",
  ) => {
    setStatus(value);
    setCurrentPage(1);
  };

  /* =======================================================
     FORMAT DATE
  ======================================================= */

  const formatDate = (
    value?: string,
  ) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString();
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customers
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your customers
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="mb-5 flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ===================================================
          SUCCESS
      =================================================== */}

      {success && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ===================================================
          SUMMARY CARDS
      =================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total Customers
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {totalCustomers}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Users size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Active Customers
              </p>

              <p className="mt-2 text-2xl font-bold text-green-600">
                {activeCustomers}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <UserRoundCheck size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Inactive Customers
              </p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {inactiveCustomers}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-3 text-red-600">
              <UserRoundX size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          FILTERS
      =================================================== */}

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                handleSearchChange(
                  event.target.value,
                )
              }
              placeholder="Search customers..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              handleStatusChange(
                event.target.value as
                  | "all"
                  | "active"
                  | "inactive",
              )
            }
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>
      </div>

      {/* ===================================================
          TABLE
      =================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-sm text-gray-500">
              Loading customers...
            </div>
          </div>
        ) : paginatedCustomers.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <Users
              size={40}
              className="mb-3 text-gray-300"
            />

            <h3 className="text-base font-semibold text-gray-700">
              No customers found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Code
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Customer
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Phone
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Email
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Location
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {paginatedCustomers.map(
                    (customer) => (
                      <tr
                        key={customer.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-5 py-4 text-sm font-medium text-gray-700">
                          {customer.customerCode ||
                            "-"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                              <Users size={17} />
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {customer.name}
                              </p>

                              <p className="text-xs text-gray-400">
                                ID: {customer.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {customer.phone || "-"}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {customer.email || "-"}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {[
                            customer.city,
                            customer.country,
                          ]
                            .filter(Boolean)
                            .join(", ") ||
                            "-"}
                        </td>

                        <td className="px-5 py-4">
                          {customer.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              Inactive
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              title="View"
                              onClick={() =>
                                openViewModal(
                                  customer,
                                )
                              }
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                            >
                              <Eye size={17} />
                            </button>

                            <button
                              type="button"
                              title="Edit"
                              onClick={() =>
                                openEditModal(
                                  customer,
                                )
                              }
                              className="rounded-lg p-2 text-blue-500 transition hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Pencil size={17} />
                            </button>

                            {customer.isActive ? (
                              <button
                                type="button"
                                title="Deactivate"
                                onClick={() =>
                                  handleDeactivate(
                                    customer,
                                  )
                                }
                                className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                              >
                                <UserX
                                  size={17}
                                />
                              </button>
                            ) : (
                              <button
                                type="button"
                                title="Activate"
                                onClick={() =>
                                  handleActivate(
                                    customer,
                                  )
                                }
                                className="rounded-lg p-2 text-green-500 transition hover:bg-green-50 hover:text-green-700"
                              >
                                <UserCheck
                                  size={17}
                                />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* =================================================
                PAGINATION
            ================================================= */}

            <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Showing{" "}
                {filteredCustomers.length === 0
                  ? 0
                  : (currentPage - 1) *
                      itemsPerPage +
                    1}{" "}
                to{" "}
                {Math.min(
                  currentPage *
                    itemsPerPage,
                  filteredCustomers.length,
                )}{" "}
                of{" "}
                {filteredCustomers.length}{" "}
                customers
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(1, page - 1),
                    )
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="px-2 text-sm text-gray-600">
                  Page {currentPage} of{" "}
                  {totalPages}
                </span>

                <button
                  type="button"
                  disabled={
                    currentPage >= totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          totalPages,
                          page + 1,
                        ),
                    )
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingCustomer
                    ? "Edit Customer"
                    : "Add Customer"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {editingCustomer
                    ? "Update customer information"
                    : "Create a new customer"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[75vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                {/* CUSTOMER CODE */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Customer Code
                  </label>

                  <input
                    type="text"
                    value={form.customerCode}
                    onChange={(event) =>
                      handleChange(
                        "customerCode",
                        event.target.value,
                      )
                    }
                    placeholder="Auto / optional"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* NAME */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Customer Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      handleChange(
                        "name",
                        event.target.value,
                      )
                    }
                    placeholder="Enter customer name"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Phone
                  </label>

                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      value={form.phone}
                      onChange={(event) =>
                        handleChange(
                          "phone",
                          event.target.value,
                        )
                      }
                      placeholder="Enter phone number"
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* EMAIL */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email
                  </label>

                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        handleChange(
                          "email",
                          event.target.value,
                        )
                      }
                      placeholder="Enter email"
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* ADDRESS */}

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Address
                  </label>

                  <textarea
                    value={form.address}
                    onChange={(event) =>
                      handleChange(
                        "address",
                        event.target.value,
                      )
                    }
                    placeholder="Enter address"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* CITY */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    City
                  </label>

                  <div className="relative">
                    <MapPin
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      value={form.city}
                      onChange={(event) =>
                        handleChange(
                          "city",
                          event.target.value,
                        )
                      }
                      placeholder="Enter city"
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* COUNTRY */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Country
                  </label>

                  <input
                    type="text"
                    value={form.country}
                    onChange={(event) =>
                      handleChange(
                        "country",
                        event.target.value,
                      )
                    }
                    placeholder="Enter country"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* FORM ERROR */}

                {error && (
                  <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* FORM SUCCESS */}

                {success && (
                  <div className="md:col-span-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                  </div>
                )}
              </div>

              {/* FOOTER */}

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingCustomer
                      ? "Update Customer"
                      : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      {showViewModal &&
        viewingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Customer Details
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    View customer information
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeViewModal}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 p-6">
                {/* NAME */}

                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Users size={25} />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {viewingCustomer.name}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {viewingCustomer.customerCode ||
                        "-"}
                    </p>
                  </div>
                </div>

                {/* STATUS */}

                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                    Status
                  </p>

                  {viewingCustomer.isActive ? (
                    <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                      Inactive
                    </span>
                  )}
                </div>

                {/* PHONE */}

                <div className="flex items-start gap-3">
                  <Phone
                    size={18}
                    className="mt-0.5 text-gray-400"
                  />

                  <div>
                    <p className="text-xs text-gray-400">
                      Phone
                    </p>

                    <p className="text-sm font-medium text-gray-800">
                      {viewingCustomer.phone ||
                        "-"}
                    </p>
                  </div>
                </div>

                {/* EMAIL */}

                <div className="flex items-start gap-3">
                  <Mail
                    size={18}
                    className="mt-0.5 text-gray-400"
                  />

                  <div>
                    <p className="text-xs text-gray-400">
                      Email
                    </p>

                    <p className="break-all text-sm font-medium text-gray-800">
                      {viewingCustomer.email ||
                        "-"}
                    </p>
                  </div>
                </div>

                {/* ADDRESS */}

                <div className="flex items-start gap-3">
                  <MapPin
                    size={18}
                    className="mt-0.5 text-gray-400"
                  />

                  <div>
                    <p className="text-xs text-gray-400">
                      Address
                    </p>

                    <p className="text-sm font-medium text-gray-800">
                      {viewingCustomer.address ||
                        "-"}
                    </p>

                    <p className="text-sm text-gray-600">
                      {[
                        viewingCustomer.city,
                        viewingCustomer.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>

                {/* CREATED */}

                <div className="border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">
                        Created
                      </p>

                      <p className="mt-1 text-sm text-gray-700">
                        {formatDate(
                          viewingCustomer.createdAt,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        Updated
                      </p>

                      <p className="mt-1 text-sm text-gray-700">
                        {formatDate(
                          viewingCustomer.updatedAt,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* VIEW FOOTER */}

              <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={closeViewModal}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeViewModal();
                    openEditModal(
                      viewingCustomer,
                    );
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Pencil size={16} />
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}