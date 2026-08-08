'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps {
  label: string;
  placeholder?: string;
  register: any;
  error?: string;
}

export default function PasswordInput({
  label,
  placeholder,
  register,
  error,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="mb-6">

      {/* Label */}

      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {/* Input */}

      <div
        className={`flex items-center rounded-xl border bg-slate-50 transition-all duration-200 text-slate-700
        ${
          error
            ? 'border-red-500'
            : 'border-slate-300 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100'
        }`}
      >
        {/* Left Icon */}

        <Lock
          size={20}
          className="ml-4 text-slate-400"
        />

        {/* Input */}

        <input
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          {...register}
          className="flex-1 bg-transparent px-4 py-4 outline-none text-black placeholder:text-slate-400"
        />

        {/* Eye */}

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="mr-4 text-slate-500 hover:text-blue-600 transition"
        >
          {showPassword ? (
            <EyeOff size={20} />
          ) : (
            <Eye size={20} />
          )}
        </button>
      </div>

      {/* Error */}

      {error && (
        <p className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}