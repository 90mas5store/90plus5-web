"use client";

import { Suspense } from 'react';
import Header from './Header';

// Fallback component while suspending
function HeaderFallback() {
    return (
        <header className="fixed top-0 left-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-16 md:h-[70px]">
                    {/* Logo placeholder */}
                    <div className="flex items-center gap-3">
                        <div className="w-[54px] h-[54px] bg-white/5 rounded-lg animate-pulse" />
                        <div className="flex flex-col gap-1">
                            <div className="w-16 h-6 bg-white/5 rounded animate-pulse" />
                            <div className="w-12 h-3 bg-white/5 rounded animate-pulse" />
                        </div>
                    </div>
                    {/* Cart button placeholder */}
                    <div className="w-10 h-10 bg-white/5 rounded-full animate-pulse" />
                </div>
            </div>
        </header>
    );
}

export default function HeaderWrapper() {
    return (
        <Suspense fallback={<HeaderFallback />}>
            <Header />
        </Suspense>
    );
}
