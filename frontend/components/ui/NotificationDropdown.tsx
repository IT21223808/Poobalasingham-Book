"use client";

import {
    Bell,
    ShoppingCart,
    BookOpen,
    Users
} from "lucide-react";

const notifications = [
    {
        id: 1,
        title: "New Order",
        message: "INV-1024 created",
        icon: ShoppingCart,
        color: "text-blue-600 bg-blue-100"
    },
    {
        id: 2,
        title: "Low Stock",
        message: "Atomic Habits only 3 left",
        icon: BookOpen,
        color: "text-red-600 bg-red-100"
    },
    {
        id: 3,
        title: "New Customer",
        message: "John David registered",
        icon: Users,
        color: "text-green-600 bg-green-100"
    }
];

export default function NotificationDropdown() {
    return (
        <div className="absolute right-0 top-14 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl">

            <div className="border-b p-4">

                <h2 className="flex items-center gap-2 text-lg font-semibold">

                    <Bell size={18} />

                    Notifications

                </h2>

            </div>

            <div>

                {notifications.map((item) => {

                    const Icon = item.icon;

                    return (

                        <div
                            key={item.id}
                            className="flex cursor-pointer items-start gap-3 border-b p-4 hover:bg-slate-50"
                        >

                            <div className={`rounded-lg p-2 ${item.color}`}>

                                <Icon size={18} />

                            </div>

                            <div>

                                <p className="font-semibold">
                                    {item.title}
                                </p>

                                <p className="text-sm text-slate-500">
                                    {item.message}
                                </p>

                            </div>

                        </div>

                    );

                })}

            </div>

            <button className="w-full p-4 text-center font-semibold text-blue-600 hover:bg-slate-50">

                View All Notifications

            </button>

        </div>
    );
}