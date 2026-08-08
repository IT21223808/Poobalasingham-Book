import { Plus, ShoppingCart, Users, BookOpen } from "lucide-react";

const actions = [
  {
    title: "Add Book",
    icon: BookOpen,
  },
  {
    title: "New Customer",
    icon: Users,
  },
  {
    title: "Purchase Order",
    icon: ShoppingCart,
  },
  {
    title: "Create Invoice",
    icon: Plus,
  },
];

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-semibold text-slate-800">
        Quick Actions
      </h2>

      <div className="space-y-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-blue-50 hover:border-blue-300"
            >
              <Icon size={20} className="text-blue-600" />

              <span className="font-medium">
                {action.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}