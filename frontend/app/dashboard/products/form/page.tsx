"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getCategories,
  Category,
} from "@/services/category.service";
import {
  getSubcategories,
  Subcategory,
} from "@/services/subcategory.service";
import {
  getProduct,
  createProduct,
  updateProduct,
} from "@/services/product.service";

export default function ProductFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Edit URL:
  // /dashboard/products/form?id=xxxx
  const productId = searchParams.get("id");

  const isEditMode = Boolean(productId);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<
    Subcategory[]
  >([]);

  const [form, setForm] = useState({
    productCode: "",
    barcode: "",
    isbn: "",
    productName: "",
    categoryId: "",
    subcategoryId: "",
    author: "",
    publisher: "",
    language: "",
    grade: "",
    subject: "",
    edition: "",
    brand: "",
    purchasePrice: "",
    sellingPrice: "",
    wholesalePrice: "",
    stockQuantity: "",
    reorderLevel: "",
    imageUrl: "",
  });

  // ========================================
  // Load Categories
  // ========================================

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error(
          "Failed to load categories:",
          error,
        );
      }
    };

    loadCategories();
  }, []);

  // ========================================
  // Load Existing Product For Edit
  // ========================================

  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      try {
        setLoading(true);

        const product = await getProduct(productId);

        setForm({
          productCode: product.productCode ?? "",
          barcode: product.barcode ?? "",
          isbn: product.isbn ?? "",
          productName: product.productName ?? "",

          categoryId: product.category?.id ?? "",
          subcategoryId:
            product.subcategory?.id ?? "",

          author: product.author ?? "",
          publisher: product.publisher ?? "",
          language: product.language ?? "",
          grade: product.grade ?? "",
          subject: product.subject ?? "",
          edition: product.edition ?? "",
          brand: product.brand ?? "",

          purchasePrice:
            product.purchasePrice?.toString() ?? "",

          sellingPrice:
            product.sellingPrice?.toString() ?? "",

          wholesalePrice:
            product.wholesalePrice?.toString() ?? "",

          stockQuantity:
            product.stockQuantity?.toString() ?? "",

          reorderLevel:
            product.reorderLevel?.toString() ?? "",

          imageUrl: product.imageUrl ?? "",
        });
      } catch (error) {
        console.error(
          "Failed to load product:",
          error,
        );

        alert("Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  // ========================================
  // Load Subcategories
  // ========================================

  useEffect(() => {
    const loadSubcategories = async () => {
      if (!form.categoryId) {
        setSubcategories([]);
        return;
      }

      try {
        const data = await getSubcategories(
          form.categoryId,
        );

        setSubcategories(data);
      } catch (error) {
        console.error(
          "Failed to load subcategories:",
          error,
        );
      }
    };

    loadSubcategories();
  }, [form.categoryId]);

  // ========================================
  // Handle Input Change
  // ========================================

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,

      // When category changes,
      // reset subcategory
      ...(name === "categoryId"
        ? {
            subcategoryId: "",
          }
        : {}),
    }));
  };

  // ========================================
  // Submit
  // ========================================

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    try {
      setSaving(true);

      const data = {
        productCode: form.productCode,
        barcode: form.barcode || undefined,
        isbn: form.isbn || undefined,
        productName: form.productName,

        categoryId:
          form.categoryId || undefined,

        subcategoryId:
          form.subcategoryId || undefined,

        author: form.author || undefined,
        publisher: form.publisher || undefined,
        language: form.language || undefined,
        grade: form.grade || undefined,
        subject: form.subject || undefined,
        edition: form.edition || undefined,
        brand: form.brand || undefined,

        purchasePrice:
          form.purchasePrice === ""
            ? undefined
            : Number(form.purchasePrice),

        sellingPrice:
          form.sellingPrice === ""
            ? undefined
            : Number(form.sellingPrice),

        wholesalePrice:
          form.wholesalePrice === ""
            ? undefined
            : Number(form.wholesalePrice),

        stockQuantity:
          form.stockQuantity === ""
            ? undefined
            : Number(form.stockQuantity),

        reorderLevel:
          form.reorderLevel === ""
            ? undefined
            : Number(form.reorderLevel),

        imageUrl: form.imageUrl || undefined,
      };

      // ========================================
      // EDIT
      // ========================================

      if (isEditMode && productId) {
        await updateProduct(productId, data);

        alert("Product updated successfully.");
      }

      // ========================================
      // CREATE
      // ========================================

      else {
        await createProduct(data);

        alert("Product created successfully.");
      }

      router.push("/dashboard/products");
    } catch (error) {
      console.error(
        "Failed to save product:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save product.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // Loading
  // ========================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-gray-500">
          Loading product...
        </p>
      </div>
    );
  }

  // ========================================
  // JSX
  // ========================================

  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center gap-4">

        <button
          type="button"
          onClick={() =>
            router.push("/dashboard/products")
          }
          className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode
              ? "Edit Product"
              : "Add Product"}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {isEditMode
              ? "Update product information"
              : "Create a new book or product"}
          </p>
        </div>

      </div>

      {/* Form */}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        {/* Basic Information */}

        <div className="rounded-xl border border-gray-200 bg-white p-6">

          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

            <Input
              label="Product Code"
              name="productCode"
              value={form.productCode}
              onChange={handleChange}
              required
            />

            <Input
              label="Barcode"
              name="barcode"
              value={form.barcode}
              onChange={handleChange}
            />

            <Input
              label="ISBN"
              name="isbn"
              value={form.isbn}
              onChange={handleChange}
            />

            <Input
              label="Product Name"
              name="productName"
              value={form.productName}
              onChange={handleChange}
              required
            />

            {/* Category */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Category
              </label>

              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-gray-400"
              >
                <option value="">
                  Select Category
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Subcategory
              </label>

              <select
                name="subcategoryId"
                value={form.subcategoryId}
                onChange={handleChange}
                disabled={!form.categoryId}
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none disabled:bg-gray-100 focus:border-gray-400"
              >
                <option value="">
                  {form.categoryId
                    ? "Select Subcategory"
                    : "Select Category First"}
                </option>

                {subcategories.map(
                  (subcategory) => (
                    <option
                      key={subcategory.id}
                      value={subcategory.id}
                    >
                      {subcategory.name}
                    </option>
                  ),
                )}
              </select>
            </div>

          </div>
        </div>

        {/* Book Details */}

        <div className="rounded-xl border border-gray-200 bg-white p-6">

          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Book Details
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

            <Input
              label="Author"
              name="author"
              value={form.author}
              onChange={handleChange}
            />

            <Input
              label="Publisher"
              name="publisher"
              value={form.publisher}
              onChange={handleChange}
            />

            <Input
              label="Language"
              name="language"
              value={form.language}
              onChange={handleChange}
            />

            <Input
              label="Grade"
              name="grade"
              value={form.grade}
              onChange={handleChange}
            />

            <Input
              label="Subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
            />

            <Input
              label="Edition"
              name="edition"
              value={form.edition}
              onChange={handleChange}
            />

            <Input
              label="Brand"
              name="brand"
              value={form.brand}
              onChange={handleChange}
            />

          </div>
        </div>

        {/* Pricing */}

        <div className="rounded-xl border border-gray-200 bg-white p-6">

          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Pricing
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

            <Input
              label="Purchase Price"
              name="purchasePrice"
              type="number"
              value={form.purchasePrice}
              onChange={handleChange}
              min="0"
            />

            <Input
              label="Selling Price"
              name="sellingPrice"
              type="number"
              value={form.sellingPrice}
              onChange={handleChange}
              min="0"
            />

            <Input
              label="Wholesale Price"
              name="wholesalePrice"
              type="number"
              value={form.wholesalePrice}
              onChange={handleChange}
              min="0"
            />

          </div>
        </div>

        {/* Stock */}

        <div className="rounded-xl border border-gray-200 bg-white p-6">

          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Stock Information
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <Input
              label="Stock Quantity"
              name="stockQuantity"
              type="number"
              value={form.stockQuantity}
              onChange={handleChange}
              min="0"
            />

            <Input
              label="Reorder Level"
              name="reorderLevel"
              type="number"
              value={form.reorderLevel}
              onChange={handleChange}
              min="0"
            />

          </div>
        </div>

        {/* Image */}

        <div className="rounded-xl border border-gray-200 bg-white p-6">

          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Product Image
          </h2>

          <Input
            label="Image URL"
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleChange}
            placeholder="/uploads/products/example.jpg"
          />

        </div>

        {/* Actions */}

        <div className="flex justify-end gap-3">

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard/products")
            }
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={18} />

            {saving
              ? "Saving..."
              : isEditMode
                ? "Update Product"
                : "Save Product"}
          </button>

        </div>

      </form>
    </div>
  );
}

// ========================================
// Reusable Input
// ========================================

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  type?: string;
  required?: boolean;
  min?: string;
  placeholder?: string;
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
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
      />

    </div>
  );
}