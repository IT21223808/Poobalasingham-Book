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
  getOpeningBalance,
  saveOpeningBalance,
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
   POS PAGE
========================================================= */

export default function PosPage() {
  /* =======================================================
     MASTER DATA
  ======================================================= */

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [heldBillsCount, setHeldBillsCount] =
    useState<number>(0);

  const [isLoadingProducts, setIsLoadingProducts] =
    useState<boolean>(true);

  /* =======================================================
     LOGGED-IN USER / BRANCH
  ======================================================= */

  const [userLocationId, setUserLocationId] =
    useState<string | null>(null);

  const [userLocationName, setUserLocationName] =
    useState<string>("");

  const [isLoadingUserLocation, setIsLoadingUserLocation] =
    useState<boolean>(true);

  /* =======================================================
     OFFLINE / SYNC
  ======================================================= */

  const [isOffline, setIsOffline] = useState<boolean>(
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
  ] = useState<string | null>(null);

  /* =======================================================
     OPENING BALANCE
  ======================================================= */

  const [openingBalance, setOpeningBalance] =
    useState<number>(0);

  const [
    isOpeningBalanceModalOpen,
    setIsOpeningBalanceModalOpen,
  ] = useState<boolean>(false);

  const [
    openingBalanceInput,
    setOpeningBalanceInput,
  ] = useState<string>("");

  const [
    isLoadingOpeningBalance,
    setIsLoadingOpeningBalance,
  ] = useState<boolean>(false);

  const [
    isSavingOpeningBalance,
    setIsSavingOpeningBalance,
  ] = useState<boolean>(false);

  const [
    hasOpeningBalance,
    setHasOpeningBalance,
  ] = useState<boolean>(false);

  /* =======================================================
     CART
  ======================================================= */

  const [cart, setCart] =
    useState<PosCartItem[]>([]);

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState<Customer | null>(null);

  /* =======================================================
     DISCOUNT
  ======================================================= */

  const [
    discountAmount,
    setDiscountAmount,
  ] = useState<number>(0);

  const [
    discountType,
    setDiscountType,
  ] = useState<"fixed" | "percentage">("fixed");

  const [
    discountValue,
    setDiscountValue,
  ] = useState<number>(0);

  /* =======================================================
     HELD BILL
  ======================================================= */

  const [
    activeHeldBillId,
    setActiveHeldBillId,
  ] = useState<string | undefined>(undefined);

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

  /* =======================================================
     COMPLETED SALE / RECEIPT
  ======================================================= */

  const [
    completedSaleInvoice,
    setCompletedSaleInvoice,
  ] = useState<SaleInvoice | null>(null);

  const [
    lastCompletedInvoice,
    setLastCompletedInvoice,
  ] = useState<SaleInvoice | null>(null);

  const [
    completedCustomerEmail,
    setCompletedCustomerEmail,
  ] = useState<string | null>(null);

  /* =======================================================
     LOAD LOGGED-IN USER BRANCH
  ======================================================= */

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedUser =
        localStorage.getItem("user");

      if (!storedUser) {
        toast.error(
          "Logged-in user information not found. Please login again.",
        );
        return;
      }

      const user = JSON.parse(storedUser);

      /*
       * IMPORTANT:
       *
       * Branch comes from authenticated user.
       *
       * POS does NOT allow cashier to manually
       * select/change branch.
       */

      const locationId =
        user?.locationId ??
        user?.location?.id ??
        localStorage.getItem("userLocationId") ??
        null;

      const locationName =
        user?.location?.name ??
        localStorage.getItem("userLocationName") ??
        "";

      if (!locationId) {
        toast.error(
          "Your account is not assigned to a branch/location.",
        );
        return;
      }

      setUserLocationId(String(locationId));

      setUserLocationName(
        locationName || "Assigned Branch",
      );
    } catch (error) {
      console.error(
        "Failed to load logged-in user location:",
        error,
      );

      toast.error(
        "Failed to load user branch information.",
      );
    } finally {
      setIsLoadingUserLocation(false);
    }
  }, []);

  /* =======================================================
     REFRESH OFFLINE QUEUE COUNT
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
    if (typeof window === "undefined") {
      return;
    }

    const updateNetworkState = () => {
      const offline = !navigator.onLine;

      setIsOffline(offline);

      void refreshQueueCount();
    };

    const handleQueueUpdated = () => {
      void refreshQueueCount();
    };

    const handleSaleCompleted = () => {
      void refreshQueueCount();
    };

    setIsOffline(!navigator.onLine);

    void refreshQueueCount();

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
  }, [refreshQueueCount]);

  /* =======================================================
     LOAD POS MASTER DATA
  ======================================================= */

  const loadData =
    useCallback(async () => {
      if (
        typeof window !== "undefined" &&
        !navigator.onLine
      ) {
        setIsLoadingProducts(false);
        return;
      }

      setIsLoadingProducts(true);

      try {
        const [
          prodsData,
          catsData,
          custsData,
          holdsData,
        ] = await Promise.all([
          getProducts(),
          getCategories(),
          customerService.getCustomers(),
          posService.getHeldBills(),
        ]);

        setProducts(
          Array.isArray(prodsData)
            ? prodsData
            : [],
        );

        setCategories(
          Array.isArray(catsData)
            ? catsData
            : [],
        );

        setCustomers(
          Array.isArray(custsData)
            ? custsData
            : [],
        );

        setHeldBillsCount(
          Array.isArray(holdsData)
            ? holdsData.length
            : 0,
        );
      } catch (error) {
        console.error(
          "Failed to load POS master data:",
          error,
        );

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
      }
    }, []);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* =======================================================
     RELOAD WHEN ONLINE
  ======================================================= */

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOnline = () => {
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
     LOAD OPENING BALANCE
  ======================================================= */

  useEffect(() => {
    /*
     * No branch = no opening balance.
     */

    if (!userLocationId) {
      setOpeningBalance(0);
      setHasOpeningBalance(false);
      setOpeningBalanceInput("");
      setIsOpeningBalanceModalOpen(false);
      setIsLoadingOpeningBalance(false);

      return;
    }

    let cancelled = false;

    const loadOpeningBalance =
      async () => {
        if (
          typeof window !== "undefined" &&
          !navigator.onLine
        ) {
          setIsLoadingOpeningBalance(false);
          return;
        }

        setIsLoadingOpeningBalance(true);

        try {
          /*
           * DO NOT SEND locationId.
           *
           * Backend must determine:
           *
           * req.user.locationId
           * req.user.tillId
           *
           * from JWT.
           */

          const result =
            await getOpeningBalance();

          if (cancelled) {
            return;
          }

          if (result) {
            const amount =
              Number(
                result.openingBalance || 0,
              );

            setOpeningBalance(amount);

            setHasOpeningBalance(true);

            setOpeningBalanceInput(
              amount.toFixed(2),
            );

            setIsOpeningBalanceModalOpen(
              false,
            );
          } else {
            setOpeningBalance(0);

            setHasOpeningBalance(false);

            setOpeningBalanceInput("");

            setIsOpeningBalanceModalOpen(
              true,
            );
          }
        } catch (error) {
          if (cancelled) {
            return;
          }

          console.error(
            "Failed to load opening balance:",
            error,
          );

          toast.error(
            "Failed to load opening balance.",
          );
        } finally {
          if (!cancelled) {
            setIsLoadingOpeningBalance(false);
          }
        }
      };

    void loadOpeningBalance();

    return () => {
      cancelled = true;
    };
  }, [userLocationId]);

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
            selectedCategoryId === null ||
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
          product.stockQuantity ?? 0,
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
            product.sellingPrice || 0,
          );

        if (existingIndex >= 0) {
          const existing =
            prevCart[existingIndex];

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
            existing.quantity + 1;

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
            quantity: nextQty,
            lineTotal:
              Math.max(
                0,
                nextLineTotal,
              ),
          };

          return updatedCart;
        }

        const newItem: PosCartItem = {
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

      setDiscountType(type);

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
    async () => {
      if (
        !lastCompletedInvoice
      ) {
        toast.error(
          "Complete a sale first before sending the receipt.",
        );
        return;
      }

      if (
        !completedCustomerEmail
      ) {
        toast.error(
          "Customer email is not available for this receipt.",
        );
        return;
      }

      if (
        typeof window !== "undefined" &&
        !navigator.onLine
      ) {
        toast.error(
          "Email receipt requires an internet connection.",
        );
        return;
      }

      const email =
        completedCustomerEmail.trim();

      if (!email) {
        toast.error(
          "Customer email is not available for this receipt.",
        );
        return;
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(email)
      ) {
        toast.error(
          "Please provide a valid customer email address.",
        );
        return;
      }

      try {
        toast.loading(
          "Sending receipt...",
          {
            id: "email-receipt",
          },
        );

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem(
                "authToken",
              ) ||
              localStorage.getItem(
                "accessToken",
              ) ||
              localStorage.getItem(
                "access_token",
              ) ||
              localStorage.getItem(
                "token",
              ) ||
              sessionStorage.getItem(
                "authToken",
              ) ||
              sessionStorage.getItem(
                "accessToken",
              ) ||
              sessionStorage.getItem(
                "access_token",
              ) ||
              sessionStorage.getItem(
                "token",
              )
            : null;

        if (!token) {
          throw new Error(
            "Authentication token not found. Please login again.",
          );
        }

        const response =
          await fetch(
            `${API_URL}/pos/sales/${lastCompletedInvoice.id}/email-receipt`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${token}`,
              },
              body: JSON.stringify({
                email,
              }),
            },
          );

        const result =
          await response
            .json()
            .catch(
              () => null,
            );

        if (!response.ok) {
          const message =
            Array.isArray(
              result?.message,
            )
              ? result.message.join(
                  ", ",
                )
              : result?.message ||
                "Failed to send email receipt.";

          throw new Error(
            message,
          );
        }

        toast.success(
          `Receipt sent successfully to ${email}`,
          {
            id: "email-receipt",
          },
        );
      } catch (error) {
        console.error(
          "Failed to send email receipt:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to send email receipt. Please try again.",
          {
            id: "email-receipt",
          },
        );
      }
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
      if (!userLocationId) {
        toast.error(
          "Your account is not assigned to a branch/location.",
        );
        return;
      }

      if (cart.length === 0) {
        toast.error(
          "Cannot hold an empty cart.",
        );
        return;
      }

      if (
        typeof window !== "undefined" &&
        !navigator.onLine
      ) {
        toast.error(
          "Hold Bill requires an internet connection.",
        );
        return;
      }

      setIsHolding(true);

      try {
        /*
         * IMPORTANT:
         *
         * locationId is NOT sent.
         *
         * Backend gets locationId/tillId
         * from authenticated JWT.
         */

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

        setSelectedCustomer(null);

        await loadData();
      } catch (error) {
        console.error(
          "Failed to hold bill:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to hold bill. Please try again.",
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

                if (!soldItem) {
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
     SAVE OPENING BALANCE
  ======================================================= */

  const handleSaveOpeningBalance =
    async () => {
      if (!userLocationId) {
        toast.error(
          "Your account is not assigned to a branch/location.",
        );
        return;
      }

      if (
        typeof window !== "undefined" &&
        !navigator.onLine
      ) {
        toast.error(
          "Opening balance requires an internet connection.",
        );
        return;
      }

      const amount =
        Number(
          openingBalanceInput,
        );

      if (
        !Number.isFinite(amount) ||
        amount < 0
      ) {
        toast.error(
          "Please enter a valid opening balance.",
        );
        return;
      }

      setIsSavingOpeningBalance(
        true,
      );

      try {
        /*
         * IMPORTANT:
         *
         * Do NOT send locationId.
         *
         * Backend determines:
         *
         * locationId = JWT user location
         * tillId     = JWT user till
         */

        const result =
          await saveOpeningBalance(
            amount,
          );

        const savedAmount =
          Number(
            result.openingBalance ||
              0,
          );

        setOpeningBalance(
          savedAmount,
        );

        setOpeningBalanceInput(
          savedAmount.toFixed(2),
        );

        setHasOpeningBalance(
          true,
        );

        setIsOpeningBalanceModalOpen(
          false,
        );

        toast.success(
          "Opening balance saved successfully.",
        );
      } catch (error) {
        console.error(
          "Failed to save opening balance:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to save opening balance.",
        );
      } finally {
        setIsSavingOpeningBalance(
          false,
        );
      }
    };

  /* =======================================================
     KEYBOARD SHORTCUTS
  ======================================================= */

  useEffect(() => {
    const handleKeyDown =
      (
        event: KeyboardEvent,
      ) => {
        if (event.key === "F3") {
          event.preventDefault();

          setIsQuickCustomerOpen(
            true,
          );

          return;
        }

        if (event.key === "F4") {
          event.preventDefault();

          setIsDiscountModalOpen(
            true,
          );

          return;
        }

        if (event.key === "F8") {
          event.preventDefault();

          if (
            cart.length > 0
          ) {
            void handleHoldBill();
          }

          return;
        }

        if (event.key === "F9") {
          event.preventDefault();

          if (
            cart.length > 0 &&
            grandTotal > 0
          ) {
            handleOpenPayment();
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

          if (
            hasOpeningBalance
          ) {
            setIsOpeningBalanceModalOpen(
              false,
            );
          }
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
    hasOpeningBalance,
    userLocationId,
  ]);

  /* =======================================================
     OPEN PAYMENT
  ======================================================= */

  const handleOpenPayment =
    () => {
      if (cart.length === 0) {
        toast.error(
          "Cart is empty.",
        );
        return;
      }

      if (grandTotal <= 0) {
        toast.error(
          "Invoice total must be greater than 0.",
        );
        return;
      }

      if (!userLocationId) {
        toast.error(
          "Your account is not assigned to a branch/location.",
        );
        return;
      }

      if (
        !hasOpeningBalance
      ) {
        toast.error(
          "Please set the opening balance before completing the sale.",
        );

        setIsOpeningBalanceModalOpen(
          true,
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
        openingBalance={
          openingBalance
        }
        branchName={
          isLoadingUserLocation
            ? "Loading..."
            : userLocationName ||
              "No Branch Assigned"
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
              cartItems={
                cart
              }
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
            cartItems={
              cart
            }
            customers={
              customers
            }
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
          OPENING BALANCE
      ================================================= */}

      {isOpeningBalanceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <div className="mb-5">
              <h2 className="text-xl font-extrabold text-slate-900">
                Opening Balance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter the opening cash
                balance for this POS
                branch.
              </p>

              {userLocationName && (
                <p className="mt-2 text-sm font-bold text-blue-600">
                  Branch:{" "}
                  {userLocationName}
                </p>
              )}
            </div>

            <label className="mb-2 block text-sm font-bold text-slate-700">
              Opening Cash Balance
            </label>

            <div className="flex items-center rounded-xl border border-slate-300 bg-white px-3 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20">

              <span className="mr-2 text-sm font-bold text-slate-500">
                Rs.
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  openingBalanceInput
                }
                onChange={(event) =>
                  setOpeningBalanceInput(
                    event.target.value,
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();

                    void handleSaveOpeningBalance();
                  }
                }}
                autoFocus
                disabled={
                  isSavingOpeningBalance
                }
                className="w-full bg-transparent py-3 text-lg font-bold text-slate-900 outline-none disabled:opacity-50"
                placeholder="0.00"
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">

              {hasOpeningBalance && (
                <button
                  type="button"
                  onClick={() =>
                    setIsOpeningBalanceModalOpen(
                      false,
                    )
                  }
                  disabled={
                    isSavingOpeningBalance
                  }
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  void handleSaveOpeningBalance()
                }
                disabled={
                  isSavingOpeningBalance ||
                  isLoadingOpeningBalance ||
                  !userLocationId
                }
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingOpeningBalance
                  ? "Saving..."
                  : "Save Opening Balance"}
              </button>
            </div>
          </div>
        </div>
      )}

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
          userLocationId ?? undefined
        }

        onSaleSuccess={(
          invoice,
        ) => {
          /* CLOSE PAYMENT */

          setIsPaymentModalOpen(
            false,
          );

          /* STORE RECEIPT */

          setCompletedSaleInvoice(
            invoice,
          );

          setLastCompletedInvoice(
            invoice,
          );

          /*
           * Save customer email before
           * clearing selected customer.
           */

          setCompletedCustomerEmail(
            selectedCustomer?.email?.trim() ||
              null,
          );

          /* OFFLINE LOCAL STOCK */

          if (
            invoice.id.startsWith(
              "offline-",
            )
          ) {
            applyLocalOfflineStockDeduction(
              invoice,
            );
          }

          /* CLEAR CART */

          handleClearCart();

          setSelectedCustomer(
            null,
          );

          /*
           * Reload backend only when online.
           */

          if (
            typeof window !==
              "undefined" &&
            navigator.onLine
          ) {
            void loadData();
          }

          /* REFRESH OFFLINE QUEUE */

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
        onClose={() => {
          setCompletedSaleInvoice(
            null,
          );
        }}
        saleInvoice={
          completedSaleInvoice
        }
        customerEmail={
          completedCustomerEmail
        }
        onEmailReceipt={
          handleEmailReceipt
        }
        onNewSale={() => {
          setCompletedSaleInvoice(
            null,
          );

          setCompletedCustomerEmail(
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
            .then((bills) =>
              setHeldBillsCount(
                bills.length,
              ),
            )
            .catch((error) => {
              console.error(
                "Failed to refresh held bills:",
                error,
              );
            });
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