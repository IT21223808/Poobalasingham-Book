"use client";

import { useState } from "react";

import Sidebar from "./Sidebar";
import Header from "./Header";

interface ERPLayoutProps {
  children: React.ReactNode;
}

export default function ERPLayout({
  children,
}: ERPLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed((previous) => !previous);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* Sidebar - Fixed */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onLogoClick={toggleSidebar}
      />

      {/* Right Side */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Header - Fixed */}
        <Header />

        {/* Dashboard Content - Only this scrolls */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          {children}
        </main>

      </div>

    </div>
  );
}