"use client";

import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Mail,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  UserRound,
  Users,
  UserX,
  X,
  XCircle,
  Phone,
} from "lucide-react";
import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const CUSTOMERS_API = `${API_URL}/customers`;

const PAGE_SIZE = 10;

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

// =========================================================
// CUSTOMER INTERFACE
// =========================================================

export interface Customer {
  id: number;

  customerCode?: string | null;

  customerName: string;

  phone?: string | null;

  email?: string | null;

  address?: string | null;

  city?: string | null;

  isActive: boolean;

  createdAt?: string;

  updatedAt?: string;
}

// =========================================================
// CUSTOMER FORM
// =========================================================

interface CustomerForm {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  isActive: boolean;
}

const EMPTY_FORM: CustomerForm = {
  customerName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  isActive: true,
};

// =========================================================
// PAGE
// =========================================================

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(
    [],
  );

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  // Create / Edit modal
  const [showForm, setShowForm] =
    useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  // View modal
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [form, setForm] =
    useState<CustomerForm>(EMPTY_FORM);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // =========================================================
  // LOAD CUSTOMERS
  // =========================================================

  const loadCustomers = useCallback(
    async (showRefresh = false) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await fetch(
          CUSTOMERS_API,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-store",
          },
        );

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          const message =
            Array.isArray(data?.message)
              ? data.message.join(", ")
              : typeof data?.message === "string"
                ? data.message
                : undefined;

          throw new Error(
            message ||
              `Failed to load customers (${response.status})`,
          );
        }

        let customerData: Customer[] = [];

        if (Array.isArray(data)) {
          customerData = data;
        } else if (
          Array.isArray(data?.customers)
        ) {
          customerData = data.customers;
        } else if (
          Array.isArray(data?.data)
        ) {
          customerData = data.data;
        } else if (
          Array.isArray(
            data?.data?.customers,
          )
        ) {
          customerData =
            data.data.customers;
        }

        setCustomers(customerData);
      } catch (err) {
        console.error(
          "Load customers error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load customers.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    await loadCustomers(true);
  };

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalCustomers =
    customers.length;

  const activeCustomers =
    customers.filter(
      (customer) =>
        customer.isActive,
    ).length;

  const inactiveCustomers =
    customers.filter(
      (customer) =>
        !customer.isActive,
    ).length;

  // =========================================================
  // FILTER
  // =========================================================

  const filteredCustomers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return customers.filter(
      (customer) => {
        const matchesSearch =
          !query ||
          customer.customerName
            ?.toLowerCase()
            .includes(query) ||
          customer.customerCode
            ?.toLowerCase()
            .includes(query) ||
          customer.phone
            ?.toLowerCase()
            .includes(query) ||
          customer.email
            ?.toLowerCase()
            .includes(query) ||
          customer.city
            ?.toLowerCase()
            .includes(query);

        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter ===
            "ACTIVE" &&
            customer.isActive) ||
          (statusFilter ===
            "INACTIVE" &&
            !customer.isActive);

        return (
          matchesSearch &&
          matchesStatus
        );
      },
    );
  }, [
    customers,
    search,
    statusFilter,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredCustomers.length /
        PAGE_SIZE,
    ),
  );

  const paginatedCustomers =
    filteredCustomers.slice(
      (currentPage - 1) *
        PAGE_SIZE,
      currentPage * PAGE_SIZE,
    );

  useEffect(() => {
    if (
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
  ]);

  // =========================================================
  // INITIAL
  // =========================================================

  const getInitial = (
    name?: string,
  ) => {
    return (
      name
        ?.trim()
        .charAt(0)
        .toUpperCase() || "C"
    );
  };

  // =========================================================
  // OPEN CREATE
  // =========================================================

  const openCreate = () => {
    setEditingCustomer(null);
    setSelectedCustomer(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");
    setSuccess("");

    setShowForm(true);
  };

  // =========================================================
  // OPEN EDIT
  // =========================================================

  const openEdit = (
    customer: Customer,
  ) => {
    setSelectedCustomer(null);

    setEditingCustomer(customer);

    setForm({
      customerName:
        customer.customerName || "",

      phone:
        customer.phone || "",

      email:
        customer.email || "",

      address:
        customer.address || "",

      city:
        customer.city || "",

      isActive:
        customer.isActive,
    });

    setError("");
    setSuccess("");

    setShowForm(true);
  };

  // =========================================================
  // CLOSE FORM
  // =========================================================

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);

    setEditingCustomer(null);

    setForm({
      ...EMPTY_FORM,
    });
  };

  // =========================================================
  // UPDATE FIELD
  // =========================================================

  const updateField = (
    field: keyof CustomerForm,
    value: string | boolean,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // =========================================================
  // CREATE / UPDATE
  // =========================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (
      !form.customerName.trim()
    ) {
      setError(
        "Customer name is required.",
      );
      return;
    }

    try {
      setSaving(true);

      const isEdit =
        editingCustomer !== null;

      // -----------------------------------------------------
      // IMPORTANT
      // -----------------------------------------------------
      // Only send fields accepted by backend DTO.
      //
      // customerCode
      // contactPerson
      // country
      // taxNumber
      // vatNumber
      // paymentTerms
      // creditLimit
      // customerType
      //
      // are NOT sent.
      // -----------------------------------------------------

      const payload = {
        customerName:
          form.customerName.trim(),

        phone:
          form.phone.trim() ||
          undefined,

        email:
          form.email.trim() ||
          undefined,

        address:
          form.address.trim() ||
          undefined,

        city:
          form.city.trim() ||
          undefined,

        isActive:
          form.isActive,
      };

      const url = isEdit
        ? `${CUSTOMERS_API}/${editingCustomer.id}`
        : CUSTOMERS_API;

      const response = await fetch(
        url,
        {
          method: isEdit
            ? "PATCH"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload,
          ),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        let message =
          "Something went wrong.";

        if (
          Array.isArray(
            data?.message,
          )
        ) {
          message =
            data.message.join(
              ", ",
            );
        } else if (
          typeof data?.message ===
          "string"
        ) {
          message = data.message;
        } else if (
          typeof data?.error ===
          "string"
        ) {
          message = data.error;
        }

        throw new Error(message);
      }

      setSuccess(
        isEdit
          ? "Customer updated successfully."
          : "Customer created successfully.",
      );

      setShowForm(false);

      setEditingCustomer(null);

      setForm({
        ...EMPTY_FORM,
      });

      await loadCustomers();
    } catch (err) {
      console.error(
        "Save customer error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save customer.",
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DEACTIVATE
  // =========================================================

  const handleDeactivate = async (
    customer: Customer,
  ) => {
    const confirmed =
      window.confirm(
        `Deactivate customer "${customer.customerName}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${CUSTOMERS_API}/${customer.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        const message =
          Array.isArray(
            data?.message,
          )
            ? data.message.join(", ")
            : typeof data?.message ===
                "string"
              ? data.message
              : "Failed to deactivate customer.";

        throw new Error(message);
      }

      setSuccess(
        "Customer deactivated successfully.",
      );

      await loadCustomers();
    } catch (err) {
      console.error(
        "Deactivate customer error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to deactivate customer.",
      );
    }
  };

  // =========================================================
  // ACTIVATE
  // =========================================================

  const handleActivate = async (
    customer: Customer,
  ) => {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${CUSTOMERS_API}/${customer.id}/activate`,
        {
          method: "PATCH",
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        const message =
          Array.isArray(
            data?.message,
          )
            ? data.message.join(", ")
            : typeof data?.message ===
                "string"
              ? data.message
              : "Failed to activate customer.";

        throw new Error(message);
      }

      setSuccess(
        "Customer activated successfully.",
      );

      await loadCustomers();
    } catch (err) {
      console.error(
        "Activate customer error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to activate customer.",
      );
    }
  };

  // =========================================================
  // VIEW DETAILS
  // =========================================================

  const openDetails = (
    customer: Customer,
  ) => {
    setShowForm(false);
    setEditingCustomer(null);

    setSelectedCustomer(customer);
  };

  // =========================================================
  // CLOSE VIEW
  // =========================================================

  const closeDetails = () => {
    setSelectedCustomer(null);
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="flex items-center gap-3 text-gray-600">
              <RefreshCw className="h-5 w-5 animate-spin" />

              <span>
                Loading customers...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full space-y-6">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-blue-100 p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Customer Management
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage customer profiles and contact information
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />

            Add Customer
          </button>

        </div>

        {/* =====================================================
            ALERTS
        ===================================================== */}

        {error && (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <span>
                {error}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="text-red-500 transition hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>

          </div>
        )}

        {success && (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

              <span>
                {success}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              className="text-green-500 transition hover:text-green-700"
            >
              <X className="h-4 w-4" />
            </button>

          </div>
        )}

        {/* =====================================================
            SUMMARY
        ===================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <SummaryCard
            title="Total Customers"
            value={totalCustomers}
            icon={
              <Users className="h-5 w-5" />
            }
          />

          <SummaryCard
            title="Active Customers"
            value={activeCustomers}
            icon={
              <UserCheck className="h-5 w-5" />
            }
          />

          <SummaryCard
            title="Inactive Customers"
            value={inactiveCustomers}
            icon={
              <UserX className="h-5 w-5" />
            }
          />

        </div>

        {/* =====================================================
            TABLE
        ===================================================== */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          {/* FILTER */}

          <div className="border-b border-gray-200 p-4">

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

              {/* SEARCH */}

              <div className="relative w-full lg:max-w-md">

                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search customer..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* FILTERS */}

              <div className="flex flex-wrap items-center gap-2">

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target
                        .value as StatusFilter,
                    )
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="ALL">
                    All Status
                  </option>

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>
                </select>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={
                      refreshing
                        ? "h-4 w-4 animate-spin"
                        : "h-4 w-4"
                    }
                  />

                  Refresh
                </button>

              </div>

            </div>

          </div>

          {/* ===================================================
              EMPTY
          =================================================== */}

          {paginatedCustomers.length ===
          0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

              <div className="rounded-full bg-gray-100 p-4">
                <Users className="h-7 w-7 text-gray-400" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-gray-900">
                No customers found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? "Try changing your search or filter."
                  : "Add your first customer to get started."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />

                  Add Customer
                </button>
              )}

            </div>
          ) : (
            <>
              {/* =================================================
                  TABLE
              ================================================= */}

              <div className="overflow-x-auto">

                <table className="w-full min-w-[950px]">

                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Customer
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Contact
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Phone
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

                          {/* CUSTOMER */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-600">
                                {getInitial(
                                  customer.customerName,
                                )}
                              </div>

                              <div>

                                <p className="font-semibold text-gray-900">
                                  {
                                    customer.customerName
                                  }
                                </p>

                                <p className="mt-0.5 text-xs text-gray-500">
                                  {customer.customerCode ||
                                    `Customer #${customer.id}`}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* CONTACT */}

                          <td className="px-5 py-4">

                            <div className="space-y-1">

                              <div className="flex items-center gap-2 text-sm text-gray-700">

                                <UserRound className="h-3.5 w-3.5 text-gray-400" />

                                <span>
                                  {
                                    customer.customerName
                                  }
                                </span>

                              </div>

                              <div className="flex items-center gap-2 text-xs text-gray-500">

                                <Mail className="h-3.5 w-3.5 text-gray-400" />

                                <span>
                                  {customer.email ||
                                    "No email"}
                                </span>

                              </div>

                            </div>

                          </td>

                          {/* PHONE */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-2 text-sm text-gray-700">

                              <Phone className="h-4 w-4 text-gray-400" />

                              <span>
                                {customer.phone ||
                                  "—"}
                              </span>

                            </div>

                          </td>

                          {/* LOCATION */}

                          <td className="px-5 py-4">

                            <div className="flex items-start gap-2 text-sm text-gray-700">

                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />

                              <div>

                                <p>
                                  {customer.city ||
                                    "—"}
                                </p>

                                {customer.address &&
                                  customer.address !==
                                    customer.city && (
                                    <p className="mt-0.5 max-w-[220px] truncate text-xs text-gray-400">
                                      {
                                        customer.address
                                      }
                                    </p>
                                  )}

                              </div>

                            </div>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            {customer.isActive ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">

                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                                Active

                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">

                                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />

                                Inactive

                              </span>
                            )}

                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-1">

                              {/* VIEW */}

                              <button
                                type="button"
                                title="View customer"
                                onClick={() =>
                                  openDetails(
                                    customer,
                                  )
                                }
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {/* EDIT */}

                              <button
                                type="button"
                                title="Edit customer"
                                onClick={() =>
                                  openEdit(
                                    customer,
                                  )
                                }
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-amber-50 hover:text-amber-600"
                              >
                                <Edit className="h-4 w-4" />
                              </button>

                              {/* ACTIVE / INACTIVE */}

                              {customer.isActive ? (
                                <button
                                  type="button"
                                  title="Deactivate customer"
                                  onClick={() =>
                                    handleDeactivate(
                                      customer,
                                    )
                                  }
                                  className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                                >
                                  <Ban className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  title="Activate customer"
                                  onClick={() =>
                                    handleActivate(
                                      customer,
                                    )
                                  }
                                  className="rounded-lg p-2 text-gray-500 transition hover:bg-green-50 hover:text-green-600"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
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

                  <span className="font-medium text-gray-700">
                    {filteredCustomers.length ===
                    0
                      ? 0
                      : (currentPage -
                          1) *
                          PAGE_SIZE +
                        1}
                  </span>

                  {" "}to{" "}

                  <span className="font-medium text-gray-700">
                    {Math.min(
                      currentPage *
                        PAGE_SIZE,
                      filteredCustomers.length,
                    )}
                  </span>

                  {" "}of{" "}

                  <span className="font-medium text-gray-700">
                    {filteredCustomers.length}
                  </span>

                  {" "}customers

                </p>

                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(
                            1,
                            page - 1,
                          ),
                      )
                    }
                    className="rounded-lg border border-gray-300 p-2 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="min-w-[80px] text-center text-sm text-gray-600">

                    Page{" "}

                    <span className="font-semibold text-gray-900">
                      {currentPage}
                    </span>

                    {" "}of{" "}

                    <span className="font-semibold text-gray-900">
                      {totalPages}
                    </span>

                  </span>

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      totalPages
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
                    className="rounded-lg border border-gray-300 p-2 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                </div>

              </div>
            </>
          )}

        </div>

      </div>

      {/* =======================================================
          CREATE / EDIT MODAL
      ======================================================= */}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >

          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-5">

              <div>

                <h2 className="text-lg font-bold text-gray-900">
                  {editingCustomer
                    ? "Edit Customer"
                    : "Add Customer"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingCustomer
                    ? "Update customer information."
                    : "Create a new customer profile."}
                </p>

              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="min-h-0 flex-1 overflow-y-auto"
            >

              <div className="p-6">

                {/* =================================================
                    CUSTOMER INFORMATION
                ================================================= */}

                <div>

                  <div className="mb-4">

                    <h3 className="text-sm font-semibold text-gray-900">
                      Customer Information
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Basic customer profile details
                    </p>

                  </div>

                  <div className="grid grid-cols-1 gap-4">

                    <FormInput
                      label="Customer Name"
                      required
                      value={
                        form.customerName
                      }
                      onChange={(
                        value,
                      ) =>
                        updateField(
                          "customerName",
                          value,
                        )
                      }
                      placeholder="ABC Customer"
                    />

                  </div>

                </div>

                {/* =================================================
                    CONTACT INFORMATION
                ================================================= */}

                <div className="mt-7 border-t border-gray-100 pt-6">

                  <div className="mb-4">

                    <h3 className="text-sm font-semibold text-gray-900">
                      Contact Information
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Customer contact details
                    </p>

                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <FormInput
                      label="Phone"
                      value={
                        form.phone
                      }
                      onChange={(
                        value,
                      ) =>
                        updateField(
                          "phone",
                          value,
                        )
                      }
                      placeholder="+94 77 123 4567"
                    />

                    <FormInput
                      label="Email"
                      type="email"
                      value={
                        form.email
                      }
                      onChange={(
                        value,
                      ) =>
                        updateField(
                          "email",
                          value,
                        )
                      }
                      placeholder="customer@example.com"
                    />

                    <FormInput
                      label="City"
                      value={
                        form.city
                      }
                      onChange={(
                        value,
                      ) =>
                        updateField(
                          "city",
                          value,
                        )
                      }
                      placeholder="Colombo"
                    />

                    <div className="md:col-span-2">

                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Address
                      </label>

                      <textarea
                        value={
                          form.address
                        }
                        onChange={(
                          event,
                        ) =>
                          updateField(
                            "address",
                            event.target
                              .value,
                          )
                        }
                        rows={3}
                        placeholder="Customer address"
                        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                    </div>

                  </div>

                </div>

                {/* =================================================
                    STATUS
                ================================================= */}

                <div className="mt-7 border-t border-gray-100 pt-6">

                  <label className="flex cursor-pointer items-center gap-3">

                    <input
                      type="checkbox"
                      checked={
                        form.isActive
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "isActive",
                          event.target
                            .checked,
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    <span>

                      <span className="block text-sm font-medium text-gray-800">
                        Active Customer
                      </span>

                      <span className="block text-xs text-gray-500">
                        Customer can be used in sales and billing.
                      </span>

                    </span>

                  </label>

                </div>

              </div>

              {/* =================================================
                  FORM FOOTER
              ================================================= */}

              <div className="sticky bottom-0 flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving && (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  )}

                  {editingCustomer
                    ? "Update Customer"
                    : "Create Customer"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =======================================================
          VIEW CUSTOMER MODAL
      ======================================================= */}

      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDetails();
            }
          }}
        >

          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-5">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-600">
                  {getInitial(
                    selectedCustomer.customerName,
                  )}
                </div>

                <div>

                  <h2 className="text-lg font-bold text-gray-900">
                    {
                      selectedCustomer.customerName
                    }
                  </h2>

                  <p className="text-sm text-gray-500">
                    {selectedCustomer.customerCode ||
                      `Customer #${selectedCustomer.id}`}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  closeDetails
                }
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* CONTENT */}

            <div className="min-h-0 flex-1 overflow-y-auto">

              <div className="space-y-6 p-6">

                {/* STATUS */}

                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">

                  <div>

                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Customer Status
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {selectedCustomer.isActive
                        ? "Active"
                        : "Inactive"}
                    </p>

                  </div>

                  {selectedCustomer.isActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">

                      <CheckCircle2 className="h-4 w-4" />

                      Active

                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">

                      <XCircle className="h-4 w-4" />

                      Inactive

                    </span>
                  )}

                </div>

                {/* CUSTOMER INFORMATION */}

                <div>

                  <h3 className="mb-4 text-sm font-semibold text-gray-900">
                    Customer Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <InfoItem
                      label="Customer Code"
                      value={
                        selectedCustomer.customerCode ||
                        `Customer #${selectedCustomer.id}`
                      }
                    />

                    <InfoItem
                      label="Customer Name"
                      value={
                        selectedCustomer.customerName
                      }
                    />

                  </div>

                </div>

                {/* CONTACT INFORMATION */}

                <div>

                  <h3 className="mb-4 text-sm font-semibold text-gray-900">
                    Contact Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <InfoItem
                      icon={
                        <Phone className="h-4 w-4" />
                      }
                      label="Phone"
                      value={
                        selectedCustomer.phone ||
                        "Not provided"
                      }
                    />

                    <InfoItem
                      icon={
                        <Mail className="h-4 w-4" />
                      }
                      label="Email"
                      value={
                        selectedCustomer.email ||
                        "Not provided"
                      }
                    />

                    <InfoItem
                      icon={
                        <MapPin className="h-4 w-4" />
                      }
                      label="City"
                      value={
                        selectedCustomer.city ||
                        "Not provided"
                      }
                    />

                    <div className="md:col-span-2">

                      <InfoItem
                        icon={
                          <MapPin className="h-4 w-4" />
                        }
                        label="Address"
                        value={
                          selectedCustomer.address ||
                          "Not provided"
                        }
                      />

                    </div>

                  </div>

                </div>

                {/* FUTURE */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                  <FeaturePlaceholder
                    title="Sales History"
                    description="Customer sales history can be connected with sales and invoice data."
                  />

                  <FeaturePlaceholder
                    title="Outstanding Receivables"
                    description="Customer outstanding balances can be connected with invoices and payments."
                  />

                  <FeaturePlaceholder
                    title="Customer Performance"
                    description="Customer performance can be connected with sales metrics."
                  />

                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">

              <button
                type="button"
                onClick={() =>
                  openEdit(
                    selectedCustomer,
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <Edit className="h-4 w-4" />

                Edit Customer
              </button>

              <button
                type="button"
                onClick={
                  closeDetails
                }
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// =========================================================
// SUMMARY CARD
// =========================================================

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </p>

        </div>

        <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
          {icon}
        </div>

      </div>

    </div>
  );
}

// =========================================================
// FORM INPUT
// =========================================================

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>

      <label className="mb-1.5 block text-sm font-medium text-gray-700">

        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

    </div>
  );
}

// =========================================================
// INFO ITEM
// =========================================================

function InfoItem({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">

      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">

        {icon}

        {label}

      </div>

      <p className="mt-2 break-words text-sm font-medium text-gray-800">
        {value}
      </p>

    </div>
  );
}

// =========================================================
// FEATURE PLACEHOLDER
// =========================================================

function FeaturePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">

      <h4 className="text-sm font-semibold text-gray-800">
        {title}
      </h4>

      <p className="mt-2 text-xs leading-5 text-gray-500">
        {description}
      </p>

    </div>
  );
}