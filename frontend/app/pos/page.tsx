"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Product, getProducts } from "@/services/product.service";
import { Category, getCategories } from "@/services/category.service";
import customerService, { Customer } from "@/services/customer.service";
import posService from "@/services/pos.service";
import { PosCartItem, SaleInvoice, HeldBill } from "@/types/pos";
import toast, { Toaster } from "react-hot-toast";

// POS Components
import PosHeader from "./components/PosHeader";
import ProductSearch from "./components/ProductSearch";
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

export default function PosPage() {
  // Master Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [heldBillsCount, setHeldBillsCount] = useState<number>(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Cart & Transaction State
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Discounts
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Held bill reference if resumed
  const [activeHeldBillId, setActiveHeldBillId] = useState<string | undefined>(undefined);
  const [isHolding, setIsHolding] = useState<boolean>(false);

  // Modals State
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState<boolean>(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState<boolean>(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);
  const [isShortcutGuideOpen, setIsShortcutGuideOpen] = useState<boolean>(false);
  const [completedSaleInvoice, setCompletedSaleInvoice] = useState<SaleInvoice | null>(null);
  // Persists the last invoice so "View Receipt" icon works even after the modal is closed
  const [lastCompletedInvoice, setLastCompletedInvoice] = useState<SaleInvoice | null>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const [prodsData, catsData, custsData, holdsData] = await Promise.all([
        getProducts().catch(() => []),
        getCategories().catch(() => []),
        customerService.getCustomers().catch(() => []),
        posService.getHeldBills().catch(() => []),
      ]);

      setProducts(prodsData);
      setCategories(catsData);
      setCustomers(custsData);
      setHeldBillsCount(holdsData.length);
    } catch (err) {
      console.error("Failed to load POS master data:", err);
      toast.error("Failed to load initial POS data.");
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived Filtered Products List
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.productName.toLowerCase().includes(query) ||
        p.productCode.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.toLowerCase().includes(query)) ||
        (p.isbn && p.isbn.toLowerCase().includes(query));

      const matchesCategory =
        selectedCategoryId === null || p.category?.id === selectedCategoryId;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  // Calculated Cart Subtotal & Grand Total
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [cart]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  // Cart Operations
  const handleAddToCart = (product: Product) => {
    const stock = product.stockQuantity ?? 0;
    if (stock <= 0) {
      toast.error(`"${product.productName}" is out of stock.`);
      return;
    }

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((item) => item.productId === product.id);
      const sellingPrice = Number(product.sellingPrice || 0);

      if (existingIdx >= 0) {
        const existing = prevCart[existingIdx];
        if (existing.quantity >= stock) {
          toast.error(`Cannot add more than available stock (${stock}).`);
          return prevCart;
        }

        const nextQty = existing.quantity + 1;
        const nextLineTotal = nextQty * sellingPrice - (existing.discountAmount || 0);
        const updated = [...prevCart];
        updated[existingIdx] = {
          ...existing,
          quantity: nextQty,
          lineTotal: nextLineTotal,
        };
        return updated;
      } else {
        const newItem: PosCartItem = {
          productId: product.id,
          productCode: product.productCode,
          productName: product.productName,
          barcode: product.barcode,
          unitPrice: sellingPrice,
          quantity: 1,
          availableStock: stock,
          discountAmount: 0,
          lineTotal: sellingPrice,
          imageUrl: product.imageUrl,
        };
        return [...prevCart, newItem];
      }
    });
  };

  const handleUpdateQty = (productId: string, newQty: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.productId === productId) {
          const validQty = Math.max(1, Math.min(newQty, item.availableStock));
          const lineTotal = validQty * item.unitPrice - (item.discountAmount || 0);
          return {
            ...item,
            quantity: validQty,
            lineTotal,
          };
        }
        return item;
      }),
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setActiveHeldBillId(undefined);
  };

  // Barcode Scanner handler
  const handleBarcodeScan = (code: string) => {
    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
        p.productCode.toLowerCase() === code.toLowerCase() ||
        (p.isbn && p.isbn.toLowerCase() === code.toLowerCase()),
    );

    if (found) {
      handleAddToCart(found);
      setSearchQuery("");
      toast.success(`Added "${found.productName}" to cart.`);
    } else {
      toast.error(`No product found with code/barcode "${code}".`);
    }
  };

  // Apply Bill Discount
  const handleApplyDiscount = (
    amt: number,
    type: "fixed" | "percentage",
    val: number,
  ) => {
    setDiscountAmount(amt);
    setDiscountType(type);
    setDiscountValue(val);
  };

  // Email Receipt handler
  const handleEmailReceipt = () => {
    if (!selectedCustomer) {
      toast.error(
        "Please select a customer with an email address to send a receipt."
      );
      return;
    }
    if (!selectedCustomer.email) {
      toast.error(
        "Customer email is not available. Please select a customer with an email address."
      );
      return;
    }
    // Backend email API is not yet implemented.
    toast(
      "Email receipt functionality requires backend email support — coming soon.",
      { icon: "ℹ️" }
    );
  };

  // View Receipt handler
  const handleViewReceipt = () => {
    if (lastCompletedInvoice) {
      setCompletedSaleInvoice(lastCompletedInvoice);
    } else {
      toast("Complete a sale first to view the receipt.", { icon: "ℹ️" });
    }
  };

  // Hold Bill operation
  const handleHoldBill = async () => {
    if (cart.length === 0) {
      toast.error("Cannot hold an empty cart.");
      return;
    }

    setIsHolding(true);
    try {
      const held = await posService.holdBill({
        customerId: selectedCustomer?.id || undefined,
        customerName: selectedCustomer?.customerName || undefined,
        cartData: {
          items: cart,
          customer: selectedCustomer,
          discountAmount,
          discountType,
          discountValue,
        },
        subtotal,
        discountAmount,
        grandTotal,
      });

      toast.success(`Bill held successfully as #${held.holdNumber}`);
      handleClearCart();
      setSelectedCustomer(null);
      loadData();
    } catch (err) {
      console.error("Failed to hold bill:", err);
      toast.error("Failed to hold bill. Please try again.");
    } finally {
      setIsHolding(false);
    }
  };

  // Resume Held Bill handler
  const handleHoldResumed = (
    resumedItems: PosCartItem[],
    resumedCustomer: Customer | null,
    resumedDiscountAmount: number,
    heldBillId: string,
  ) => {
    setCart(resumedItems);
    setSelectedCustomer(resumedCustomer);
    setDiscountAmount(resumedDiscountAmount);
    setActiveHeldBillId(heldBillId);
  };

  // Global Keyboard Shortcuts (F3, F4, F8, F9, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing shortcuts when user is typing inside input or textarea except F2
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputFocused = activeTag === "input" || activeTag === "textarea";

      if (e.key === "F3") {
        e.preventDefault();
        setIsQuickCustomerOpen(true);
      } else if (e.key === "F4") {
        e.preventDefault();
        setIsDiscountModalOpen(true);
      } else if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0) {
          handleHoldBill();
        }
      } else if (e.key === "F9") {
        e.preventDefault();
        if (cart.length > 0 && grandTotal > 0) {
          setIsPaymentModalOpen(true);
        }
      } else if (e.key === "Escape") {
        setIsQuickCustomerOpen(false);
        setIsDiscountModalOpen(false);
        setIsPaymentModalOpen(false);
        setIsHoldModalOpen(false);
        setIsReturnModalOpen(false);
        setIsShortcutGuideOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, grandTotal]);

  return (
    <div className="flex flex-col h-screen w-full min-w-0 overflow-x-hidden bg-slate-100">
      <Toaster position="top-right" />

      {/* 1. Header */}
      <PosHeader
        heldBillsCount={heldBillsCount}
        onOpenHoldModal={() => setIsHoldModalOpen(true)}
        onOpenReturnModal={() => setIsReturnModalOpen(true)}
        onOpenShortcutGuide={() => setIsShortcutGuideOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onBarcodeScan={handleBarcodeScan}
        onClearSearch={() => setSearchQuery("")}
        isLoadingProducts={isLoadingProducts}
      />

      {/* 2. Main 2-Column POS Workspace */}
  <main className="flex flex-1 min-w-0 overflow-hidden" >
  {/* LEFT COLUMN: Product Catalog & Search */}
  <section className="flex flex-1 min-w-0 flex-col overflow-hidden space-y-3 p-3">
    {/* Category Tabs */}
    <CategoryFilter
      categories={categories}
      selectedCategoryId={selectedCategoryId}
      onSelectCategory={setSelectedCategoryId}
    />
    {/* Product Grid */}
    <div className="no-scrollbar flex-1 overflow-y-auto pr-0.5">
      <ProductGrid
        products={filteredProducts}
        cartItems={cart}
        onAddToCart={handleAddToCart}
        isLoading={isLoadingProducts}
      />
    </div>
  </section>

  {/* RIGHT COLUMN: Customer & Cart */}
  <section className="w-80 sm:w-96 md:w-[400px] xl:w-[440px] shrink-0 h-full">
    <PosCart
      cartItems={cart}
      customers={customers}
      selectedCustomer={selectedCustomer}
      onSelectCustomer={setSelectedCustomer}
      onOpenNewCustomerModal={() => setIsQuickCustomerOpen(true)}
      onUpdateQty={handleUpdateQty}
      onRemoveItem={handleRemoveItem}
      onClearCart={handleClearCart}
      subtotal={subtotal}
      discountAmount={discountAmount}
      grandTotal={grandTotal}
      onOpenDiscountModal={() => setIsDiscountModalOpen(true)}
      onHoldBill={handleHoldBill}
      onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
      onEmailReceipt={handleEmailReceipt}
      onViewReceipt={handleViewReceipt}
      isHolding={isHolding}
    />
  </section>
</main>

      {/* MODALS */}

      {/* Quick Customer Creation Modal */}
      <QuickCustomerModal
        isOpen={isQuickCustomerOpen}
        onClose={() => setIsQuickCustomerOpen(false)}
        onCustomerCreated={(newCust) => {
          setSelectedCustomer(newCust);
          customerService.getCustomers().then(setCustomers);
        }}
      />

      {/* Bill Discount Modal */}
      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        subtotal={subtotal}
        currentDiscountAmount={discountAmount}
        onApplyDiscount={handleApplyDiscount}
      />

      {/* Checkout & Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cartItems={cart}
        customer={selectedCustomer}
        subtotal={subtotal}
        discountAmount={discountAmount}
        grandTotal={grandTotal}
        heldBillId={activeHeldBillId}
        onSaleSuccess={(invoice) => {
          setIsPaymentModalOpen(false);
          setCompletedSaleInvoice(invoice);
          setLastCompletedInvoice(invoice);
          handleClearCart();
          setSelectedCustomer(null);
          loadData();
        }}
      />

      {/* Receipt & Print Modal */}
      <ReceiptModal
        isOpen={completedSaleInvoice !== null}
        onClose={() => setCompletedSaleInvoice(null)}
        saleInvoice={completedSaleInvoice}
        onNewSale={() => {
          setCompletedSaleInvoice(null);
          handleClearCart();
          setSelectedCustomer(null);
        }}
      />

      {/* Held Bills Modal */}
      <HoldBillModal
        isOpen={isHoldModalOpen}
        onClose={() => setIsHoldModalOpen(false)}
        availableProducts={products}
        onHoldResumed={handleHoldResumed}
        onHeldBillsUpdated={() => {
          posService.getHeldBills().then((b) => setHeldBillsCount(b.length));
        }}
      />

      {/* Returns & Exchange Modal */}
      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => {
          setIsReturnModalOpen(false);
          loadData();
        }}
      />

      {/* Keyboard Shortcuts Overlay */}
      <KeyboardShortcutGuide
        isOpen={isShortcutGuideOpen}
        onClose={() => setIsShortcutGuideOpen(false)}
      />
    </div>
  );
}
