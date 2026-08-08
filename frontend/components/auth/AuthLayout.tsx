'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Image from "next/image";

interface AuthLayoutProps {
    title: string;
    subtitle: string;
    children: ReactNode;
}

export default function AuthLayout({
    title,
    subtitle,
    children,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid min-h-[760px] w-full max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[42%_58%]"            >
                {/* LEFT PANEL */}

                <div
                    className="relative flex flex-col justify-between overflow-hidden p-10 text-white brightness-95 contrast-110 saturate-125"
                    style={{
                        backgroundImage: `
              linear-gradient(
                rgba(8,27,69,0.45),
                rgba(20,55,150,0.60)
              ),
              url('/images/book.jpg')
            `,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',

                    }}
                >
                    {/* Background Glow */}

                    <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"></div>
                    <div className="absolute inset-0 bg-linear-to-br from-[#081B45]/60 via-transparent to-[#315BFF]/50"></div>
                    <div className="relative z-10">
                        {/* Logo */}

                        <div className="flex items-center gap-3">
                            <div className="rounded-xl p-3 backdrop-blur">
                                <Image
                                    src="/images/logo2.png"
                                    alt="Poobalasingham Book Depot"
                                    width={320}
                                    height={100}
                                    priority
                                    className="h-auto w-[70px] object-contain object-left brightness-0 invert"
                                />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold">
                                    Poobalasingham Book
                                </h2>
                                <p className="text-blue-100">
                                    Smart Bookstore Management                                </p>
                            </div>
                        </div>

                        {/* Heading */}

                        <div className="mt-24">
                            <h1 className="text-5xl font-bold leading-tight">
                                Smart ERP
                                <br />
                                for Bookshop
                                <br />
                                <span className="text-blue-300">
                                    Management
                                </span>
                            </h1>

                            <p className="mt-8 max-w-md text-lg leading-8 text-blue-100">
                                Streamline your bookstore operations with one powerful ERP platform. Manage inventory, purchasing, billing and customer records efficiently.
                            </p>
                        </div>
                    </div>

                    {/* Bottom Blur */}

                    <div className="relative z-10">
                        <div className="h-40"></div>
                    </div>
                </div>

                {/* RIGHT PANEL */}

                <div className="flex items-center justify-center bg-white px-10 py-12 lg:px-10">
                    <div className="w-full max-w-md">
                        <div className="mb-10">
                            <h2 className="text-4xl font-bold text-slate-800">
                                {title}
                            </h2>

                            <p className="mt-3 text-slate-500">
                                {subtitle}
                            </p>
                        </div>

                        {children}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}