"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Product,
  getProducts,
} from "@/services/product.service";

import {
  Category,
  getCategories,
} from "@/services/category.service";

import customerService, {
  Customer,
} from "@/services/customer.service";

import posService, {
  getOfflineQueueCount,
  startOfflineSync,
} from "@/services/pos.service";

import {
  PosCartItem,
  SaleInvoice,
} from "@/types/pos";

import toast, {
  Toaster,
} from "react-hot-toast";

/* =========================================================
   POS COMPONENTS
========================================================= */

import PosHeader from "./components/PosHeader";
import CategoryFilter from "./components/CategoryFilter";
import ProductGrid from "./components/ProductGrid";
import PosCart from "./components/PosCart";
import QuickCustomerModal from "./components/QuickCustomerModal";
import DiscountModal from "./components/DiscountModal";
import PaymentModal from "./components/PaymentModal";
import ReceiptModal from "./components/ReceiptModal";
import HoldBillModal from "./components/HoldBillModal";
import ReturnModal from "./components/ReturnModal";
import KeyboardShortcutGuide from "./components/KeyboardShortcutGuide";

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

/* =========================================================
   LOCATION TYPE
========================================================= */

interface Location {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/* =========================================================
   LOCATION API
========================================================= */

async function getLocations(): Promise<Location[]> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("authToken") ||
        sessionStorage.getItem("accessToken") ||
        sessionStorage.getItem("access_token") ||
        sessionStorage.getItem("token")
      : null;

  const response = await fetch(
    `${API_URL}/inventory/locations`,
    {
      method: "GET",

      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),
      },

      cache: "no-store",
    },
  );

  if (!response.ok) {
    const message =
      await response
        .text()
        .catch(() => "");

    throw new Error(
      message ||
        `Failed to load locations (${response.status})`,
    );
  }

  const result =
    await response.json();

  return Array.isArray(
    result?.data,
  )
    ? result.data
    : [];
}

/* =========================================================
   POS PAGE
========================================================= */

