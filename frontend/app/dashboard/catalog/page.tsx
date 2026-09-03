"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  X,
  Layers,
  FolderTree,
  CheckCircle2,
  AlertCircle,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/* =========================================================
   TYPES
========================================================= */

interface Category {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  subcategories?: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  category?: Category;
}

type ActiveTab = "categories" | "subcategories";
type ModalType = "category" | "subcategory" | null;
type ViewType = "category" | "subcategory" | null;

/* =========================================================
   PAGE
========================================================= */

export default function CatalogPage() {
  /* =======================================================
     TAB
  ======================================================= */

  const [activeTab, setActiveTab] =
    useState<ActiveTab>("categories");

  /* =======================================================
     DATA
  ======================================================= */

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<
    Subcategory[]
  >([]);

  /* =======================================================
     UI STATES
  ======================================================= */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modal, setModal] =
    useState<ModalType>(null);

  const [viewType, setViewType] =
    useState<ViewType>(null);

  const [viewItem, setViewItem] = useState<
    Category | Subcategory | null
  >(null);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  /* =======================================================
     FILTERS
  ======================================================= */

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | "active" | "inactive">("all");

  const [categoryFilter, setCategoryFilter] =
    useState<string>("all");

  /* =======================================================
     FORM - CATEGORY
  ======================================================= */

  const [categoryName, setCategoryName] =
    useState("");

  const [categoryDescription, setCategoryDescription] =
    useState("");

  const [categoryStatus, setCategoryStatus] =
    useState(true);

  /* =======================================================
     FORM - SUBCATEGORY
  ======================================================= */

  const [subcategoryName, setSubcategoryName] =
    useState("");

  const [subcategoryDescription, setSubcategoryDescription] =
    useState("");

  const [subcategoryCategoryId, setSubcategoryCategoryId] =
    useState("");

  const [subcategoryStatus, setSubcategoryStatus] =
    useState(true);

  /* =======================================================
     MESSAGES
  ======================================================= */

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* =======================================================
     AUTH
  ======================================================= */

  const getToken = () => {
    if (typeof window === "undefined") return null;

    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken")
    );
  };

  const getHeaders = (): HeadersInit => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  /* =======================================================
     SUCCESS MESSAGE
  ======================================================= */

  const showSuccess = (message: string) => {
    setSuccess(message);

    window.setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  /* LOAD CATEGORIES */

  const loadCategories = async () => {
    try {
      const response = await fetch(
        `${API_URL}/categories`,
        {
          headers: getHeaders(),
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to load categories",
        );
      }

      setCategories(
        Array.isArray(data) ? data : [],
      );
    } catch (err: any) {
      console.error(
        "Load categories error:",
        err,
      );

      setError(
        err?.message ||
          "Failed to load categories",
      );
    }
  };

  /* =======================================================
     LOAD SUBCATEGORIES
  ======================================================= */

  const loadSubcategories = async () => {
    try {
      const response = await fetch(
        `${API_URL}/subcategories`,
        {
          headers: getHeaders(),
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to load subcategories",
        );
      }

      setSubcategories(
        Array.isArray(data) ? data : [],
      );
    } catch (err: any) {
      console.error(
        "Load subcategories error:",
        err,
      );

      setError(
        err?.message ||
          "Failed to load subcategories",
      );
    }
  };

  /* =======================================================
     LOAD ALL
  ======================================================= */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadCategories(),
        loadSubcategories(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =======================================================
     RESET MODAL
  ======================================================= */

  const resetModal = () => {
    setModal(null);

    setEditingId(null);

    setCategoryName("");
    setCategoryDescription("");
    setCategoryStatus(true);

    setSubcategoryName("");
    setSubcategoryDescription("");
    setSubcategoryCategoryId("");
    setSubcategoryStatus(true);

    setError("");
  };

  /* =======================================================
     CLOSE VIEW
  ======================================================= */

  const closeView = () => {
    setViewType(null);
    setViewItem(null);
  };

  /* =======================================================
     VIEW CATEGORY
  ======================================================= */

  const handleViewCategory = (
    category: Category,
  ) => {
    setViewType("category");
    setViewItem(category);
  };

  /* =======================================================
     VIEW SUBCATEGORY
  ======================================================= */

  const handleViewSubcategory = (
    subcategory: Subcategory,
  ) => {
    setViewType("subcategory");
    setViewItem(subcategory);
  };

  /* =======================================================
     EDIT CATEGORY
  ======================================================= */

  const handleEditCategory = (
    category: Category,
  ) => {
    setEditingId(category.id);

    setCategoryName(category.name || "");

    setCategoryDescription(
      category.description || "",
    );

    setCategoryStatus(
      category.isActive ?? true,
    );

    setError("");

    setModal("category");
  };

  /* =======================================================
     EDIT SUBCATEGORY
  ======================================================= */

  const handleEditSubcategory = (
    subcategory: Subcategory,
  ) => {
    setEditingId(subcategory.id);

    setSubcategoryName(
      subcategory.name || "",
    );

    setSubcategoryDescription(
      subcategory.description || "",
    );

    setSubcategoryCategoryId(
      subcategory.category?.id || "",
    );

    setSubcategoryStatus(
      subcategory.isActive ?? true,
    );

    setError("");

    setModal("subcategory");
  };

  /* =======================================================
     CREATE / UPDATE CATEGORY
  ======================================================= */

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      setError("Category name is required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const isEditing =
        Boolean(editingId);

      const url = isEditing
        ? `${API_URL}/categories/${editingId}`
        : `${API_URL}/categories`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: categoryName.trim(),
          description:
            categoryDescription.trim() ||
            undefined,
          isActive: categoryStatus,
        }),
      });

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to ${
              isEditing ? "update" : "create"
            } category`,
        );
      }

      await loadCategories();

      resetModal();

      showSuccess(
        isEditing
          ? "Category updated successfully"
          : "Category created successfully",
      );
    } catch (err: any) {
      console.error(
        "Save category error:",
        err,
      );

      setError(
        err?.message ||
          "Failed to save category",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     CREATE / UPDATE SUBCATEGORY
  ======================================================= */

  const handleCreateSubcategory = async () => {
    if (!subcategoryName.trim()) {
      setError(
        "Subcategory name is required",
      );
      return;
    }

    if (!subcategoryCategoryId) {
      setError("Please select a category");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const isEditing =
        Boolean(editingId);

      const url = isEditing
        ? `${API_URL}/subcategories/${editingId}`
        : `${API_URL}/subcategories`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: subcategoryName.trim(),
          description:
            subcategoryDescription.trim() ||
            undefined,
          categoryId:
            subcategoryCategoryId,
          isActive: subcategoryStatus,
        }),
      });

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to ${
              isEditing
                ? "update"
                : "create"
            } subcategory`,
        );
      }

      await loadSubcategories();

      resetModal();

      showSuccess(
        isEditing
          ? "Subcategory updated successfully"
          : "Subcategory created successfully",
      );
    } catch (err: any) {
      console.error(
        "Save subcategory error:",
        err,
      );

      setError(
        err?.message ||
          "Failed to save subcategory",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DELETE CATEGORY
  ======================================================= */

  const handleDeleteCategory = async (
    category: Category,
  ) => {
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
          headers: getHeaders(),
        },
      );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to delete category",
        );
      }

      await loadData();

      showSuccess(
        "Category deleted successfully",
      );
    } catch (err: any) {
      console.error(
        "Delete category error:",
        err,
      );

      setError(
        err?.message ||
          "Failed to delete category",
      );
    }
  };

  /* =======================================================
     DELETE SUBCATEGORY
  ======================================================= */

  const handleDeleteSubcategory =
    async (
      subcategory: Subcategory,
    ) => {
      const confirmed =
        window.confirm(
          `Are you sure you want to delete "${subcategory.name}"?`,
        );

      if (!confirmed) return;

      try {
        setError("");

        const response = await fetch(
          `${API_URL}/subcategories/${subcategory.id}`,
          {
            method: "DELETE",
            headers: getHeaders(),
          },
        );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to delete subcategory",
          );
        }

        await loadData();

        showSuccess(
          "Subcategory deleted successfully",
        );
      } catch (err: any) {
        console.error(
          "Delete subcategory error:",
          err,
        );

        setError(
          err?.message ||
            "Failed to delete subcategory",
        );
      }
    };

  /* =======================================================
     FILTERED CATEGORIES
  ======================================================= */

  const filteredCategories =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return categories.filter(
        (category) => {
          const matchesSearch =
            !query ||
            category.name
              .toLowerCase()
              .includes(query) ||
            (
              category.description || ""
            )
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" &&
              category.isActive) ||
            (statusFilter === "inactive" &&
              !category.isActive);

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      categories,
      search,
      statusFilter,
    ]);

  /* =======================================================
     FILTERED SUBCATEGORIES
  ======================================================= */

  const filteredSubcategories =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return subcategories.filter(
        (subcategory) => {
          const matchesSearch =
            !query ||
            subcategory.name
              .toLowerCase()
              .includes(query) ||
            (
              subcategory.description || ""
            )
              .toLowerCase()
              .includes(query) ||
            (
              subcategory.category?.name ||
              ""
            )
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" &&
              subcategory.isActive) ||
            (statusFilter === "inactive" &&
              !subcategory.isActive);

          const matchesCategory =
            categoryFilter === "all" ||
            subcategory.category?.id ===
              categoryFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesCategory
          );
        },
      );
    }, [
      subcategories,
      search,
      statusFilter,
      categoryFilter,
    ]);

  /* =======================================================
     STATS
  ======================================================= */

  const categoryStats =
    useMemo(() => {
      return {
        total: categories.length,
        active: categories.filter(
          (item) => item.isActive,
        ).length,
        inactive: categories.filter(
          (item) => !item.isActive,
        ).length,
      };
    }, [categories]);

  const subcategoryStats =
    useMemo(() => {
      return {
        total: subcategories.length,
        active: subcategories.filter(
          (item) => item.isActive,
        ).length,
        inactive: subcategories.filter(
          (item) => !item.isActive,
        ).length,
      };
    }, [subcategories]);

  /* =======================================================
     DATE FORMAT
  ======================================================= */

  const formatDate = (
    value?: string,
  ) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );
  };

  /* TAB CHANGE */

  const changeTab = (
    tab: ActiveTab,
  ) => {
    setActiveTab(tab);

    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setError("");
  };

  /* RENDER */

  return (
    <div className="min-h-screen bg-gray-50">
      {/*  HEADER */}

      <div className="border-b border-gray-200 bg-white">
        <div className="w-full px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Catalog
                  </h1>

                  <p className="mt-1 text-sm text-gray-500">
                    Manage categories and
                    subcategories
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setError("");

                if (
                  activeTab ===
                  "categories"
                ) {
                  setCategoryName("");
                  setCategoryDescription(
                    "",
                  );
                  setCategoryStatus(
                    true,
                  );
                  setModal("category");
                } else {
                  setSubcategoryName(
                    "",
                  );
                  setSubcategoryDescription(
                    "",
                  );
                  setSubcategoryCategoryId(
                    "",
                  );
                  setSubcategoryStatus(
                    true,
                  );
                  setModal(
                    "subcategory",
                  );
                }
              }}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              <Plus size={17} />

              {activeTab ===
              "categories"
                ? "Add Category"
                : "Add Subcategory"}
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}

      <main className="max-w-full px-6 py-6">
        {/*  SUCCESS */}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2
              size={18}
            />

            <span>{success}</span>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
              className="ml-auto"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle
              size={18}
            />

            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="ml-auto"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* TABS */}

        <div className="mb-6 flex w-fit items-center rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() =>
              changeTab(
                "categories",
              )
            }
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
              activeTab ===
              "categories"
                ? "bg-blue-700 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FolderTree size={17} />

            Categories

            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab ===
                "categories"
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {categoryStats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              changeTab(
                "subcategories",
              )
            }
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
              activeTab ===
              "subcategories"
                ? "bg-blue-700 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Layers size={17} />

            Subcategories

            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab ===
                "subcategories"
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {subcategoryStats.total}
            </span>
          </button>
        </div>

        {/* STATS */}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">
              Total
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">
              {activeTab ===
              "categories"
                ? categoryStats.total
                : subcategoryStats.total}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">
              Active
            </p>

            <p className="mt-1 text-2xl font-bold text-green-600">
              {activeTab ===
              "categories"
                ? categoryStats.active
                : subcategoryStats.active}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">
              Inactive
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-500">
              {activeTab ===
              "categories"
                ? categoryStats.inactive
                : subcategoryStats.inactive}
            </p>
          </div>
        </div>

        {/* =================================================
            TABLE CARD
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* =================================================
              TOOLBAR
          ================================================= */}

          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              {/* SEARCH */}

              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value,
                    )
                  }
                  placeholder={
                    activeTab ===
                    "categories"
                      ? "Search categories..."
                      : "Search subcategories..."
                  }
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </div>

              {/* CATEGORY FILTER */}

              {activeTab ===
                "subcategories" && (
                <div className="relative">
                  <select
                    value={
                      categoryFilter
                    }
                    onChange={(e) =>
                      setCategoryFilter(
                        e.target.value,
                      )
                    }
                    className="h-10 min-w-[190px] appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-gray-400"
                  >
                    <option value="all">
                      All Categories
                    </option>

                    {categories.map(
                      (
                        category,
                      ) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {
                            category.name
                          }
                        </option>
                      ),
                    )}
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              )}

              {/* STATUS */}

              <div className="relative">
                <select
                  value={
                    statusFilter
                  }
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as
                        | "all"
                        | "active"
                        | "inactive",
                    )
                  }
                  className="h-10 min-w-[140px] appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-gray-400"
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

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />

                Loading...
              </div>
            </div>
          ) : activeTab ===
            "categories" ? (
            /* ===============================================
               CATEGORY TABLE
            =============================================== */

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Category
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Description
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Subcategories
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Created
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredCategories.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-14 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <FolderTree
                            size={32}
                            className="text-gray-300"
                          />

                          <p className="mt-3 text-sm font-medium text-gray-600">
                            No categories
                            found
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Try changing
                            your search or
                            filters
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map(
                      (category) => {
                        const count =
                          subcategories.filter(
                            (sub) =>
                              sub.category
                                ?.id ===
                              category.id,
                          ).length;

                        return (
                          <tr
                            key={
                              category.id
                            }
                            className="transition hover:bg-gray-50"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                                  <FolderTree
                                    size={
                                      17
                                    }
                                  />
                                </div>

                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {
                                      category.name
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="max-w-[280px] px-6 py-4">
                              <p className="truncate text-sm text-gray-500">
                                {category.description ||
                                  "—"}
                              </p>
                            </td>

                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                                {count}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              {category.isActive ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                  Inactive
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-4 text-sm text-gray-500">
                              {formatDate(
                                category.createdAt,
                              )}
                            </td>

                            {/* =================================
                                CATEGORY ACTIONS
                            ================================= */}

                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                {/* VIEW */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleViewCategory(
                                      category,
                                    )
                                  }
                                  title="View Category"
                                  aria-label="View Category"
                                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                                >
                                  <Eye
                                    size={
                                      17
                                    }
                                    strokeWidth={
                                      2
                                    }
                                    className="block"
                                  />
                                </button>

                                {/* EDIT */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditCategory(
                                      category,
                                    )
                                  }
                                  title="Edit Category"
                                  aria-label="Edit Category"
                                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <Pencil
                                    size={
                                      17
                                    }
                                    strokeWidth={
                                      2
                                    }
                                    className="block"
                                  />
                                </button>

                                {/* DELETE */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteCategory(
                                      category,
                                    )
                                  }
                                  title="Delete Category"
                                  aria-label="Delete Category"
                                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2
                                    size={
                                      17
                                    }
                                    strokeWidth={
                                      2
                                    }
                                    className="block"
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      },
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* ===============================================
               SUBCATEGORY TABLE
            =============================================== */

            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Subcategory
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Category
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Description
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Created
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredSubcategories.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-14 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <Layers
                            size={32}
                            className="text-gray-300"
                          />

                          <p className="mt-3 text-sm font-medium text-gray-600">
                            No subcategories
                            found
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Try changing
                            your search or
                            filters
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSubcategories.map(
                      (subcategory) => (
                        <tr
                          key={
                            subcategory.id
                          }
                          className="transition hover:bg-gray-50"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                                <Layers
                                  size={
                                    17
                                  }
                                />
                              </div>

                              <p className="text-sm font-semibold text-gray-900">
                                {
                                  subcategory.name
                                }
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                              {subcategory
                                .category
                                ?.name ||
                                "—"}
                            </span>
                          </td>

                          <td className="max-w-[260px] px-6 py-4">
                            <p className="truncate text-sm text-gray-500">
                              {subcategory.description ||
                                "—"}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            {subcategory.isActive ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                Inactive
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-500">
                            {formatDate(
                              subcategory.createdAt,
                            )}
                          </td>

                          {/* =================================
                              SUBCATEGORY ACTIONS
                          ================================= */}

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {/* VIEW */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleViewSubcategory(
                                    subcategory,
                                  )
                                }
                                title="View Subcategory"
                                aria-label="View Subcategory"
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                              >
                                <Eye
                                  size={
                                    17
                                  }
                                  strokeWidth={
                                    2
                                  }
                                  className="block"
                                />
                              </button>

                              {/* EDIT */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleEditSubcategory(
                                    subcategory,
                                  )
                                }
                                title="Edit Subcategory"
                                aria-label="Edit Subcategory"
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                              >
                                <Pencil
                                  size={
                                    17
                                  }
                                  strokeWidth={
                                    2
                                  }
                                  className="block"
                                />
                              </button>

                              {/* DELETE */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteSubcategory(
                                    subcategory,
                                  )
                                }
                                title="Delete Subcategory"
                                aria-label="Delete Subcategory"
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2
                                  size={
                                    17
                                  }
                                  strokeWidth={
                                    2
                                  }
                                  className="block"
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* =====================================================
          ADD / EDIT CATEGORY MODAL
      ===================================================== */}

      {modal === "category" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId
                    ? "Edit Category"
                    : "Add Category"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {editingId
                    ? "Update category details"
                    : "Create a new category"}
                </p>
              </div>

              <button
                type="button"
                onClick={resetModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={19} />
              </button>
            </div>

            {/* BODY */}

            <div className="space-y-5 px-6 py-6">
              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Category Name
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) =>
                    setCategoryName(
                      e.target.value,
                    )
                  }
                  placeholder="Enter category name"
                  className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Description
                </label>

                <textarea
                  value={
                    categoryDescription
                  }
                  onChange={(e) =>
                    setCategoryDescription(
                      e.target.value,
                    )
                  }
                  placeholder="Enter description"
                  rows={4}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </div>

              {/* STATUS */}

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Active Status
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Enable or disable this
                    category
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    categoryStatus
                  }
                  onChange={(e) =>
                    setCategoryStatus(
                      e.target.checked,
                    )
                  }
                  className="h-5 w-5 accent-gray-900"
                />
              </label>

              {/* ERROR */}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={resetModal}
                className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleCreateCategory
                }
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}

                {editingId
                  ? "Update Category"
                  : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          ADD / EDIT SUBCATEGORY MODAL
      ===================================================== */}

      {modal === "subcategory" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId
                    ? "Edit Subcategory"
                    : "Add Subcategory"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {editingId
                    ? "Update subcategory details"
                    : "Create a new subcategory"}
                </p>
              </div>

              <button
                type="button"
                onClick={resetModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={19} />
              </button>
            </div>

            {/* BODY */}

            <div className="space-y-5 px-6 py-6">
              {/* CATEGORY */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Category
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="relative">
                  <select
                    value={
                      subcategoryCategoryId
                    }
                    onChange={(e) =>
                      setSubcategoryCategoryId(
                        e.target.value,
                      )
                    }
                    className="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {
                            category.name
                          }
                        </option>
                      ),
                    )}
                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Subcategory Name
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={
                    subcategoryName
                  }
                  onChange={(e) =>
                    setSubcategoryName(
                      e.target.value,
                    )
                  }
                  placeholder="Enter subcategory name"
                  className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Description
                </label>

                <textarea
                  value={
                    subcategoryDescription
                  }
                  onChange={(e) =>
                    setSubcategoryDescription(
                      e.target.value,
                    )
                  }
                  placeholder="Enter description"
                  rows={4}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </div>

              {/* STATUS */}

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Active Status
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Enable or disable this
                    subcategory
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    subcategoryStatus
                  }
                  onChange={(e) =>
                    setSubcategoryStatus(
                      e.target.checked,
                    )
                  }
                  className="h-5 w-5 accent-gray-900"
                />
              </label>

              {/* ERROR */}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={resetModal}
                className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleCreateSubcategory
                }
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}

                {editingId
                  ? "Update Subcategory"
                  : "Create Subcategory"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      {viewType &&
        viewItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    {viewType ===
                    "category" ? (
                      <FolderTree
                        size={19}
                      />
                    ) : (
                      <Layers
                        size={19}
                      />
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {viewType ===
                      "category"
                        ? "Category Details"
                        : "Subcategory Details"}
                    </h2>

                    <p className="text-xs text-gray-500">
                      View information
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeView}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={19} />
                </button>
              </div>

              {/* BODY */}

              <div className="space-y-4 px-6 py-6">
                {/* NAME */}

                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Name
                  </p>

                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {viewItem.name}
                  </p>
                </div>

                {/* CATEGORY */}

                {viewType ===
                  "subcategory" && (
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Category
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {(
                        viewItem as Subcategory
                      ).category
                        ?.name ||
                        "—"}
                    </p>
                  </div>
                )}

                {/* DESCRIPTION */}

                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Description
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-700">
                    {viewItem.description ||
                      "No description provided"}
                  </p>
                </div>

                {/* STATUS */}

                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Status
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {viewItem.isActive
                        ? "Active"
                        : "Inactive"}
                    </p>
                  </div>

                  {viewItem.isActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      Inactive
                    </span>
                  )}
                </div>

                {/* CREATED */}

                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Created At
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {formatDate(
                      viewItem.createdAt,
                    )}
                  </p>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={closeView}
                  className="h-10 rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800"
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