'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface ERPLayoutProps {
  children: ReactNode;
}

export default function ERPLayout({ children }: ERPLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Header />

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}