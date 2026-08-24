"use client";

import {Ban,Building2,CheckCircle2,ChevronLeft,ChevronRight,Edit,Eye,Mail,MapPin,Phone,Plus,RefreshCw,Search,UserRound,X,XCircle} from "lucide-react";
import {FormEvent,useCallback,useEffect,useMemo,useState} from "react";

interface Supplier {
  id: number;
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  taxNumber?: string;
  vatNumber?: string;
  paymentTerms?: string;
  creditLimit?: number;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SupplierForm {
  supplierCode: string;
  supplierName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  taxNumber: string;
  vatNumber: string;
  paymentTerms: string;
  creditLimit: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  isActive: boolean;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000/api";

const SUPPLIERS_API = `${API_URL}/suppliers`;

const EMPTY_FORM: SupplierForm = {
  supplierCode: "",
  supplierName: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  country: "",
  taxNumber: "",
  vatNumber: "",
  paymentTerms: "",
  creditLimit: "",
  bankName: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankBranch: "",
  isActive: true,
};

const PAGE_SIZE = 10;

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);

  const [editingSupplier, setEditingSupplier] =
    useState<Supplier | null>(null);

  const [selectedSupplier, setSelectedSupplier] =
    useState<Supplier | null>(null);

  const [form, setForm] =
    useState<SupplierForm>(EMPTY_FORM);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // FETCH SUPPLIERS
  // =========================================================

