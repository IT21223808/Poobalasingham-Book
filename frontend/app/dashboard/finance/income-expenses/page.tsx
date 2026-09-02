"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  CheckCircle,
  Tags,
} from "lucide-react";

import Link from "next/link";
import FinanceNav from "@/components/finance/FinanceNav";

import {
  ExpenseCategory,
  FinanceTransaction,
  financeService,
  PaymentMethod,
} from "@/services/finance.service";

type TransactionType = "INCOME" | "EXPENSE";

export default function IncomeExpensesPage() {
  const [type, setType] = useState<TransactionType>("INCOME");

  const [transactions, setTransactions] = useState<FinanceTransaction[]>(
    []
  );

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    totalCash: 0,
    totalBank: 0,
    count: 0,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [selectedTxn, setSelectedTxn] =
    useState<FinanceTransaction | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: "",
    description: "",
    amount: "",
    paymentMethod: "CASH" as PaymentMethod,
    reference: "",
  });

  const formatCurrency = (amount: number) => {
    return `Rs. ${(amount || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      category: "",
      description: "",
      amount: "",
      paymentMethod: "CASH",
      reference: "",
    });
  };

  const showSuccess = (message: string) => {
    setSuccessMsg(message);

    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  // --------------------------------------------------
  // Expense Categories
  // --------------------------------------------------

  const fetchCategories = async () => {
    try {
      const res = await financeService.getExpenseCategories({
        status: "ACTIVE",
      });

      setCategories(res.data || []);
    } catch (err) {
      console.error("Error loading expense categories:", err);
    }
  };

  // --------------------------------------------------
  // Fetch Income / Expenses
  // --------------------------------------------------

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        search: search || undefined,
        paymentMethod: paymentMethod || undefined,

        // Category filter only applies to expenses
        category:
          type === "EXPENSE"
            ? categoryFilter || undefined
            : undefined,

        period: period !== "custom" ? period : undefined,
        startDate: period === "custom" ? startDate : undefined,
        endDate: period === "custom" ? endDate : undefined,
      };

      const incomeRes = await financeService.getIncome(params);
      const expenseRes = await financeService.getExpenses(params);

      const incomeTransactions =
        incomeRes.data?.transactions || [];

      const expenseTransactions =
        expenseRes.data?.transactions || [];

      const combined =
        type === "INCOME"
          ? incomeTransactions
          : expenseTransactions;

      setTransactions(combined);

      setSummary({
        totalIncome:
          incomeRes.data?.summary?.totalIncome || 0,

        totalExpense:
          expenseRes.data?.summary?.totalExpense || 0,

        totalCash:
          (incomeRes.data?.summary?.totalCash || 0) +
          (expenseRes.data?.summary?.totalCash || 0),

        totalBank:
          (incomeRes.data?.summary?.totalBank || 0) +
          (expenseRes.data?.summary?.totalBank || 0),

        count:
          type === "INCOME"
            ? incomeRes.data?.summary?.count || 0
            : expenseRes.data?.summary?.count || 0,
      });
    } catch (err: any) {
      console.error("Error loading transactions:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load transactions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [type, period, paymentMethod, categoryFilter]);

  // --------------------------------------------------
  // Add
  // --------------------------------------------------

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      return setError("Description is required.");
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      return setError("Valid amount is required.");
    }

    // Expense only requires category
    if (type === "EXPENSE" && !formData.category.trim()) {
      return setError("Expense category is required.");
    }

    try {
      setSubmitting(true);
      setError(null);

      if (type === "INCOME") {
        await financeService.createIncome({
          date: formData.date,
          description: formData.description.trim(),
          amount: Number(formData.amount),
          paymentMethod: formData.paymentMethod,
          reference:
            formData.reference.trim() || undefined,
        });
      } else {
        await financeService.createExpense({
          date: formData.date,
          expenseCategory: formData.category.trim(),
          description: formData.description.trim(),
          amount: Number(formData.amount),
          paymentMethod: formData.paymentMethod,
          reference:
            formData.reference.trim() || undefined,
        });
      }

      setIsAddOpen(false);
      resetForm();

      showSuccess(
        type === "INCOME"
          ? "Income recorded successfully!"
          : "Expense recorded successfully!"
      );

      fetchTransactions();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          `Failed to record ${type.toLowerCase()}.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // Edit
  // --------------------------------------------------

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTxn) return;

    if (!formData.description.trim()) {
      return setError("Description is required.");
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      return setError("Valid amount is required.");
    }

    // Expense only requires category
    if (type === "EXPENSE" && !formData.category.trim()) {
      return setError("Expense category is required.");
    }

    try {
      setSubmitting(true);
      setError(null);

      if (type === "INCOME") {
        await financeService.updateIncome(selectedTxn.id, {
          transactionDate: formData.date,
          description: formData.description.trim(),
          amount: Number(formData.amount),
          paymentMethod: formData.paymentMethod,
          reference:
            formData.reference.trim() || undefined,
        });
      } else {
        await financeService.updateExpense(selectedTxn.id, {
          transactionDate: formData.date,
          category: formData.category.trim(),
          description: formData.description.trim(),
          amount: Number(formData.amount),
          paymentMethod: formData.paymentMethod,
          reference:
            formData.reference.trim() || undefined,
        });
      }

      setIsEditOpen(false);
      setSelectedTxn(null);

      showSuccess(
        type === "INCOME"
          ? "Income updated successfully!"
          : "Expense updated successfully!"
      );

      fetchTransactions();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          `Failed to update ${type.toLowerCase()}.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // Delete
  // --------------------------------------------------

  const handleDelete = async (id: number) => {
    const confirmed = confirm(
      `Are you sure you want to delete this ${type.toLowerCase()} transaction?`
    );

    if (!confirmed) return;

    try {
      setError(null);

      if (type === "INCOME") {
        await financeService.deleteIncome(id);
      } else {
        await financeService.deleteExpense(id);
      }

      showSuccess(
        type === "INCOME"
          ? "Income transaction deleted."
          : "Expense transaction deleted."
      );

      fetchTransactions();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          `Failed to delete ${type.toLowerCase()} transaction.`
      );
    }
  };

  // --------------------------------------------------
  // Edit Modal
  // --------------------------------------------------

  const openEdit = (txn: FinanceTransaction) => {
    setSelectedTxn(txn);

    setFormData({
      date: txn.transactionDate,
      category: type === "EXPENSE" ? txn.category : "",
      description: txn.description,
      amount: String(txn.amount),
      paymentMethod: txn.paymentMethod,
      reference: txn.reference || "",
    });

    setIsEditOpen(true);
  };

  // --------------------------------------------------
  // Add Modal
  // --------------------------------------------------

  const openAdd = () => {
    resetForm();

    if (type === "EXPENSE") {
      setFormData((prev) => ({
        ...prev,
        category: categories[0]?.name || "",
      }));
    }

    setIsAddOpen(true);
  };

  const closeModal = () => {
    setIsAddOpen(false);
    setIsEditOpen(false);
    setSelectedTxn(null);
    setError(null);
    resetForm();
  };

  const pageTitle =
    type === "INCOME"
      ? "Income Management"
      : "Expense Management";

  const pageDescription =
    type === "INCOME"
      ? "Record and track business revenue, sales, and miscellaneous income"
      : "Log and manage utilities, rent, salaries, transport, and operational costs";

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <FinanceNav />

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {pageTitle}
          </h2>

          <p className="mt-0.5 text-xs text-gray-500">
            {pageDescription}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Expense Categories - Expense only */}
          {type === "EXPENSE" && (
            <Link
              href="/dashboard/finance/expense-categories"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <Tags className="h-4 w-4" />
              Categories
            </Link>
          )}

          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          <button
            onClick={openAdd}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition ${
              type === "INCOME"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            <Plus className="h-4 w-4" />

            {type === "INCOME"
              ? "Add Income"
              : "Add Expense"}
          </button>
        </div>
      </div>

      {/* Type Switch */}
      <div className="mb-6 inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => {
            setType("INCOME");
            setCategoryFilter("");
          }}
          className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-semibold transition ${
            type === "INCOME"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <ArrowDownLeft className="h-4 w-4" />
          Income
        </button>

        <button
          onClick={() => setType("EXPENSE")}
          className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-semibold transition ${
            type === "EXPENSE"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <ArrowUpRight className="h-4 w-4" />
          Expenses
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
          <CheckCircle className="h-4 w-4" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Income
            </span>

            <span className="rounded bg-emerald-50 p-1 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>

          <h3 className="mt-2 text-xl font-bold text-emerald-600">
            {formatCurrency(summary.totalIncome)}
          </h3>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Total Expenses
            </span>

            <span className="rounded bg-rose-50 p-1 text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>

          <h3 className="mt-2 text-xl font-bold text-rose-600">
            {formatCurrency(summary.totalExpense)}
          </h3>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Cash
            </span>

            <span className="rounded bg-amber-50 p-1 text-amber-600">
              <Wallet className="h-4 w-4" />
            </span>
          </div>

          <h3 className="mt-2 text-xl font-bold text-gray-800">
            {formatCurrency(summary.totalCash)}
          </h3>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Bank
            </span>

            <span className="rounded bg-indigo-50 p-1 text-indigo-600">
              <Building2 className="h-4 w-4" />
            </span>
          </div>

          <h3 className="mt-2 text-xl font-bold text-gray-800">
            {formatCurrency(summary.totalBank)}
          </h3>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />

          <input
            type="text"
            placeholder={`Search ${
              type === "INCOME" ? "income" : "expenses"
            }...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && fetchTransactions()
            }
            className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-1.5 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Expense Category Filter Only */}
        {type === "EXPENSE" && (
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value)
            }
            className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-xs text-gray-700 focus:outline-none"
          >
            <option value="">All Categories</option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.name}
              >
                {category.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={paymentMethod}
          onChange={(e) =>
            setPaymentMethod(e.target.value)
          }
          className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-xs text-gray-700 focus:outline-none"
        >
          <option value="">All Methods</option>
          <option value="CASH">Cash</option>
          <option value="BANK">Bank</option>
        </select>

        <div className="flex items-center gap-1">
          {["today", "week", "month", "year", ""].map(
            (p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                  period === p
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p === ""
                  ? "All"
                  : p.charAt(0).toUpperCase() +
                    p.slice(1)}
              </button>
            )
          )}
        </div>

        <button
          onClick={fetchTransactions}
          className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Apply
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3.5">
                  Txn Number
                </th>

                <th className="px-5 py-3.5">
                  Date
                </th>

                {/* Category only for Expense */}
                {type === "EXPENSE" && (
                  <th className="px-5 py-3.5">
                    Category
                  </th>
                )}

                <th className="px-5 py-3.5">
                  Description
                </th>

                <th className="px-5 py-3.5">
                  Method
                </th>

                <th className="px-5 py-3.5">
                  Reference
                </th>

                <th
                  className={`px-5 py-3.5 text-right ${
                    type === "INCOME"
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  Amount
                </th>

                <th className="px-5 py-3.5 text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-gray-700">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="transition hover:bg-gray-50/75"
                  >
                    <td className="px-5 py-3 font-semibold text-gray-900">
                      {transaction.transactionNumber}
                    </td>

                    <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                      {transaction.transactionDate}
                    </td>

                    {/* Category only for Expense */}
                    {type === "EXPENSE" && (
                      <td className="px-5 py-3 font-medium text-gray-800">
                        <span className="rounded border border-rose-100 bg-rose-50 px-2 py-0.5 font-semibold text-rose-700">
                          {transaction.category}
                        </span>
                      </td>
                    )}

                    <td className="max-w-sm truncate px-5 py-3 text-gray-600">
                      {transaction.description}
                    </td>

                    <td className="px-5 py-3">
                      <span className="inline-flex rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                        {transaction.paymentMethod}
                      </span>
                    </td>

                    <td className="px-5 py-3 text-gray-500">
                      {transaction.reference || "—"}
                    </td>

                    <td
                      className={`whitespace-nowrap px-5 py-3 text-right font-bold ${
                        type === "INCOME"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {type === "INCOME" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </td>

                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            openEdit(transaction)
                          }
                          title={`Edit ${
                            type === "INCOME"
                              ? "Income"
                              : "Expense"
                          }`}
                          className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-blue-600"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(transaction.id)
                          }
                          title={`Delete ${
                            type === "INCOME"
                              ? "Income"
                              : "Expense"
                          }`}
                          className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={type === "EXPENSE" ? 8 : 7}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    {loading
                      ? "Loading..."
                      : `No ${
                          type === "INCOME"
                            ? "income"
                            : "expense"
                        } records found.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(isAddOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {isEditOpen
                    ? `Edit ${
                        type === "INCOME"
                          ? "Income"
                          : "Expense"
                      } Entry`
                    : `Record New ${
                        type === "INCOME"
                          ? "Income"
                          : "Expense"
                      }`}
                </h3>

                <p className="mt-0.5 text-[11px] text-gray-400">
                  {type === "INCOME"
                    ? "Income transaction"
                    : "Expense transaction"}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={
                isEditOpen
                  ? handleUpdate
                  : handleCreate
              }
              className="mt-4 space-y-4 text-xs"
            >
              {/* Date */}
              <div>
                <label className="mb-1 block font-medium text-gray-700">
                  Date *
                </label>

                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Expense Category ONLY */}
              {type === "EXPENSE" && (
                <div>
                  <label className="mb-1 block font-medium text-gray-700">
                    Expense Category *
                  </label>

                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={category.name}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Or enter custom category name..."
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value,
                      })
                    }
                    className="mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="mb-1 block font-medium text-gray-700">
                  Description *
                </label>

                <textarea
                  required
                  rows={2}
                  placeholder={
                    type === "INCOME"
                      ? "Details about the income source..."
                      : "Details about the expense payment..."
                  }
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Amount / Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium text-gray-700">
                    Amount (Rs.) *
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-gray-700">
                    Payment Method *
                  </label>

                  <select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethod:
                          e.target.value as PaymentMethod,
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="CASH">
                      Cash
                    </option>

                    <option value="BANK">
                      Bank
                    </option>
                  </select>
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="mb-1 block font-medium text-gray-700">
                  Reference / Cheque No.
                </label>

                <input
                  type="text"
                  placeholder="Optional transaction reference"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reference: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`rounded-lg px-5 py-2 text-xs font-semibold text-white disabled:opacity-50 ${
                    type === "INCOME"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {submitting
                    ? "Saving..."
                    : isEditOpen
                    ? "Save Changes"
                    : type === "INCOME"
                    ? "Record Income"
                    : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}