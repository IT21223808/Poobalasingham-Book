"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  Pencil,
  Trash2,
  Printer,
} from "lucide-react";
import { useRouter } from "next/navigation";
import JsBarcode from "jsbarcode";

import {
  getProducts,
  Product,
  deleteProduct,
} from "@/services/product.service";

// ======================================================
// EAN-13 VALIDATION
// ======================================================

const isValidEAN13 = (barcode: string): boolean => {
  if (!/^\d{13}$/.test(barcode)) {
    return false;
  }

  const digits = barcode.split("").map(Number);

  let sum = 0;

  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }

  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === digits[12];
};

// ======================================================
// EAN-13 SVG COMPONENT
// ======================================================

interface BarcodeSvgProps {
  value: string;
  width?: number;
  height?: number;
}

function BarcodeSvg({
  value,
  width = 2,
  height = 55,
}: BarcodeSvgProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);

    if (!value || !isValidEAN13(value)) {
      setError(true);
      return;
    }

    try {
      const svgElement = document.getElementById(
        `barcode-${value}`,
      );

      if (!svgElement) {
        return;
      }

      JsBarcode(svgElement, value, {
        format: "ean13",
        width,
        height,
        displayValue: true,
        fontSize: 12,
        font: "Arial",
        textMargin: 4,
        margin: 4,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch (error) {
      console.error(
        "Failed to generate EAN-13 barcode:",
        error,
      );

      setError(true);
    }
  }, [value, width, height]);

  if (error) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
        <p className="text-xs font-semibold text-amber-700">
          EAN-13 unavailable
        </p>

        <p className="mt-1 font-mono text-xs text-gray-700">
          {value}
        </p>
      </div>
    );
  }

  return (
    <svg
      id={`barcode-${value}`}
      className="block max-w-full"
      aria-label={`EAN-13 barcode ${value}`}
    />
  );
}

