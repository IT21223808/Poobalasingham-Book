'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import ERPLayout from '@/components/layout/ERPLayout';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    }
  }, [router]);

  return (
    <ERPLayout>
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <p className="mt-4">
        Welcome to Poobalasingham Book Depot ERP 🎉
      </p>
    </ERPLayout>
  );
}