"use client";

import { useEffect, useState } from "react";
import {
  Tags,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  Power,
  Check,
} from "lucide-react";

import FinanceNav from "@/components/finance/FinanceNav";
import { ExpenseCategory, financeService } from "@/services/finance.service";

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeService.getExpenseCategories({
        search,
        status: statusFilter || undefined,
      });
      setCategories(res.data || []);
    } catch (err: any) {
      console.error("Error loading categories:", err);
      setError(err?.response?.data?.message || "Failed to load expense categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return setError("Category name is required.");

    try {
      setSubmitting(true);
      setError(null);
      await financeService.createExpenseCategory({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
      });

      setIsAddOpen(false);
      setFormData({ name: "", description: "", isActive: true });
      setSuccessMsg("Expense category created successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchCategories();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create category.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    if (!formData.name.trim()) return setError("Category name is required.");

    try {
      setSubmitting(true);
      setError(null);
      await financeService.updateExpenseCategory(selectedCategory.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
      });

      setIsEditOpen(false);
      setSelectedCategory(null);
      setSuccessMsg("Expense category updated successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchCategories();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update category.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: ExpenseCategory) => {
    try {
      setError(null);
      await financeService.updateExpenseCategory(cat.id, {
        isActive: !cat.isActive,
      });
      setSuccessMsg(`Category ${!cat.isActive ? "activated" : "deactivated"}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchCategories();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update status.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category? (Will fail if used by transactions)")) return;
    try {
      setError(null);
      const res = await financeService.deleteExpenseCategory(id);
      setSuccessMsg(res.data.message || "Category deleted.");
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchCategories();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete category.");
    }
  };

  const openEdit = (cat: ExpenseCategory) => {
    setSelectedCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || "",
      isActive: cat.isActive,
    });
    setIsEditOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <FinanceNav />

      {/* Header and Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Expense Categories</h2>
          <p className="text-xs text-gray-500">Categorize operating expenses for detailed financial reporting and analysis</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={() => {
              setFormData({ name: "", description: "", isActive: true });
              setIsAddOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            New Category
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
          <CheckCircle className="h-4 w-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-gray-200">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchCategories()}
            className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-1.5 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-xs text-gray-700 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active Only</option>
          <option value="INACTIVE">Inactive Only</option>
        </select>

        <button
          onClick={fetchCategories}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {/* Categories Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-3.5">Category Name</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5">Created At</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {categories && categories.length > 0 ? (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/75 transition">
                    <td className="px-6 py-3.5 font-bold text-gray-900">{cat.name}</td>
                    <td className="px-6 py-3.5 text-gray-600 max-w-md">{cat.description || "—"}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          cat.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">
                      {new Date(cat.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleActive(cat)}
                          title={cat.isActive ? "Deactivate" : "Activate"}
                          className={`rounded p-1 transition ${
                            cat.isActive
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(cat)}
                          title="Edit Category"
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          title="Delete Category"
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-rose-600 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No expense categories configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {(isAddOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {isEditOpen ? "Edit Expense Category" : "New Expense Category"}
              </h3>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setIsEditOpen(false);
                }}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={isEditOpen ? handleUpdate : handleCreate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Rent, Electricity, Printing & Binding, Staff Salaries"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Optional notes or description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="catActive" className="text-xs font-medium text-gray-700">
                  Category is Active (Available in expense forms)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setIsEditOpen(false);
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : isEditOpen ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