  const fetchSuppliers = useCallback(
    async (showRefresh = false) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await fetch(
          SUPPLIERS_API,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load suppliers (${response.status})`,
          );
        }

        const data = await response.json();

        setSuppliers(
          Array.isArray(data) ? data : [],
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load suppliers",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredSuppliers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return suppliers.filter((supplier) => {
      const matchesSearch =
        !query ||
        supplier.supplierCode
          .toLowerCase()
          .includes(query) ||
        supplier.supplierName
          .toLowerCase()
          .includes(query) ||
        supplier.contactPerson
          ?.toLowerCase()
          .includes(query) ||
        supplier.phone
          ?.toLowerCase()
          .includes(query) ||
        supplier.email
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          supplier.isActive) ||
        (statusFilter === "INACTIVE" &&
          !supplier.isActive);

      return (
        matchesSearch && matchesStatus
      );
    });
  }, [
    suppliers,
    search,
    statusFilter,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredSuppliers.length / PAGE_SIZE,
    ),
  );

  const paginatedSuppliers =
    filteredSuppliers.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalSuppliers = suppliers.length;

  const activeSuppliers = suppliers.filter(
    (supplier) => supplier.isActive,
  ).length;

  const inactiveSuppliers =
    suppliers.filter(
      (supplier) => !supplier.isActive,
    ).length;

  // =========================================================
  // CREATE
  // =========================================================

  const openCreate = () => {
    setEditingSupplier(null);
    setSelectedSupplier(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // =========================================================
  // EDIT
  // =========================================================

  const openEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSelectedSupplier(null);

    setForm({
      supplierCode:
        supplier.supplierCode || "",
      supplierName:
        supplier.supplierName || "",
      contactPerson:
        supplier.contactPerson || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      city: supplier.city || "",
      country:
        supplier.country || "",
      taxNumber:
        supplier.taxNumber || "",
      vatNumber:
        supplier.vatNumber || "",
      paymentTerms:
        supplier.paymentTerms || "",
      creditLimit:
        supplier.creditLimit !== undefined &&
        supplier.creditLimit !== null
          ? String(supplier.creditLimit)
          : "",
      bankName:
        supplier.bankName || "",
      bankAccountName:
        supplier.bankAccountName || "",
      bankAccountNumber:
        supplier.bankAccountNumber || "",
      bankBranch:
        supplier.bankBranch || "",
      isActive: supplier.isActive,
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
    setEditingSupplier(null);
    setForm(EMPTY_FORM);
  };

  // =========================================================
  // UPDATE FIELD
  // =========================================================

  const updateField = (
    field: keyof SupplierForm,
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

    if (!form.supplierCode.trim()) {
      setError(
        "Supplier code is required.",
      );
      return;
    }

    if (!form.supplierName.trim()) {
      setError(
        "Supplier name is required.",
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        supplierCode:
          form.supplierCode.trim(),
        supplierName:
          form.supplierName.trim(),
        contactPerson:
          form.contactPerson.trim() ||
          undefined,
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
        country:
          form.country.trim() ||
          undefined,
        taxNumber:
          form.taxNumber.trim() ||
          undefined,
        vatNumber:
          form.vatNumber.trim() ||
          undefined,
        paymentTerms:
          form.paymentTerms.trim() ||
          undefined,
        creditLimit:
          form.creditLimit.trim()
            ? Number(form.creditLimit)
            : 0,
        bankName:
          form.bankName.trim() ||
          undefined,
        bankAccountName:
          form.bankAccountName.trim() ||
          undefined,
        bankAccountNumber:
          form.bankAccountNumber.trim() ||
          undefined,
        bankBranch:
          form.bankBranch.trim() ||
          undefined,
        isActive: form.isActive,
      };

      const isEdit =
        editingSupplier !== null;

      const url = isEdit
        ? `${SUPPLIERS_API}/${editingSupplier.id}`
        : SUPPLIERS_API;

      const response = await fetch(url, {
        method: isEdit
          ? "PATCH"
          : "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        const message =
          data?.message;

        if (Array.isArray(message)) {
          throw new Error(
            message.join(", "),
          );
        }

        throw new Error(
          message ||
            `Failed to ${
              isEdit
                ? "update"
                : "create"
            } supplier`,
        );
      }

      setSuccess(
        isEdit
          ? "Supplier updated successfully."
          : "Supplier created successfully.",
      );

      setShowForm(false);
      setEditingSupplier(null);
      setForm(EMPTY_FORM);

      await fetchSuppliers();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DEACTIVATE
  // =========================================================

  const handleDeactivate = async (
    supplier: Supplier,
  ) => {
    const confirmed =
      window.confirm(
        `Deactivate supplier "${supplier.supplierName}"?`,
      );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${SUPPLIERS_API}/${supplier.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to deactivate supplier.",
        );
      }

      setSuccess(
        "Supplier deactivated successfully.",
      );

      await fetchSuppliers();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to deactivate supplier.",
      );
    }
  };

  // =========================================================
  // ACTIVATE
  // =========================================================

  const handleActivate = async (
    supplier: Supplier,
  ) => {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${SUPPLIERS_API}/${supplier.id}/activate`,
        {
          method: "PATCH",
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to activate supplier.",
        );
      }

      setSuccess(
        "Supplier activated successfully.",
      );

      await fetchSuppliers();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to activate supplier.",
      );
    }
  };

  // =========================================================
  // VIEW
  // =========================================================

  const openDetails = (
    supplier: Supplier,
  ) => {
    setSelectedSupplier(supplier);
    setShowForm(false);
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
                Loading suppliers...
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

        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Supplier Management
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Manage supplier profiles and contact information
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Supplier
          </button>
        </div>

        {/* ALERTS */}

        {error && (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex gap-2">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <div className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="text-green-500 hover:text-green-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* SUMMARY */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total Suppliers"
            value={totalSuppliers}
            icon={
              <Building2 className="h-5 w-5" />
            }
          />

          <SummaryCard
            title="Active Suppliers"
            value={activeSuppliers}
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
          />

          <SummaryCard
            title="Inactive Suppliers"
            value={inactiveSuppliers}
            icon={
              <XCircle className="h-5 w-5" />
            }
          />
        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          {/* FILTER */}

          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

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
                  placeholder="Search supplier..."
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as
                        | "ALL"
                        | "ACTIVE"
                        | "INACTIVE",
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
                  onClick={() =>
                    fetchSuppliers(true)
                  }
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
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

          {paginatedSuppliers.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="rounded-full bg-gray-100 p-4">
                <Building2 className="h-7 w-7 text-gray-400" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-gray-900">
                No suppliers found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? "Try changing your search or filter."
                  : "Add your first supplier to get started."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Supplier
                </button>
              )}
            </div>
          ) : (
            <>
              {/* TABLE */}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Supplier
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
                    {paginatedSuppliers.map(
                      (supplier) => (
                        <tr
                          key={supplier.id}
                          className="transition hover:bg-gray-50"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-600">
                                {supplier.supplierName
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="font-semibold text-gray-900">
                                  {
                                    supplier.supplierName
                                  }
                                </p>

                                <p className="mt-0.5 text-xs text-gray-500">
                                  {
                                    supplier.supplierCode
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <UserRound className="h-3.5 w-3.5 text-gray-400" />

                                <span>
                                  {supplier.contactPerson ||
                                    "—"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Mail className="h-3.5 w-3.5 text-gray-400" />

                                <span>
                                  {supplier.email ||
                                    "—"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Phone className="h-4 w-4 text-gray-400" />

                              {supplier.phone ||
                                "—"}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <MapPin className="h-4 w-4 text-gray-400" />

                              {[
                                supplier.city,
                                supplier.country,
                              ]
                                .filter(Boolean)
                                .join(", ") ||
                                "—"}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            {supplier.isActive ? (
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

                              <button
                                type="button"
                                title="View supplier"
                                onClick={() =>
                                  openDetails(
                                    supplier,
                                  )
                                }
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                title="Edit supplier"
                                onClick={() =>
                                  openEdit(
                                    supplier,
                                  )
                                }
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-amber-50 hover:text-amber-600"
                              >
                                <Edit className="h-4 w-4" />
                              </button>

                              {supplier.isActive ? (
                                <button
                                  type="button"
                                  title="Deactivate supplier"
                                  onClick={() =>
                                    handleDeactivate(
                                      supplier,
                                    )
                                  }
                                  className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                                >
                                  <Ban className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  title="Activate supplier"
                                  onClick={() =>
                                    handleActivate(
                                      supplier,
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

              {/* PAGINATION */}

              <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-medium text-gray-700">
                    {filteredSuppliers.length ===
                    0
                      ? 0
                      : (currentPage - 1) *
                          PAGE_SIZE +
                        1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-gray-700">
                    {Math.min(
                      currentPage *
                        PAGE_SIZE,
                      filteredSuppliers.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-700">
                    {filteredSuppliers.length}
                  </span>{" "}
                  suppliers
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      currentPage === 1
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
                    className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="min-w-[80px] text-center text-sm text-gray-600">
                    Page{" "}
                    <span className="font-semibold text-gray-900">
                      {currentPage}
                    </span>{" "}
                    of{" "}
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
                    className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER - FIXED */}

            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingSupplier
                    ? "Edit Supplier"
                    : "Add Supplier"}
                </h2>

                <p className="mt-0.5 text-sm text-gray-500">
                  {editingSupplier
                    ? "Update supplier profile information."
                    : "Create a new supplier profile."}
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

            {/* FORM CONTENT */}

            <form
              onSubmit={handleSubmit}
              className="scrollbar-hide min-h-0 flex-1 overflow-y-auto"
            >
              <div className="p-6">

                {/* SUPPLIER INFORMATION */}

                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Supplier Information
                    </h3>

                    <p className="text-xs text-gray-500">
                      Basic supplier profile details
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <FormInput
                      label="Supplier Code"
                      required
                      value={
                        form.supplierCode
                      }
                      onChange={(value) =>
                        updateField(
                          "supplierCode",
                          value,
                        )
                      }
                      placeholder="SUP-001"
                    />

                    <FormInput
                      label="Supplier Name"
                      required
                      value={
                        form.supplierName
                      }
                      onChange={(value) =>
                        updateField(
                          "supplierName",
                          value,
                        )
                      }
                      placeholder="ABC Suppliers"
                    />

                  </div>
                </div>

                {/* CONTACT */}

                <div className="mt-7 border-t border-gray-100 pt-6">

                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Contact Information
                    </h3>

                    <p className="text-xs text-gray-500">
                      Supplier contact details
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <FormInput
                      label="Contact Person"
                      value={
                        form.contactPerson
                      }
                      onChange={(value) =>
                        updateField(
                          "contactPerson",
                          value,
                        )
                      }
                      placeholder="John Silva"
                    />

                    <FormInput
                      label="Phone"
                      value={form.phone}
                      onChange={(value) =>
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
                      value={form.email}
                      onChange={(value) =>
                        updateField(
                          "email",
                          value,
                        )
                      }
                      placeholder="supplier@example.com"
                    />

                    <FormInput
                      label="City"
                      value={form.city}
                      onChange={(value) =>
                        updateField(
                          "city",
                          value,
                        )
                      }
                      placeholder="Colombo"
                    />

                    <FormInput
                      label="Country"
                      value={form.country}
                      onChange={(value) =>
                        updateField(
                          "country",
                          value,
                        )
                      }
                      placeholder="Sri Lanka"
                    />

                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Address
                      </label>

                      <textarea
                        value={
                          form.address
                        }
                        onChange={(event) =>
                          updateField(
                            "address",
                            event.target
                              .value,
                          )
                        }
                        rows={3}
                        placeholder="Supplier address"
                        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                  </div>
                </div>

                {/* TAX / PAYMENT INFORMATION */}

                <div className="mt-7 border-t border-gray-100 pt-6">

                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Tax & Payment Information
                    </h3>

                    <p className="text-xs text-gray-500">
                      Tax details, payment terms and supplier credit limit
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <FormInput
                      label="Tax Number"
                      value={form.taxNumber}
                      onChange={(value) =>
                        updateField("taxNumber", value)
                      }
                      placeholder="TIN / Tax Number"
                    />

                    <FormInput
                      label="VAT Number"
                      value={form.vatNumber}
                      onChange={(value) =>
                        updateField("vatNumber", value)
                      }
                      placeholder="VAT Number"
                    />

                    <FormInput
                      label="Payment Terms"
                      value={form.paymentTerms}
                      onChange={(value) =>
                        updateField("paymentTerms", value)
                      }
                      placeholder="e.g. Net 30"
                    />

                    <FormInput
                      label="Credit Limit"
                      type="number"
                      value={form.creditLimit}
                      onChange={(value) =>
                        updateField("creditLimit", value)
                      }
                      placeholder="0.00"
                    />

                  </div>
                </div>

                {/* BANK INFORMATION */}

                <div className="mt-7 border-t border-gray-100 pt-6">

                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Bank Information
                    </h3>

                    <p className="text-xs text-gray-500">
                      Supplier bank and account details
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <FormInput
                      label="Bank Name"
                      value={form.bankName}
                      onChange={(value) =>
                        updateField("bankName", value)
                      }
                      placeholder="Commercial Bank"
                    />

                    <FormInput
                      label="Account Name"
                      value={form.bankAccountName}
                      onChange={(value) =>
                        updateField("bankAccountName", value)
                      }
                      placeholder="Supplier account name"
                    />

                    <FormInput
                      label="Account Number"
                      value={form.bankAccountNumber}
                      onChange={(value) =>
                        updateField("bankAccountNumber", value)
                      }
                      placeholder="Account number"
                    />

                    <FormInput
                      label="Branch"
                      value={form.bankBranch}
                      onChange={(value) =>
                        updateField("bankBranch", value)
                      }
                      placeholder="Colombo Branch"
                    />

                  </div>
                </div>

                {/* STATUS */}

                <div className="mt-7 border-t border-gray-100 pt-6">

                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={
                        form.isActive
                      }
                      onChange={(event) =>
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
                        Active Supplier
                      </span>

                      <span className="block text-xs text-gray-500">
                        Supplier can be used in purchasing.
                      </span>
                    </span>
                  </label>

                </div>

              </div>

              {/* FOOTER - FIXED */}

              <div className="sticky bottom-0 flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  )}

                  {editingSupplier
                    ? "Update Supplier"
                    : "Create Supplier"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-5">

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-600">
                  {selectedSupplier.supplierName
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {
                      selectedSupplier.supplierName
                    }
                  </h2>

                  <p className="text-sm text-gray-500">
                    {
                      selectedSupplier.supplierCode
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedSupplier(
                    null,
                  )
                }
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* VIEW CONTENT */}

            <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">

              <div className="space-y-6 p-6">

                {/* STATUS */}

                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Supplier Status
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {selectedSupplier.isActive
                        ? "Active"
                        : "Inactive"}
                    </p>
                  </div>

                  {selectedSupplier.isActive ? (
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

                {/* CONTACT */}

                <div>

                  <h3 className="mb-4 text-sm font-semibold text-gray-900">
                    Contact Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    <InfoItem
                      icon={
                        <UserRound className="h-4 w-4" />
                      }
                      label="Contact Person"
                      value={
                        selectedSupplier.contactPerson ||
                        "Not provided"
                      }
                    />

                    <InfoItem
                      icon={
                        <Phone className="h-4 w-4" />
                      }
                      label="Phone"
                      value={
                        selectedSupplier.phone ||
                        "Not provided"
                      }
                    />

                    <InfoItem
                      icon={
                        <Mail className="h-4 w-4" />
                      }
                      label="Email"
                      value={
                        selectedSupplier.email ||
                        "Not provided"
                      }
                    />

                    <InfoItem
                      icon={
                        <MapPin className="h-4 w-4" />
                      }
                      label="Location"
                      value={
                        [
                          selectedSupplier.city,
                          selectedSupplier.country,
                        ]
                          .filter(Boolean)
                          .join(", ") ||
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
                          selectedSupplier.address ||
                          "Not provided"
                        }
                      />
                    </div>

                  </div>
                </div>

                {/* TAX / PAYMENT INFORMATION */}

                <div>
                  <h3 className="mb-4 text-sm font-semibold text-gray-900">
                    Tax & Payment Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoItem
                      label="Tax Number"
                      value={
                        selectedSupplier.taxNumber ||
                        "Not provided"
                      }
                    />

                    <InfoItem
                      label="VAT Number"
                      value={
                        selectedSupplier.vatNumber ||
                        "Not provided"
                      }
                    />

                    <InfoItem
                      label="Payment Terms"
                      value={
                        selectedSupplier.paymentTerms ||
                        "Not provided"
                      }
                    />

                    <InfoItem
                      label="Credit Limit"
                      value={
                        selectedSupplier.creditLimit !== undefined &&
                        selectedSupplier.creditLimit !== null
                          ? `Rs. ${Number(selectedSupplier.creditLimit).toLocaleString("en-LK", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : "Rs. 0.00"
                      }
                    />
                  </div>
                </div>

                {/* BANK INFORMATION */}

                <div>
                  <h3 className="mb-4 text-sm font-semibold text-gray-900">
                    Bank Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoItem
                      label="Bank Name"
                      value={
                        selectedSupplier.bankName ||
                        "Not provided"
                      }
                    />

                    <InfoItem
                      label="Account Name"
                      value={
                        selectedSupplier.bankAccountName ||
                        "Not provided"
                      }
                    />

                    <InfoItem
                      label="Account Number"
                      value={
                        selectedSupplier.bankAccountNumber ||
                        "Not provided"
                      }
                    />

                    <InfoItem
                      label="Branch"
                      value={
                        selectedSupplier.bankBranch ||
                        "Not provided"
                      }
                    />
                  </div>
                </div>

                {/* FUTURE REQUIREMENTS */}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                  <FeaturePlaceholder
                    title="Purchase History"
                    description="Purchase history will be connected with purchasing data."
                  />

                  <FeaturePlaceholder
                    title="Outstanding Payables"
                    description="Outstanding payable will be connected with invoices and payments."
                  />

                  <FeaturePlaceholder
                    title="Supplier Performance"
                    description="Supplier performance will be connected with purchasing metrics."
                  />

                </div>

              </div>
            </div>

            {/* FOOTER */}

            <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4">

              <button
                type="button"
                onClick={() => {
                  openEdit(
                    selectedSupplier,
                  );
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Edit className="h-4 w-4" />
                Edit Supplier
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedSupplier(
                    null,
                  )
                }
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
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
  icon: React.ReactNode;
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
  onChange: (value: string) => void;
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
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">

      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
        {icon}
        {label}
      </div>

      <p className="mt-2 text-sm font-medium text-gray-800">
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