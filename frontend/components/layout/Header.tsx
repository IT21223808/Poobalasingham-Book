'use client';

import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';

export default function Header() {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-gray-600">
          Admin User
        </span>

        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}