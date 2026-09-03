"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Search,
  Plus,
  X,
  FolderTree,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Category {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

type FormState = {
  name: string;
  description: string;
  isActive: boolean;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [showDrawer, setShowDrawer] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [viewingCategory, setViewingCategory] =
    useState<Category | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    isActive: true,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/categories`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to load categories",
        );
      }

      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Load categories error:", err);

      setError(
        err?.message || "Unable to load categories",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredCategories = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return categories.filter((category) => {
      const categoryName =
        category.name?.toLowerCase() || "";

      const description =
        category.description?.toLowerCase() || "";

      const matchesSearch =
        !searchText ||
        categoryName.includes(searchText) ||
        description.includes(searchText);

      const matchesStatus =
        status === "all" ||
        (status === "active" && category.isActive) ||
        (status === "inactive" && !category.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, status]);

  // =====================================================
  // SUCCESS
  // =====================================================

  const showSuccess = (message: string) => {
    setSuccess(message);

    window.setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      isActive: true,
    });

    setEditingCategory(null);
  };

  // =====================================================
  // OPEN ADD
  // =====================================================

  const openAddDrawer = () => {
    resetForm();
    setError("");
    setShowDrawer(true);
  };

  // =====================================================
  // OPEN EDIT
  // =====================================================

  const openEditDrawer = (category: Category) => {
    setEditingCategory(category);

    setForm({
      name: category.name || "",
      description: category.description || "",
      isActive: category.isActive,
    });

    setError("");
    setShowDrawer(true);
  };

  // =====================================================
  // CLOSE DRAWER
  // =====================================================

  const closeDrawer = () => {
    if (saving) return;

    setShowDrawer(false);
    resetForm();
    setError("");
  };

  // =====================================================
  // VIEW
  // =====================================================

  const openViewModal = (category: Category) => {
    setViewingCategory(category);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingCategory(null);
  };

  // =====================================================
  // CREATE / UPDATE
  // =====================================================

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = form.name.trim();

    if (!trimmedName) {
      setError("Category name is required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const isEditing = Boolean(editingCategory);

      const url = isEditing
        ? `${API_URL}/categories/${editingCategory?.id}`
        : `${API_URL}/categories`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          description:
            form.description.trim() || undefined,
          isActive: form.isActive,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (isEditing
              ? "Failed to update category"
              : "Failed to create category"),
        );
      }

      setShowDrawer(false);
      resetForm();

      await loadCategories();

      showSuccess(
        isEditing
          ? "Category updated successfully"
          : "Category created successfully",
      );
    } catch (err: any) {
      console.error("Category save error:", err);

      setError(
        err?.message ||
          (editingCategory
            ? "Failed to update category"
            : "Failed to create category"),
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (category: Category) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/categories/${category.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to delete category",
        );
      }

      setCategories((prev) =>
        prev.filter(
          (item) => item.id !== category.id,
        ),
      );

      showSuccess("Category deleted successfully");
    } catch (err: any) {
      console.error("Delete category error:", err);

      setError(
        err?.message || "Failed to delete category",
      );
    }
  };

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (date?: string) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleString();
  };

  // =====================================================
  // ICONS
  // =====================================================

  const EditIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        display: "block",
        flexShrink: 0,
      }}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );

  const DeleteIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        display: "block",
        flexShrink: 0,
      }}
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );

  const ViewIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        display: "block",
        flexShrink: 0,
      }}
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  // UI
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full px-4 py-5 sm:px-6 lg:px-8">

        {/*  HEADER */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <FolderTree size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Categories
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddDrawer}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>

        {/* SUCCESS */}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {/*  ERROR */}

        {error && !showDrawer && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
          </div>
        )}

        {/*  TABLE CARD */}

        <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* TOOLBAR */}

          <div className="border-b border-gray-200 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

              {/* SEARCH + FILTER */}

              <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl">

                {/* Search */}

                <div className="relative w-full sm:max-w-md sm:flex-1">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Status */}

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as
                        | "all"
                        | "active"
                        | "inactive",
                    )
                  }
                  className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

              {/* RESULT COUNT */}

              <div className="text-sm text-gray-500">
                <span className="font-semibold text-gray-700">
                  {filteredCategories.length}
                </span>{" "}
                categories
              </div>
            </div>
          </div>

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">

              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Category
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Description
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="w-[160px] px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {/* LOADING */}

                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

                      <p className="mt-3 text-sm text-gray-500">
                        Loading categories...
                      </p>
                    </td>
                  </tr>

                ) : filteredCategories.length === 0 ? (

                  /* EMPTY */

                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-20 text-center"
                    >
                      <FolderTree
                        size={42}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-4 text-sm font-semibold text-gray-700">
                        No categories found
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Create your first category
                        to get started.
                      </p>

                      <button
                        type="button"
                        onClick={openAddDrawer}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        <Plus size={17} />
                        Add Category
                      </button>
                    </td>
                  </tr>

                ) : (

                  /* DATA */

                  filteredCategories.map((category) => (
                    <tr
                      key={category.id}
                      className="transition hover:bg-gray-50"
                    >

                      {/* CATEGORY */}

                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {category.name}
                        </div>
                      </td>

                      {/* DESCRIPTION */}

                      <td className="max-w-[500px] px-6 py-4">
                        <div className="truncate text-sm text-gray-500">
                          {category.description ||
                            "—"}
                        </div>
                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            category.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {category.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">

                          {/* VIEW */}

                          <button
                            type="button"
                            onClick={() =>
                              openViewModal(category)
                            }
                            title="View Category"
                            aria-label="View Category"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                          >
                            <ViewIcon />
                          </button>

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() =>
                              openEditDrawer(category)
                            }
                            title="Edit Category"
                            aria-label="Edit Category"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                          >
                            <EditIcon />
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(category)
                            }
                            title="Delete Category"
                            aria-label="Delete Category"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <DeleteIcon />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          {!loading &&
            filteredCategories.length > 0 && (
              <div className="border-t border-gray-200 px-6 py-4">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {filteredCategories.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-700">
                    {categories.length}
                  </span>{" "}
                  categories
                </p>
              </div>
            )}
        </div>
      </div>

      {/* =====================================================
          ADD / EDIT DRAWER
      ===================================================== */}

      {showDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={closeDrawer}
        >
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* DRAWER HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingCategory
                    ? "Update category information"
                    : "Create a new product category"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                disabled={saving}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="flex h-[calc(100%-81px)] flex-col"
            >

              <div className="flex-1 space-y-5 overflow-y-auto p-6">

                {/* ERROR */}

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* NAME */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Category Name{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g. School Books"
                    autoFocus
                    className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* DESCRIPTION */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Description
                  </label>

                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description:
                          e.target.value,
                      }))
                    }
                    placeholder="Category description..."
                    className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* STATUS */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Status
                  </label>

                  <select
                    value={
                      form.isActive
                        ? "active"
                        : "inactive"
                    }
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        isActive:
                          e.target.value ===
                          "active",
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </select>
                </div>

              </div>

              {/* DRAWER FOOTER */}

              <div className="flex gap-3 border-t border-gray-200 bg-white p-6">

                <button
                  type="button"
                  onClick={closeDrawer}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? editingCategory
                      ? "Updating..."
                      : "Creating..."
                    : editingCategory
                      ? "Update Category"
                      : "Create Category"}
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
        viewingCategory && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={closeViewModal}
          >
            <div
              className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Category Details
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    View category information
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeViewModal}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* BODY */}

              <div className="space-y-5 p-6">

                {/* NAME */}

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Category Name
                  </p>

                  <p className="text-base font-semibold text-gray-900">
                    {viewingCategory.name}
                  </p>
                </div>

                {/* DESCRIPTION */}

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Description
                  </p>

                  <p className="text-sm leading-6 text-gray-600">
                    {viewingCategory.description ||
                      "No description available"}
                  </p>
                </div>

                {/* STATUS */}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Status
                  </p>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      viewingCategory.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {viewingCategory.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                {/* CREATED */}

                <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
                  <CalendarDays
                    size={18}
                    className="text-gray-400"
                  />

                  <div>
                    <p className="text-xs text-gray-400">
                      Created At
                    </p>

                    <p className="text-sm font-medium text-gray-700">
                      {formatDate(
                        viewingCategory.createdAt,
                      )}
                    </p>
                  </div>
                </div>

                {/* UPDATED */}

                {viewingCategory.updatedAt && (
                  <div className="flex items-center gap-3">
                    <CalendarDays
                      size={18}
                      className="text-gray-400"
                    />

                    <div>
                      <p className="text-xs text-gray-400">
                        Last Updated
                      </p>

                      <p className="text-sm font-medium text-gray-700">
                        {formatDate(
                          viewingCategory.updatedAt,
                        )}
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">

                <button
                  type="button"
                  onClick={closeViewModal}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const category =
                      viewingCategory;

                    closeViewModal();
                    openEditDrawer(category);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <EditIcon />
                  Edit
                </button>

              </div>
            </div>
          </div>
        )}
    </div>
  );
}