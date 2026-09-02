"use client";

import { useEffect, useState } from "react";
import { HeldBill, PosCartItem } from "@/types/pos";
import { Customer } from "@/services/customer.service";
import posService from "@/services/pos.service";
import { Product } from "@/services/product.service";
import { X, PauseCircle, Play, Trash2, Clock, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface HoldBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableProducts: Product[];
  onHoldResumed: (
    items: PosCartItem[],
    customer: Customer | null,
    discountAmount: number,
    heldBillId: string,
  ) => void;
  onHeldBillsUpdated: () => void;
}

export default function HoldBillModal({
  isOpen,
  onClose,
  availableProducts,
  onHoldResumed,
  onHeldBillsUpdated,
}: HoldBillModalProps) {
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resumingId, setResumingId] = useState<string | null>(null);

  const fetchHeldBills = async () => {
    setIsLoading(true);
    try {
      const data = await posService.getHeldBills();
      setHeldBills(data);
      onHeldBillsUpdated();
    } catch (err) {
      console.error("Failed to fetch held bills:", err);
      toast.error("Failed to load held bills.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHeldBills();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResume = async (bill: HeldBill) => {
    setResumingId(bill.id);
    try {
      const savedItems: PosCartItem[] = bill.cartData?.items || [];
      const validatedItems: PosCartItem[] = [];
      const outOfStockNames: string[] = [];

      // Revalidate product existence and current stock
      for (const item of savedItems) {
        const liveProduct = availableProducts.find((p) => p.id === item.productId);
        if (!liveProduct) {
          outOfStockNames.push(`${item.productName} (Item no longer available)`);
          continue;
        }

        const liveStock = liveProduct.stockQuantity ?? 0;
        if (liveStock <= 0) {
          outOfStockNames.push(`${item.productName} (Out of stock)`);
          continue;
        }

        const liveUnitPrice = Number(liveProduct.sellingPrice || item.unitPrice);
        const validQty = Math.min(Number(item.quantity), liveStock);
        if (validQty < Number(item.quantity)) {
          toast.error(
            `Stock for "${item.productName}" reduced from ${item.quantity} to available stock (${validQty}).`,
          );
        }

        const itemDiscount = Number(item.discountAmount) || 0;
        const lineTotal = Math.max(0, liveUnitPrice * validQty - itemDiscount);

        validatedItems.push({
          ...item,
          availableStock: liveStock,
          unitPrice: liveUnitPrice,
          quantity: validQty,
          discountAmount: itemDiscount,
          lineTotal,
          // ensure all numeric fields are real numbers, not JSONB strings
          imageUrl: item.imageUrl || undefined,
        });
      }

      if (outOfStockNames.length > 0) {
        toast.error(`Removed unavailable items: ${outOfStockNames.join(", ")}`);
      }

      if (validatedItems.length === 0) {
        toast.error("None of the held items are currently available in stock.");
        setResumingId(null);
        return;
      }

      const customer: Customer | null = bill.cartData?.customer || null;
      const discountAmount = Number(bill.discountAmount) || 0;

      onHoldResumed(validatedItems, customer, discountAmount, bill.id);
      toast.success(`Bill #${bill.holdNumber} resumed.`);
      onClose();
    } catch (err) {
      console.error("Failed to resume held bill:", err);
      toast.error("Failed to resume held bill.");
    } finally {
      setResumingId(null);
    }
  };

  const handleDelete = async (id: string, holdNumber: string) => {
    try {
      await posService.deleteHeldBill(id);
      toast.success(`Held bill #${holdNumber} deleted.`);
      fetchHeldBills();
    } catch (err) {
      toast.error("Failed to delete held bill.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <PauseCircle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Held Bills</h3>
              <p className="text-xs text-slate-500 font-medium">
                Select a held bill to restore cart & customer details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-slate-400">
              <Loader2 size={24} className="animate-spin text-amber-600" />
            </div>
          ) : heldBills.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
              <PauseCircle size={32} className="text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No active held bills</p>
              <p className="text-xs text-slate-500">Hold incomplete customer carts to process them later.</p>
            </div>
          ) : (
            <div className="no-scrollbar max-h-80 overflow-y-auto space-y-3">
              {heldBills.map((bill) => {
                const itemsCount = bill.cartData?.items?.length || 0;
                return (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-amber-400 hover:shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {bill.holdNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {bill.customerName || "Walk-in Customer"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(bill.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span>{itemsCount} item(s)</span>
                        <span className="font-extrabold text-slate-900">
                          Rs. {Number(bill.grandTotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={resumingId === bill.id}
                        onClick={() => handleResume(bill)}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-600 disabled:opacity-50"
                      >
                        {resumingId === bill.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Play size={14} />
                        )}
                        <span>Resume</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(bill.id, bill.holdNumber)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete held bill"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