export default function PosPage() {
  /* =======================================================
     MASTER DATA
  ======================================================= */

  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [locations, setLocations] =
    useState<Location[]>([]);

  const [heldBillsCount, setHeldBillsCount] =
    useState<number>(0);

  const [isLoadingProducts, setIsLoadingProducts] =
    useState<boolean>(true);

  const [isLoadingLocations, setIsLoadingLocations] =
    useState<boolean>(true);

  /* =======================================================
     OFFLINE / SYNC
  ======================================================= */

  const [isOffline, setIsOffline] =
    useState<boolean>(
      typeof window !== "undefined"
        ? !navigator.onLine
        : false,
    );

  const [queuedSalesCount, setQueuedSalesCount] =
    useState<number>(0);

  /* =======================================================
     FILTERS
  ======================================================= */

  const [searchQuery, setSearchQuery] =
    useState<string>("");

  const [
    selectedCategoryId,
    setSelectedCategoryId,
  ] = useState<string | null>(
    null,
  );

  /* =======================================================
     LOCATION / BRANCH
  ======================================================= */

  const [
    selectedLocationId,
    setSelectedLocationId,
  ] = useState<string | null>(
    null,
  );

  /* =======================================================
     CART
  ======================================================= */

  const [cart, setCart] =
    useState<PosCartItem[]>([]);

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState<Customer | null>(
    null,
  );

  /* =======================================================
     DISCOUNT
  ======================================================= */

  const [discountAmount, setDiscountAmount] =
    useState<number>(0);

  const [discountType, setDiscountType] =
    useState<
      "fixed" | "percentage"
    >("fixed");

  const [discountValue, setDiscountValue] =
    useState<number>(0);

  /* =======================================================
     HELD BILL
  ======================================================= */

  const [
    activeHeldBillId,
    setActiveHeldBillId,
  ] = useState<string | undefined>(
    undefined,
  );

  const [isHolding, setIsHolding] =
    useState<boolean>(false);

  /* =======================================================
     MODALS
  ======================================================= */

  const [
    isQuickCustomerOpen,
    setIsQuickCustomerOpen,
  ] = useState<boolean>(false);

  const [
    isDiscountModalOpen,
    setIsDiscountModalOpen,
  ] = useState<boolean>(false);

  const [
    isPaymentModalOpen,
    setIsPaymentModalOpen,
  ] = useState<boolean>(false);

  const [
    isHoldModalOpen,
    setIsHoldModalOpen,
  ] = useState<boolean>(false);

  const [
    isReturnModalOpen,
    setIsReturnModalOpen,
  ] = useState<boolean>(false);

  const [
    isShortcutGuideOpen,
    setIsShortcutGuideOpen,
  ] = useState<boolean>(false);

  const [
    completedSaleInvoice,
    setCompletedSaleInvoice,
  ] = useState<SaleInvoice | null>(
    null,
  );

  const [
    lastCompletedInvoice,
    setLastCompletedInvoice,
  ] = useState<SaleInvoice | null>(
    null,
  );

  /* =======================================================
     QUEUE COUNT
  ======================================================= */

  const refreshQueueCount =
    useCallback(async () => {
      try {
        const count =
          await getOfflineQueueCount();

        setQueuedSalesCount(count);
      } catch (error) {
        console.error(
          "Failed to get offline queue count:",
          error,
        );
      }
    }, []);

  /* =======================================================
     NETWORK + AUTO SYNC
  ======================================================= */

  useEffect(() => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    const updateNetworkState =
      () => {
        const offline =
          !navigator.onLine;

        setIsOffline(offline);

        void refreshQueueCount();
      };

    const handleQueueUpdated =
      () => {
        void refreshQueueCount();
      };

    const handleSaleCompleted =
      () => {
        void refreshQueueCount();
      };

    /* Initial state */

    setIsOffline(
      !navigator.onLine,
    );

    void refreshQueueCount();

    /* Start automatic offline sync */

    const stopOfflineSync =
      startOfflineSync();

    window.addEventListener(
      "online",
      updateNetworkState,
    );

    window.addEventListener(
      "offline",
      updateNetworkState,
    );

    window.addEventListener(
      "pos-queue-updated",
      handleQueueUpdated,
    );

    window.addEventListener(
      "pos-sale-completed",
      handleSaleCompleted,
    );

    return () => {
      stopOfflineSync();

      window.removeEventListener(
        "online",
        updateNetworkState,
      );

      window.removeEventListener(
        "offline",
        updateNetworkState,
      );

      window.removeEventListener(
        "pos-queue-updated",
        handleQueueUpdated,
      );

      window.removeEventListener(
        "pos-sale-completed",
        handleSaleCompleted,
      );
    };
  }, [
    refreshQueueCount,
  ]);

  /* =======================================================
     LOAD POS MASTER DATA
  ======================================================= */

  const loadData =
    useCallback(async () => {
      /*
       * Never replace existing POS master data with
       * empty arrays because the browser is offline.
       */
      if (
        typeof window !== "undefined" &&
        !navigator.onLine
      ) {
        setIsLoadingProducts(false);
        setIsLoadingLocations(false);

        return;
      }

      setIsLoadingProducts(true);
      setIsLoadingLocations(true);

      try {
        const [
          prodsData,
          catsData,
          custsData,
          holdsData,
          locationsData,
        ] = await Promise.all([
          getProducts(),

          getCategories(),

          customerService.getCustomers(),

          posService.getHeldBills(),

          getLocations(),
        ]);

        setProducts(
          Array.isArray(
            prodsData,
          )
            ? prodsData
            : [],
        );

        setCategories(
          Array.isArray(
            catsData,
          )
            ? catsData
            : [],
        );

        setCustomers(
          Array.isArray(
            custsData,
          )
            ? custsData
            : [],
        );

        setHeldBillsCount(
          Array.isArray(
            holdsData,
          )
            ? holdsData.length
            : 0,
        );

        /* -------------------------------------------------
           ACTIVE LOCATIONS
        ------------------------------------------------- */

        const activeLocations =
          locationsData.filter(
            (location) =>
              location.isActive,
          );

        setLocations(
          activeLocations,
        );

        /* -------------------------------------------------
           KEEP / SELECT LOCATION
        ------------------------------------------------- */

        setSelectedLocationId(
          (current) => {
            if (
              current &&
              activeLocations.some(
                (location) =>
                  location.id ===
                  current,
              )
            ) {
              return current;
            }

            if (
              activeLocations.length >
              0
            ) {
              return activeLocations[0].id;
            }

            return null;
          },
        );
      } catch (error) {
        console.error(
          "Failed to load POS master data:",
          error,
        );

        /*
         * Only show error while actually online.
         */
        if (
          typeof window === "undefined" ||
          navigator.onLine
        ) {
          toast.error(
            "Failed to load POS data.",
          );
        }
      } finally {
        setIsLoadingProducts(false);
        setIsLoadingLocations(false);
      }
    }, []);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* =======================================================
     RELOAD MASTER DATA WHEN BACK ONLINE
  ======================================================= */

  useEffect(() => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    const handleOnline = () => {
      /*
       * Wait until the network is available,
       * then refresh master data.
       */
      if (navigator.onLine) {
        void loadData();
      }
    };

    window.addEventListener(
      "online",
      handleOnline,
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline,
      );
    };
  }, [loadData]);

  /* =======================================================
     SELECTED LOCATION
  ======================================================= */

  const selectedLocation =
    useMemo(() => {
      if (
        !selectedLocationId
      ) {
        return null;
      }

      return (
        locations.find(
          (location) =>
            location.id ===
            selectedLocationId,
        ) || null
      );
    }, [
      locations,
      selectedLocationId,
    ]);

  /* =======================================================
     FILTER PRODUCTS
  ======================================================= */

  const filteredProducts =
    useMemo(() => {
      return products.filter(
        (product) => {
          const query =
            searchQuery
              .toLowerCase()
              .trim();

          const matchesSearch =
            !query ||
            product.productName
              .toLowerCase()
              .includes(query) ||
            product.productCode
              .toLowerCase()
              .includes(query) ||
            (
              product.barcode &&
              product.barcode
                .toLowerCase()
                .includes(query)
            ) ||
            (
              product.isbn &&
              product.isbn
                .toLowerCase()
                .includes(query)
            );

          const matchesCategory =
            selectedCategoryId ===
              null ||
            product.category?.id ===
              selectedCategoryId;

          return (
            matchesSearch &&
            matchesCategory
          );
        },
      );
    }, [
      products,
      searchQuery,
      selectedCategoryId,
    ]);

  /* =======================================================
     SUBTOTAL
  ======================================================= */

  const subtotal =
    useMemo(() => {
      return cart.reduce(
        (sum, item) =>
          sum +
          Number(
            item.lineTotal || 0,
          ),
        0,
      );
    }, [cart]);

  /* =======================================================
     GRAND TOTAL
  ======================================================= */

  const grandTotal =
    useMemo(() => {
      return Math.max(
        0,
        subtotal -
          discountAmount,
      );
    }, [
      subtotal,
      discountAmount,
    ]);

  /* =======================================================
     ADD TO CART
  ======================================================= */

  const handleAddToCart =
    (product: Product) => {
      const stock =
        Number(
          product.stockQuantity ??
            0,
        );

      if (stock <= 0) {
        toast.error(
          `"${product.productName}" is out of stock.`,
        );

        return;
      }

      setCart((prevCart) => {
        const existingIndex =
          prevCart.findIndex(
            (item) =>
              item.productId ===
              product.id,
          );

        const sellingPrice =
          Number(
            product.sellingPrice ||
              0,
          );

        if (
          existingIndex >= 0
        ) {
          const existing =
            prevCart[
              existingIndex
            ];

          if (
            existing.quantity >=
            stock
          ) {
            toast.error(
              `Cannot add more than available stock (${stock}).`,
            );

            return prevCart;
          }

          const nextQty =
            existing.quantity +
            1;

          const nextLineTotal =
            nextQty *
              sellingPrice -
            Number(
              existing.discountAmount ||
                0,
            );

          const updatedCart = [
            ...prevCart,
          ];

          updatedCart[
            existingIndex
          ] = {
            ...existing,

            quantity:
              nextQty,

            lineTotal:
              Math.max(
                0,
                nextLineTotal,
              ),
          };

          return updatedCart;
        }

        const newItem: PosCartItem =
          {
            productId:
              product.id,

            productCode:
              product.productCode,

            productName:
              product.productName,

            barcode:
              product.barcode,

            unitPrice:
              sellingPrice,

            quantity: 1,

            availableStock:
              stock,

            discountAmount: 0,

            lineTotal:
              sellingPrice,

            imageUrl:
              product.imageUrl,
          };

        return [
          ...prevCart,
          newItem,
        ];
      });
    };

  /* =======================================================
     UPDATE QUANTITY
  ======================================================= */

  const handleUpdateQty =
    (
      productId: string,
      newQty: number,
    ) => {
      setCart(
        (prevCart) =>
          prevCart.map(
            (item) => {
              if (
                item.productId !==
                productId
              ) {
                return item;
              }

              const validQty =
                Math.max(
                  1,
                  Math.min(
                    Number(
                      newQty || 1,
                    ),
                    Number(
                      item.availableStock ||
                        1,
                    ),
                  ),
                );

              const lineTotal =
                validQty *
                  Number(
                    item.unitPrice ||
                      0,
                  ) -
                Number(
                  item.discountAmount ||
                    0,
                );

              return {
                ...item,

                quantity:
                  validQty,

                lineTotal:
                  Math.max(
                    0,
                    lineTotal,
                  ),
              };
            },
          ),
      );
    };

  /* =======================================================
     REMOVE ITEM
  ======================================================= */

  const handleRemoveItem =
    (productId: string) => {
      setCart(
        (prevCart) =>
          prevCart.filter(
            (item) =>
              item.productId !==
              productId,
          ),
      );
    };

  /* =======================================================
     CLEAR CART
  ======================================================= */

  const handleClearCart =
    () => {
      setCart([]);

      setDiscountAmount(0);

      setDiscountType("fixed");

      setDiscountValue(0);

      setActiveHeldBillId(
        undefined,
      );
    };

  /* =======================================================
     BARCODE SCANNER
  ======================================================= */

  const handleBarcodeScan =
    (code: string) => {
      const normalizedCode =
        code
          .toLowerCase()
          .trim();

      if (!normalizedCode) {
        return;
      }

      const found =
        products.find(
          (product) =>
            (
              product.barcode &&
              product.barcode
                .toLowerCase() ===
                normalizedCode
            ) ||
            product.productCode
              .toLowerCase() ===
              normalizedCode ||
            (
              product.isbn &&
              product.isbn
                .toLowerCase() ===
                normalizedCode
            ),
        );

      if (found) {
        handleAddToCart(found);

        setSearchQuery("");

        toast.success(
          `Added "${found.productName}" to cart.`,
        );
      } else {
        toast.error(
          `No product found with code/barcode "${code}".`,
        );
      }
    };

  /* =======================================================
     DISCOUNT
  ======================================================= */

  const handleApplyDiscount =
    (
      amount: number,
      type:
        | "fixed"
        | "percentage",
      value: number,
    ) => {
      setDiscountAmount(
        Math.max(
          0,
          Number(amount || 0),
        ),
      );

      setDiscountType(
        type,
      );

      setDiscountValue(
        Math.max(
          0,
          Number(value || 0),
        ),
      );
    };

  /* =======================================================
     EMAIL RECEIPT
  ======================================================= */

  const handleEmailReceipt =
    () => {
      if (
        !selectedCustomer
      ) {
        toast.error(
          "Please select a customer with an email address to send a receipt.",
        );

        return;
      }

      if (
        !selectedCustomer.email
      ) {
        toast.error(
          "Customer email is not available. Please select a customer with an email address.",
        );

        return;
      }

      toast(
        "Email receipt functionality requires backend email support — coming soon.",
        {
          icon: "ℹ️",
        },
      );
    };

  /* =======================================================
     VIEW RECEIPT
  ======================================================= */

  const handleViewReceipt =
    () => {
      if (
        lastCompletedInvoice
      ) {
        setCompletedSaleInvoice(
          lastCompletedInvoice,
        );

        return;
      }

      toast(
        "Complete a sale first to view the receipt.",
        {
          icon: "ℹ️",
        },
      );
    };

  /* =======================================================
     HOLD BILL
  ======================================================= */

  const handleHoldBill =
    async () => {
      if (
        cart.length === 0
      ) {
        toast.error(
          "Cannot hold an empty cart.",
        );

        return;
      }

      /*
       * Hold bill currently needs backend.
       */
      if (
        typeof window !==
          "undefined" &&
        !navigator.onLine
      ) {
        toast.error(
          "Hold Bill requires an internet connection.",
        );

        return;
      }

      setIsHolding(true);

      try {
        const held =
          await posService.holdBill({
            customerId:
              selectedCustomer?.id ||
              undefined,

            customerName:
              selectedCustomer?.customerName ||
              undefined,

            cartData: {
              items: cart,

              customer:
                selectedCustomer,

              discountAmount,

              discountType,

              discountValue,
            },

            subtotal,

            discountAmount,

            grandTotal,
          });

        toast.success(
          `Bill held successfully as #${held.holdNumber}`,
        );

        handleClearCart();

        setSelectedCustomer(
          null,
        );

        await loadData();
      } catch (error) {
        console.error(
          "Failed to hold bill:",
          error,
        );

        toast.error(
          "Failed to hold bill. Please try again.",
        );
      } finally {
        setIsHolding(false);
      }
    };

  /* =======================================================
     RESUME HELD BILL
  ======================================================= */

  const handleHoldResumed =
    (
      resumedItems: PosCartItem[],
      resumedCustomer:
        | Customer
        | null,
      resumedDiscountAmount: number,
      heldBillId: string,
    ) => {
      setCart(
        resumedItems,
      );

      setSelectedCustomer(
        resumedCustomer,
      );

      setDiscountAmount(
        Math.max(
          0,
          Number(
            resumedDiscountAmount ||
              0,
          ),
        ),
      );

      setDiscountType(
        "fixed",
      );

      setDiscountValue(
        Number(
          resumedDiscountAmount ||
            0,
        ),
      );

      setActiveHeldBillId(
        heldBillId,
      );
    };

  /* =======================================================
     APPLY LOCAL OFFLINE STOCK
  ======================================================= */

  const applyLocalOfflineStockDeduction =
    useCallback(
      (invoice: SaleInvoice) => {
        if (
          !invoice.id.startsWith(
            "offline-",
          )
        ) {
          return;
        }

        setProducts(
          (prevProducts) =>
            prevProducts.map(
              (product) => {
                const soldItem =
                  invoice.items.find(
                    (item) =>
                      item.productId ===
                      product.id,
                  );

                if (
                  !soldItem
                ) {
                  return product;
                }

                return {
                  ...product,

                  stockQuantity:
                    Math.max(
                      0,
                      Number(
                        product.stockQuantity ??
                          0,
                      ) -
                        Number(
                          soldItem.quantity ??
                            0,
                        ),
                    ),
                };
              },
            ),
        );
      },
      [],
    );

  /* =======================================================
     KEYBOARD SHORTCUTS
  ======================================================= */

  useEffect(() => {
    const handleKeyDown =
      (
        event: KeyboardEvent,
      ) => {
        if (
          event.key === "F3"
        ) {
          event.preventDefault();

          setIsQuickCustomerOpen(
            true,
          );

          return;
        }

        if (
          event.key === "F4"
        ) {
          event.preventDefault();

          setIsDiscountModalOpen(
            true,
          );

          return;
        }

        if (
          event.key === "F8"
        ) {
          event.preventDefault();

          if (
            cart.length > 0
          ) {
            void handleHoldBill();
          }

          return;
        }

        if (
          event.key === "F9"
        ) {
          event.preventDefault();

          if (
            cart.length > 0 &&
            grandTotal > 0
          ) {
            if (
              !selectedLocationId
            ) {
              toast.error(
                "Please select a branch/location before completing the sale.",
              );

              return;
            }

            setIsPaymentModalOpen(
              true,
            );
          }

          return;
        }

        if (
          event.key === "Escape"
        ) {
          setIsQuickCustomerOpen(
            false,
          );

          setIsDiscountModalOpen(
            false,
          );

          setIsPaymentModalOpen(
            false,
          );

          setIsHoldModalOpen(
            false,
          );

          setIsReturnModalOpen(
            false,
          );

          setIsShortcutGuideOpen(
            false,
          );
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    cart.length,
    grandTotal,
    selectedLocationId,
  ]);

  /* =======================================================
     OPEN PAYMENT
  ======================================================= */

  const handleOpenPayment =
    () => {
      if (
        cart.length === 0
      ) {
        toast.error(
          "Cart is empty.",
        );

        return;
      }

      if (
        grandTotal <= 0
      ) {
        toast.error(
          "Invoice total must be greater than 0.",
        );

        return;
      }

      if (
        !selectedLocationId
      ) {
        toast.error(
          "Please select a branch/location before completing the sale.",
        );

        return;
      }

      setIsPaymentModalOpen(
        true,
      );
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex h-screen w-full min-w-0 flex-col overflow-x-hidden bg-slate-100">
      <Toaster position="top-right" />

      {/* =================================================
          HEADER
      ================================================= */}

      <PosHeader
        heldBillsCount={
          heldBillsCount
        }

        onOpenHoldModal={() =>
          setIsHoldModalOpen(
            true,
          )
        }

        onOpenReturnModal={() =>
          setIsReturnModalOpen(
            true,
          )
        }

        onOpenShortcutGuide={() =>
          setIsShortcutGuideOpen(
            true,
          )
        }

        searchQuery={
          searchQuery
        }

        onSearchChange={
          setSearchQuery
        }

        onBarcodeScan={
          handleBarcodeScan
        }

        onClearSearch={() =>
          setSearchQuery("")
        }

        isLoadingProducts={
          isLoadingProducts
        }

        isOffline={
          isOffline
        }

        queuedSalesCount={
          queuedSalesCount
        }
      />

      {/* =================================================
          BRANCH / LOCATION
      ================================================= */}

      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            POS Branch / Location
          </p>

          <p className="text-sm font-black text-slate-900">
            {selectedLocation
              ? selectedLocation.name
              : isLoadingLocations
              ? "Loading..."
              : "No location selected"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {locations.length === 0 &&
            !isLoadingLocations && (
              <span className="text-xs font-bold text-red-600">
                No active locations
                available
              </span>
            )}

          <select
            value={
              selectedLocationId ||
              ""
            }
            onChange={(event) =>
              setSelectedLocationId(
                event.target.value ||
                  null,
              )
            }
            disabled={
              isLoadingLocations ||
              locations.length === 0
            }
            className="min-w-[220px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">
              Select Branch / Location
            </option>

            {locations.map(
              (location) => (
                <option
                  key={
                    location.id
                  }
                  value={
                    location.id
                  }
                >
                  {
                    location.name
                  }
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      {/* =================================================
          MAIN POS WORKSPACE
      ================================================= */}

      <main className="flex min-w-0 flex-1 overflow-hidden">
        {/* LEFT */}
        <section className="flex min-w-0 flex-1 flex-col space-y-3 overflow-hidden p-3">
          <CategoryFilter
            categories={
              categories
            }
            selectedCategoryId={
              selectedCategoryId
            }
            onSelectCategory={
              setSelectedCategoryId
            }
          />

          <div className="no-scrollbar flex-1 overflow-y-auto pr-0.5">
            <ProductGrid
              products={
                filteredProducts
              }
              cartItems={cart}
              onAddToCart={
                handleAddToCart
              }
              isLoading={
                isLoadingProducts
              }
            />
          </div>
        </section>

        {/* RIGHT */}
        <section className="h-full w-80 shrink-0 sm:w-96 md:w-[400px] xl:w-[440px]">
          <PosCart
            cartItems={cart}
            customers={customers}
            selectedCustomer={
              selectedCustomer
            }
            onSelectCustomer={
              setSelectedCustomer
            }
            onOpenNewCustomerModal={() =>
              setIsQuickCustomerOpen(
                true,
              )
            }
            onUpdateQty={
              handleUpdateQty
            }
            onRemoveItem={
              handleRemoveItem
            }
            onClearCart={
              handleClearCart
            }
            subtotal={
              subtotal
            }
            discountAmount={
              discountAmount
            }
            grandTotal={
              grandTotal
            }
            onOpenDiscountModal={() =>
              setIsDiscountModalOpen(
                true,
              )
            }
            onHoldBill={
              handleHoldBill
            }
            onOpenPaymentModal={
              handleOpenPayment
            }
            onEmailReceipt={
              handleEmailReceipt
            }
            onViewReceipt={
              handleViewReceipt
            }
            isHolding={
              isHolding
            }
          />
        </section>
      </main>

      {/* =================================================
          QUICK CUSTOMER
      ================================================= */}

      <QuickCustomerModal
        isOpen={
          isQuickCustomerOpen
        }
        onClose={() =>
          setIsQuickCustomerOpen(
            false,
          )
        }
        onCustomerCreated={(
          newCustomer,
        ) => {
          setSelectedCustomer(
            newCustomer,
          );

          if (
            typeof window !==
              "undefined" &&
            navigator.onLine
          ) {
            customerService
              .getCustomers()
              .then(
                setCustomers,
              )
              .catch(
                (error) => {
                  console.error(
                    "Failed to refresh customers:",
                    error,
                  );
                },
              );
          }
        }}
      />

      {/* =================================================
          DISCOUNT
      ================================================= */}

      <DiscountModal
        isOpen={
          isDiscountModalOpen
        }
        onClose={() =>
          setIsDiscountModalOpen(
            false,
          )
        }
        subtotal={
          subtotal
        }
        currentDiscountAmount={
          discountAmount
        }
        onApplyDiscount={
          handleApplyDiscount
        }
      />

      {/* =================================================
          PAYMENT
      ================================================= */}

      <PaymentModal
        isOpen={
          isPaymentModalOpen
        }
        onClose={() =>
          setIsPaymentModalOpen(
            false,
          )
        }
        cartItems={
          cart
        }
        customer={
          selectedCustomer
        }
        subtotal={
          subtotal
        }
        discountAmount={
          discountAmount
        }
        grandTotal={
          grandTotal
        }
        heldBillId={
          activeHeldBillId
        }
        locationId={
          selectedLocationId
        }
        onSaleSuccess={(
          invoice,
        ) => {
          /* -----------------------------------------------
             CLOSE PAYMENT
          ------------------------------------------------ */

          setIsPaymentModalOpen(
            false,
          );

          /* -----------------------------------------------
             STORE RECEIPT
          ------------------------------------------------ */

          setCompletedSaleInvoice(
            invoice,
          );

          setLastCompletedInvoice(
            invoice,
          );

          /* -----------------------------------------------
             OFFLINE LOCAL STOCK
          ------------------------------------------------ */

          if (
            invoice.id.startsWith(
              "offline-",
            )
          ) {
            applyLocalOfflineStockDeduction(
              invoice,
            );
          }

          /* -----------------------------------------------
             CLEAR CART
          ------------------------------------------------ */

          handleClearCart();

          setSelectedCustomer(
            null,
          );

          /* -----------------------------------------------
             IMPORTANT:
             Do NOT reload backend data while offline.
          ------------------------------------------------ */

          if (
            typeof window !==
              "undefined" &&
            navigator.onLine
          ) {
            void loadData();
          }

          /* -----------------------------------------------
             Refresh queue
          ------------------------------------------------ */

          void refreshQueueCount();
        }}
      />

      {/* =================================================
          RECEIPT
      ================================================= */}

      <ReceiptModal
        isOpen={
          completedSaleInvoice !==
          null
        }
        onClose={() =>
          setCompletedSaleInvoice(
            null,
          )
        }
        saleInvoice={
          completedSaleInvoice
        }
        onNewSale={() => {
          setCompletedSaleInvoice(
            null,
          );

          handleClearCart();

          setSelectedCustomer(
            null,
          );
        }}
      />

      {/* =================================================
          HELD BILLS
      ================================================= */}

      <HoldBillModal
        isOpen={
          isHoldModalOpen
        }
        onClose={() =>
          setIsHoldModalOpen(
            false,
          )
        }
        availableProducts={
          products
        }
        onHoldResumed={
          handleHoldResumed
        }
        onHeldBillsUpdated={() => {
          if (
            typeof window !==
              "undefined" &&
            !navigator.onLine
          ) {
            return;
          }

          posService
            .getHeldBills()
            .then(
              (bills) =>
                setHeldBillsCount(
                  bills.length,
                ),
            )
            .catch(
              (error) => {
                console.error(
                  "Failed to refresh held bills:",
                  error,
                );
              },
            );
        }}
      />

      {/* =================================================
          RETURNS
      ================================================= */}

      <ReturnModal
        isOpen={
          isReturnModalOpen
        }
        onClose={() => {
          setIsReturnModalOpen(
            false,
          );

          if (
            typeof window !==
              "undefined" &&
            navigator.onLine
          ) {
            void loadData();
          }
        }}
      />

      {/* =================================================
          SHORTCUT GUIDE
      ================================================= */}

      <KeyboardShortcutGuide
        isOpen={
          isShortcutGuideOpen
        }
        onClose={() =>
          setIsShortcutGuideOpen(
            false,
          )
        }
      />
    </div>
  );
}