'use client';

import { useForm } from 'react-hook-form';
import { login } from '@/services/auth.service';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const router = useRouter();

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await login(data);
      Cookies.set('access_token', response.access_token);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      // alert('Invalid email or password');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold">
          Poobalasingham ERP
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
              })}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            {errors.email && (
              <p className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Password
            </label>

            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
              })}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            {errors.password && (
              <p className="mt-1 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}