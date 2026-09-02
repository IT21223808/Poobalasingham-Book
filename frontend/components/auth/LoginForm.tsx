'use client';

import { useState } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Mail, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import PasswordInput from './PasswordInput';
import { login } from '@/services/auth.service';

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

export default function LoginForm() {
  const router = useRouter();

  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: {
      remember: true,
    },
  });

const onSubmit = async (data: LoginFormData) => {
  try {
    setServerError('');

    const response = await login({
      email: data.email,
      password: data.password,
    });

    // Save access token in cookie
    Cookies.set('access_token', response.access_token, {
      expires: data.remember ? 7 : undefined,
    });

    // Save the SAME access token in localStorage
    // Reports API and other frontend API calls can use this.
    localStorage.setItem(
      'authToken',
      response.access_token,
    );

    // Save user information if needed
    if (response.user) {
      localStorage.setItem(
        'user',
        JSON.stringify(response.user),
      );

      localStorage.setItem(
        'userId',
        String(response.user.id),
      );

      localStorage.setItem(
        'loggedInUserType',
        response.user.role,
      );
    }

    router.push('/dashboard');
  } catch (error: any) {
    setServerError(
      error?.response?.data?.message?.message ||
        'Invalid email or password',
    );
  }
};

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Email */}

      <div className="mb-6">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Email Address
        </label>

        <div
          className={`flex items-center rounded-xl border bg-slate-50
          ${
            errors.email
              ? 'border-red-500'
              : 'border-slate-300 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100'
          }`}
        >
          <Mail
            className="ml-4 text-slate-400"
            size={20}
          />

          <input
            type="email"
            placeholder="admin@poobalasingham.com"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Enter a valid email',
              },
            })}
            className="flex-1 bg-transparent px-4 py-4 outline-none text-black placeholder:text-slate-400"
          />
        </div>

        {errors.email && (
          <p className="mt-2 text-sm text-red-500">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}

      <PasswordInput
        label="Password"
        placeholder="Enter your password"
        register={register('password', {
          required: 'Password is required',
        })}
        error={errors.password?.message}
      />

      {/* Server Error */}

      {serverError && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {serverError}
        </div>
      )}

      {/* Remember */}

      <div className="mb-8 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            {...register('remember')}
            className="h-4 w-4 rounded border-slate-300"
          />

          Remember Me
        </label>

        <Link
          href="/forgot-password"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Forgot Password?
        </Link>
      </div>

      {/* Login Button */}

      <button
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2
              size={18}
              className="mr-2 animate-spin"
            />

            Signing In...
          </>
        ) : (
          'Login'
        )}
      </button>

      {/* Register */}

      <p className="mt-8 text-center text-slate-600">
        Need an account?

        <Link
          href="/register"
          className="ml-2 font-semibold text-blue-600 hover:text-blue-700"
        >
          Create Account
        </Link>
      </p>
    </motion.form>
  );
}