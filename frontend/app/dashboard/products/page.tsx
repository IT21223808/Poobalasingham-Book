"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  Pencil,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getProducts,
  Product,
  deleteProduct,
} from "@/services/product.service";

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ========================================
  // Load Products
  // ========================================

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);

      const data = await getProducts();

      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // Search
  // ========================================

  const filteredProducts = products.filter((product) => {
    const searchValue = search.toLowerCase().trim();

    return (
      product.productName
        ?.toLowerCase()
        .includes(searchValue) ||
      product.productCode
        ?.toLowerCase()
        .includes(searchValue) ||
      product.barcode
        ?.toLowerCase()
        .includes(searchValue) ||
      product.isbn
        ?.toLowerCase()
        .includes(searchValue)
    );
  });

  // ========================================
  // Stock Counts
  // ========================================

  const lowStockCount = products.filter((product) => {
    const stockQuantity = Number(product.stockQuantity ?? 0);
    const reorderLevel = Number(product.reorderLevel ?? 0);

    return (
      stockQuantity > 0 &&
      stockQuantity <= reorderLevel
    );
  }).length;

  const outOfStockCount = products.filter(
    (product) =>
      Number(product.stockQuantity ?? 0) === 0,
  ).length;

  // ========================================
  // Edit Product
  // ========================================

  const handleEdit = (id: string) => {
    router.push(`/dashboard/products/form?id=${id}`);
  };

  // ========================================
  // Delete Product
  // ========================================

  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.productName}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(product.id);

      await deleteProduct(product.id);

      setProducts((previous) =>
        previous.filter(
          (item) => item.id !== product.id,
        ),
      );

      alert("Product deleted successfully.");
    } catch (error) {
      console.error(
        "Failed to delete product:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete product.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ========================================
  // JSX
  // ========================================

  return (
    <div className="space-y-6">

      {/* ========================================
          Page Header
      ======================================== */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Products
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage books and product inventory
          </p>
        </div>

        {/* Add Product */}

        <button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard/products/form",
            )
          }
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus size={18} />

          Add Product
        </button>
      </div>

      {/* ========================================
          Summary Cards
      ======================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        {/* Total Products */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-blue-50 p-3">
              <Package
                size={22}
                className="text-blue-600"
              />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total Products
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {products.length}
              </p>
            </div>

          </div>
        </div>

        {/* Low Stock */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-yellow-50 p-3">
              <AlertTriangle
                size={22}
                className="text-yellow-600"
              />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Low Stock
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {lowStockCount}
              </p>
            </div>

          </div>
        </div>

        {/* Out Of Stock */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-red-50 p-3">
              <Package
                size={22}
                className="text-red-600"
              />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Out of Stock
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {outOfStockCount}
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* ========================================
          Search
      ======================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative max-w-md">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search by name, code, barcode or ISBN..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
          />

        </div>
      </div>

      {/* ========================================
          Product Table
      ======================================== */}

      <div className="overflow-visible rounded-xl border border-gray-200 bg-white">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1000px]">

            {/* Table Header */}

            <thead className="border-b border-gray-200 bg-gray-50">

              <tr>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Product
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Code
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Category
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Selling Price
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Stock
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-gray-500">
                  Actions
                </th>

              </tr>

            </thead>

            {/* Table Body */}

            <tbody className="divide-y divide-gray-100">

              {/* Loading */}

              {loading ? (

                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    Loading products...
                  </td>
                </tr>

              ) : filteredProducts.length === 0 ? (

                /* No Products */

                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    No products found
                  </td>
                </tr>

              ) : (

                filteredProducts.map((product) => {

                  const stockQuantity = Number(
                    product.stockQuantity ?? 0,
                  );

                  const reorderLevel = Number(
                    product.reorderLevel ?? 0,
                  );

                  const isOutOfStock =
                    stockQuantity === 0;

                  const isLowStock =
                    stockQuantity > 0 &&
                    stockQuantity <= reorderLevel;

                  return (

                    <tr
                      key={product.id}
                      className="transition hover:bg-gray-50"
                    >

                      {/* ========================================
                          Product
                      ======================================== */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          {product.imageUrl ? (

                            <img
                              src={`http://localhost:5000${product.imageUrl}`}
                              alt={product.productName}
                              className="h-11 w-11 rounded-lg object-cover"
                            />

                          ) : (

                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100">

                              <Package
                                size={18}
                                className="text-gray-400"
                              />

                            </div>

                          )}

                          <div>

                            <p className="font-medium text-gray-900">
                              {product.productName}
                            </p>

                            <p className="text-xs text-gray-500">
                              {product.author ||
                                "No author"}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* ========================================
                          Code
                      ======================================== */}

                      <td className="px-5 py-4">

                        <p className="text-sm font-medium text-gray-700">
                          {product.productCode}
                        </p>

                        {product.isbn && (

                          <p className="mt-1 text-xs text-gray-400">
                            ISBN: {product.isbn}
                          </p>

                        )}

                      </td>

                      {/* ========================================
                          Category
                      ======================================== */}

                      <td className="px-5 py-4">

                        <p className="text-sm text-gray-700">
                          {product.category?.name ||
                            "-"}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {product.subcategory?.name ||
                            "-"}
                        </p>

                      </td>

                      {/* ========================================
                          Selling Price
                      ======================================== */}

                      <td className="px-5 py-4">

                        <p className="text-sm font-semibold text-gray-900">
                          Rs.{" "}
                          {Number(
                            product.sellingPrice ?? 0,
                          ).toFixed(2)}
                        </p>

                      </td>

                      {/* ========================================
                          Stock
                      ======================================== */}

                      <td className="px-5 py-4">

                        <p className="text-sm font-semibold text-gray-800">
                          {stockQuantity}
                        </p>

                        <p className="text-xs text-gray-400">
                          Reorder: {reorderLevel}
                        </p>

                      </td>

                      {/* ========================================
                          Status
                      ======================================== */}

                      <td className="px-5 py-4">

                        {isOutOfStock ? (

                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                            Out of Stock
                          </span>

                        ) : isLowStock ? (

                          <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-600">
                            Low Stock
                          </span>

                        ) : (

                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                            In Stock
                          </span>

                        )}

                      </td>

                      {/* ========================================
                          Actions
                      ======================================== */}

                      <td className="px-5 py-4">

                        <div className="flex items-center justify-end gap-2">

                          {/* Edit */}

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(product.id)
                            }
                            disabled={
                              deletingId ===
                              product.id
                            }
                            title="Edit Product"
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >

                            <Pencil size={18} />

                          </button>

                          {/* Delete */}

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(product)
                            }
                            disabled={
                              deletingId ===
                              product.id
                            }
                            title="Delete Product"
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >

                            {deletingId ===
                            product.id ? (

                              <span className="text-xs">
                                Deleting...
                              </span>

                            ) : (

                              <Trash2 size={18} />

                            )}

                          </button>

                        </div>

                      </td>

                    </tr>

                  );
                })

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}