// ======================================================
// PAGE
// ======================================================

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  // ======================================================
  // LOAD PRODUCTS
  // ======================================================

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);

      const data = await getProducts();

      console.log("PRODUCT LIST DATA:", data);

      setProducts(data);
    } catch (error) {
      console.error(
        "Failed to load products:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // SEARCH
  // ======================================================

  const filteredProducts = products.filter(
    (product) => {
      const searchValue =
        search.toLowerCase().trim();

      if (!searchValue) {
        return true;
      }

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
    },
  );

  // ======================================================
  // STOCK COUNTS
  // ======================================================

  const lowStockCount = products.filter(
    (product) => {
      const stockQuantity = Number(
        product.stockQuantity ?? 0,
      );

      const reorderLevel = Number(
        product.reorderLevel ?? 0,
      );

      return (
        stockQuantity > 0 &&
        stockQuantity <= reorderLevel
      );
    },
  ).length;

  const outOfStockCount =
    products.filter(
      (product) =>
        Number(product.stockQuantity ?? 0) === 0,
    ).length;

  // ======================================================
  // EDIT PRODUCT
  // ======================================================

  const handleEdit = (id: string) => {
    router.push(
      `/dashboard/products/form?id=${id}`,
    );
  };

  // ======================================================
  // DELETE PRODUCT
  // ======================================================

  const handleDelete = async (
    product: Product,
  ) => {
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

      alert(
        "Product deleted successfully.",
      );
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

  // ======================================================
  // ESCAPE HTML
  // ======================================================

  const escapeHtml = (value: string) => {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // ======================================================
  // GENERATE BARCODE SVG FOR PRINT
  // ======================================================

  const generateBarcodeSvg = (
    barcode: string,
  ): string | null => {
    if (!isValidEAN13(barcode)) {
      return null;
    }

    try {
      const svgElement =
        document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg",
        );

      JsBarcode(svgElement, barcode, {
        format: "ean13",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        font: "Arial",
        textMargin: 5,
        margin: 5,
        background: "#ffffff",
        lineColor: "#000000",
      });

      return svgElement.outerHTML;
    } catch (error) {
      console.error(
        "Failed to generate print barcode:",
        error,
      );

      return null;
    }
  };

  // ======================================================
  // PRINT BARCODE LABEL
  // ======================================================

  const handlePrintBarcode = (
    product: Product,
  ) => {
    if (!product.barcode) {
      alert(
        "This product does not have a barcode.",
      );
      return;
    }

    // ------------------------------------------
    // Validate EAN-13
    // ------------------------------------------

    if (!isValidEAN13(product.barcode)) {
      alert(
        `Barcode "${product.barcode}" is not a valid EAN-13 barcode.\n\nThe existing barcode has NOT been changed.`,
      );
      return;
    }

    // ------------------------------------------
    // Generate SVG
    // ------------------------------------------

    const barcodeSvg =
      generateBarcodeSvg(product.barcode);

    if (!barcodeSvg) {
      alert(
        "Unable to generate EAN-13 barcode.",
      );
      return;
    }

    // ------------------------------------------
    // Open print window
    // ------------------------------------------

    const printWindow = window.open(
      "",
      "_blank",
      "width=600,height=700",
    );

    if (!printWindow) {
      alert(
        "Unable to open print window. Please allow pop-ups.",
      );
      return;
    }

    // ------------------------------------------
    // Safe values
    // ------------------------------------------

    const productName = escapeHtml(
      product.productName || "Product",
    );

    const barcodeNumber = escapeHtml(
      product.barcode,
    );

    const price = Number(
      product.sellingPrice ?? 0,
    ).toFixed(2);

    // ------------------------------------------
    // Print HTML
    // ------------------------------------------

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>
        <head>

          <meta charset="UTF-8" />

          <title>
            Barcode Label - ${productName}
          </title>

          <style>

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: white;
              font-family: Arial, Helvetica, sans-serif;
            }

            body {
              padding: 20px;
            }

            .label {
              width: 320px;
              min-height: 210px;

              margin: 0 auto;

              padding: 16px;

              border: 1px solid #000;

              background: white;

              text-align: center;

              overflow: hidden;
            }

            .store {
              margin-bottom: 8px;

              font-size: 14px;
              font-weight: 700;

              color: #000;
            }

            .product-name {
              margin-bottom: 8px;

              font-size: 15px;
              font-weight: 700;

              color: #000;

              line-height: 1.25;

              word-break: break-word;
            }

            .barcode-container {
              width: 100%;

              display: flex;

              justify-content: center;
              align-items: center;

              overflow: hidden;

              margin: 4px auto;
            }

            .barcode-container svg {
              display: block;

              width: 100%;
              max-width: 285px;

              height: auto;
            }

            .barcode-number {
              margin-top: 2px;

              font-family:
                "Courier New",
                monospace;

              font-size: 12px;

              font-weight: 600;

              letter-spacing: 1px;

              color: #000;
            }

            .price {
              margin-top: 8px;

              font-size: 15px;

              font-weight: 700;

              color: #000;
            }

            @media print {

              @page {
                size: auto;
                margin: 0;
              }

              html,
              body {
                margin: 0;
                padding: 0;
              }

              body {
                padding: 0;
              }

              .label {
                width: 320px;

                min-height: 210px;

                margin: 0;

                border: 1px solid #000;
              }

            }

          </style>

        </head>

        <body>

          <div class="label">

            <div class="store">
              Poobalasingham Book Depot
            </div>

            <div class="product-name">
              ${productName}
            </div>

            <div class="barcode-container">
              ${barcodeSvg}
            </div>

            <div class="barcode-number">
              ${barcodeNumber}
            </div>

            <div class="price">
              Rs. ${price}
            </div>

          </div>

          <script>

            window.onload = function () {

              setTimeout(function () {

                window.print();

              }, 500);

            };

          </script>

        </body>

      </html>
    `);

    printWindow.document.close();
  };

  // ======================================================
  // JSX
  // ======================================================

  return (
    <div className="space-y-6">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold text-gray-900">
            Products
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage books and product inventory
          </p>

        </div>

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

      {/* ==================================================
          SUMMARY CARDS
      ================================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        {/* TOTAL PRODUCTS */}

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

        {/* LOW STOCK */}

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

        {/* OUT OF STOCK */}

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

      {/* ==================================================
          SEARCH
      ================================================== */}

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

      {/* ==================================================
          PRODUCT TABLE
      ================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1450px]">

            {/* ==================================================
                TABLE HEADER
            ================================================== */}

            <thead className="border-b border-gray-200 bg-gray-50">

              <tr>

                <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Product
                </th>

                <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Code
                </th>

                <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Barcode
                </th>

                <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Category
                </th>

                <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Selling Price
                </th>

                <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Stock
                </th>

                <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>

              </tr>

            </thead>

            {/* ==================================================
                TABLE BODY
            ================================================== */}

            <tbody className="divide-y divide-gray-100">

              {/* LOADING */}

              {loading ? (

                <tr>

                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    Loading products...
                  </td>

                </tr>

              ) : filteredProducts.length === 0 ? (

                /* NO PRODUCTS */

                <tr>

                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    No products found
                  </td>

                </tr>

              ) : (

                /* PRODUCTS */

                filteredProducts.map(
                  (product) => {

                    const stockQuantity =
                      Number(
                        product.stockQuantity ??
                          0,
                      );

                    const reorderLevel =
                      Number(
                        product.reorderLevel ??
                          0,
                      );

                    const isOutOfStock =
                      stockQuantity === 0;

                    const isLowStock =
                      stockQuantity > 0 &&
                      stockQuantity <=
                        reorderLevel;

                    const validEAN13 =
                      !!product.barcode &&
                      isValidEAN13(
                        product.barcode,
                      );

                    return (

                      <tr
                        key={product.id}
                        className="transition hover:bg-gray-50"
                      >

                        {/* ==================================================
                            PRODUCT
                        ================================================== */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            {product.imageUrl ? (

                              <img
                                src={`http://localhost:5000${product.imageUrl}`}
                                alt={
                                  product.productName
                                }
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
                                {
                                  product.productName
                                }
                              </p>

                              <p className="text-xs text-gray-500">
                                {product.author ||
                                  "No author"}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* ==================================================
                            CODE
                        ================================================== */}

                        <td className="px-5 py-4">

                          <p className="font-mono text-sm font-semibold text-gray-700">
                            {
                              product.productCode
                            }
                          </p>

                          {product.isbn && (

                            <p className="mt-1 text-xs text-gray-400">
                              ISBN:{" "}
                              {product.isbn}
                            </p>

                          )}

                        </td>

                        {/* ==================================================
                            BARCODE
                        ================================================== */}

                        <td className="min-w-[280px] px-5 py-4">

                          {product.barcode ? (

                            <div className="flex flex-col items-start">

                              {/* EAN-13 SVG */}

                              {validEAN13 ? (

                                <div className="w-[240px] overflow-hidden rounded-md border border-gray-100 bg-white p-1">

                                  <BarcodeSvg
                                    value={
                                      product.barcode
                                    }
                                    width={1.7}
                                    height={45}
                                  />

                                </div>

                              ) : (

                                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">

                                  <p className="text-xs font-semibold text-amber-700">
                                    Invalid EAN-13
                                  </p>

                                  <p className="mt-1 font-mono text-xs text-gray-700">
                                    {
                                      product.barcode
                                    }
                                  </p>

                                </div>

                              )}

                              {/* Barcode Number */}

                              <p className="mt-2 font-mono text-sm font-bold tracking-wide text-gray-900">
                                {
                                  product.barcode
                                }
                              </p>

                              {/* Print */}

                              <button
                                type="button"
                                onClick={() =>
                                  handlePrintBarcode(
                                    product,
                                  )
                                }
                                disabled={
                                  !validEAN13
                                }
                                className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                              >

                                <Printer
                                  size={14}
                                />

                                Print Label

                              </button>

                            </div>

                          ) : (

                            <span className="inline-flex rounded-md bg-gray-50 px-2.5 py-1.5 text-xs text-gray-400">
                              No barcode
                            </span>

                          )}

                        </td>

                        {/* ==================================================
                            CATEGORY
                        ================================================== */}

                        <td className="px-5 py-4">

                          <p className="text-sm text-gray-700">
                            {
                              product.category
                                ?.name || "-"
                            }
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {
                              product.subcategory
                                ?.name || "-"
                            }
                          </p>

                        </td>

                        {/* ==================================================
                            SELLING PRICE
                        ================================================== */}

                        <td className="whitespace-nowrap px-5 py-4">

                          <p className="text-sm font-semibold text-gray-900">

                            Rs.{" "}

                            {Number(
                              product.sellingPrice ??
                                0,
                            ).toFixed(2)}

                          </p>

                        </td>

                        {/* ==================================================
                            STOCK
                        ================================================== */}

                        <td className="px-5 py-4">

                          <p className="text-sm font-semibold text-gray-800">
                            {stockQuantity}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Reorder:{" "}
                            {reorderLevel}
                          </p>

                        </td>

                        {/* ==================================================
                            STATUS
                        ================================================== */}

                        <td className="px-5 py-4">

                          {isOutOfStock ? (

                            <span className="inline-flex whitespace-nowrap rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                              Out of Stock
                            </span>

                          ) : isLowStock ? (

                            <span className="inline-flex whitespace-nowrap rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-600">
                              Low Stock
                            </span>

                          ) : (

                            <span className="inline-flex whitespace-nowrap rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                              In Stock
                            </span>

                          )}

                        </td>

                        {/* ==================================================
                            ACTIONS
                        ================================================== */}

                        <td className="px-5 py-4">

                          <div className="flex items-center justify-end gap-2">

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  product.id,
                                )
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

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  product,
                                )
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
                  },
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}