"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      <Sidebar
        collapsed={sidebarCollapsed}
        onLogoClick={() => setSidebarCollapsed((prev) => !prev)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
